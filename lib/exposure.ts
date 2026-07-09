// Executive-view money model. Pure derivations over the deterministic engine's
// findings (lib/engine.ts). Everything here is browser-only report-view data —
// none of it is added to FindingsPayload (the only structure allowed to leave
// the browser, R13). Exposure quantifies downtime cost; it never prices a fix.

import {
  placementOf,
  type DeploymentModel,
  type FlagCode,
  type Placement,
  type RiskFlag,
  type Tier,
  type WorkloadResult,
} from "./engine";
import { ARO_BASE, ARO_MAX, ARO_PER_CRITICAL_FLAG } from "./calibration";

/** A workload with no recovery path — its loss is unbounded, never a number. */
export function isCatastrophic(r: WorkloadResult): boolean {
  return r.achievableRtoMin === null;
}

/** Human list of unrecoverable workloads with their criticality, e.g.
 *  "ERP (Critical), CRM (Important)". The criticality label is supplied by the
 *  caller so this stays i18n-free. Browser-only (real names) — never enters the
 *  findings payload. Shared by both lenses so their wording can't drift. */
export function catastrophicList(
  results: WorkloadResult[],
  critLabel: (tier: Tier) => string,
): string {
  return results
    .filter(isCatastrophic)
    .map((r) => `${r.workload.name} (${critLabel(r.workload.tier)})`)
    .join(", ");
}

/** Money exposure for one workload = downtime hours × cost/hour. Returns null
 *  when the workload is catastrophic (no finite figure) OR no cost was supplied
 *  — use isCatastrophic() to tell the two apart. Assumes independent recovery
 *  (no shared-pipe restore contention), so the figure is a lower bound. */
export function workloadExposure(r: WorkloadResult): number | null {
  const cost = r.workload.costPerHourDowntime;
  if (r.achievableRtoMin === null) return null;
  if (cost == null || !Number.isFinite(cost) || cost <= 0) return null;
  const exposure = Math.round((r.achievableRtoMin / 60) * cost);
  return Number.isFinite(exposure) ? exposure : null; // guard absurd overflow
}

/** Annualized loss expectancy (R14): per-incident exposure × the annualized
 *  rate of occurrence, which rises with each unresolved critical gap (capped).
 *  Deterministic and honest — an expected annual figure, not an inflated one. */
export function annualizedLoss(perIncidentIDR: number, criticalFlags: number): number {
  if (!Number.isFinite(perIncidentIDR) || perIncidentIDR <= 0) return 0;
  const aro = Math.min(ARO_MAX, ARO_BASE + Math.max(0, criticalFlags) * ARO_PER_CRITICAL_FLAG);
  return Math.round(perIncidentIDR * aro);
}

export interface AggregateExposure {
  /** sum of finite, monetized exposures — a lower bound, excludes catastrophic */
  total: number;
  monetizedCount: number;
  /** unrecoverable workloads, surfaced alongside the total, never folded in */
  catastrophicCount: number;
  hasCost: boolean;
}

export function aggregateExposure(results: WorkloadResult[]): AggregateExposure {
  let total = 0;
  let monetizedCount = 0;
  let catastrophicCount = 0;
  let hasCost = false;
  for (const r of results) {
    const cost = r.workload.costPerHourDowntime;
    if (cost != null && Number.isFinite(cost) && cost > 0) hasCost = true;
    if (isCatastrophic(r)) {
      catastrophicCount++;
      continue;
    }
    const e = workloadExposure(r);
    if (e !== null) {
      total += e;
      monetizedCount++;
    }
  }
  return { total, monetizedCount, catastrophicCount, hasCost };
}

export type PostureBand = "strong" | "developing" | "exposed";

/** Continuity posture derived from continuity sub-signals (target compliance +
 *  critical-flag presence), NOT the raw blended readiness score. Framed by the
 *  Business impact lens as a BIA "aligned with" ISO 22301 / NIST CSF. */
export function postureBand(results: WorkloadResult[], flags: RiskFlag[]): PostureBand {
  if (results.some(isCatastrophic)) return "exposed";
  const checks = results.flatMap((r) => [r.rpoMeets, r.rtoMeets]);
  const compliance = checks.length ? checks.filter(Boolean).length / checks.length : 0;
  const hasCritical = flags.some((f) => f.severity === "critical");
  if (compliance >= 0.8 && !hasCritical) return "strong";
  if (compliance >= 0.5) return "developing";
  return "exposed";
}

// --- Risk bought down: what each investment removes, never what it costs ---

export type BoughtDownKind = "catastrophic" | "loss" | "posture";

export interface RiskBoughtDown {
  code: FlagCode;
  scope: Placement | "all";
  kind: BoughtDownKind;
  /** catastrophic: count of workloads made recoverable; loss: IDR exposure
   *  addressed (null when no cost); posture: null (resilience, no number) */
  amount: number | null;
}

function inScope(
  r: WorkloadResult,
  model: DeploymentModel,
  scope: Placement | "all",
): boolean {
  return scope === "all" || placementOf(r.workload, model) === scope;
}

/** Projects a group- or environment-scoped flag onto the workloads it covers
 *  and reports what closing it buys down. Keyed by (code, scope) at the call
 *  site — hybrid emits duplicate codes across groups, kept as distinct asks. */
export function riskBoughtDown(
  flag: RiskFlag,
  results: WorkloadResult[],
  model: DeploymentModel,
): RiskBoughtDown {
  const scoped = results.filter((r) => inScope(r, model, flag.scope));
  switch (flag.code) {
    case "unprotected-workloads": {
      // Turns unbounded loss into a bounded, recoverable one.
      const amount = scoped.filter(isCatastrophic).length;
      return { code: flag.code, scope: flag.scope, kind: "catastrophic", amount };
    }
    case "no-immutable":
    case "no-offsite":
    case "no-cross-region": {
      // Protects the in-scope workloads' downtime exposure from a loss event.
      let sum = 0;
      let any = false;
      for (const r of scoped) {
        const e = workloadExposure(r);
        if (e !== null) {
          sum += e;
          any = true;
        }
      }
      return { code: flag.code, scope: flag.scope, kind: "loss", amount: any ? sum : null };
    }
    default:
      // single-site, saas-shared-responsibility → resilience posture, no minutes.
      // (A second site changes no engine-computed RTO/RPO, so claiming a time
      // delta here would be an invented number — kept qualitative.)
      return { code: flag.code, scope: flag.scope, kind: "posture", amount: null };
  }
}

// --- Currency (report display) ---
// Stored exposure is ALWAYS IDR; only the display currency tracks language:
// IDR uses compact Indonesian units (rb/jt/miliar), USD uses K/M/B.

export interface Currency {
  code: "IDR" | "USD";
  /** IDR per 1 unit of this currency (IDR = 1; USD ≈ calibration IDR_PER_USD). */
  rate: number;
}

export function formatMoney(amountIDR: number, cur: Currency): string {
  const zero = cur.code === "USD" ? "$0" : "Rp 0";
  if (!Number.isFinite(amountIDR) || amountIDR <= 0) return zero;
  const v = amountIDR / cur.rate;
  const n = (x: number) => (x >= 100 || Number.isInteger(x) ? String(Math.round(x)) : x.toFixed(1));
  if (cur.code === "USD") {
    if (v >= 1e9) return `$${n(v / 1e9)}B`;
    if (v >= 1e6) return `$${n(v / 1e6)}M`;
    if (v >= 1e3) return `$${n(v / 1e3)}K`;
    return `$${Math.round(v)}`;
  }
  if (v >= 1e9) return `Rp ${n(v / 1e9)} miliar`;
  if (v >= 1e6) return `Rp ${n(v / 1e6)} jt`;
  if (v >= 1e3) return `Rp ${n(v / 1e3)} rb`;
  return `Rp ${Math.round(v)}`;
}

const IDR: Currency = { code: "IDR", rate: 1 };

/** IDR-only convenience (intake input aid — the Rp value the user types). */
export function formatIDR(amount: number): string {
  return formatMoney(amount, IDR);
}
