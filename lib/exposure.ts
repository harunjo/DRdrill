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
  type WorkloadResult,
} from "./engine";

/** A workload with no recovery path — its loss is unbounded, never a number. */
export function isCatastrophic(r: WorkloadResult): boolean {
  return r.achievableRtoMin === null;
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

// --- Currency (IDR, compact Indonesian units: rb / jt / miliar) ---

export function formatIDR(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Rp 0";
  const unit = (n: number, u: string) => {
    const s = n >= 100 || Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1);
    return `Rp ${s} ${u}`;
  };
  if (amount >= 1e9) return unit(amount / 1e9, "miliar");
  if (amount >= 1e6) return unit(amount / 1e6, "jt");
  if (amount >= 1e3) return unit(amount / 1e3, "rb");
  return `Rp ${Math.round(amount)}`;
}
