// Deterministic BC/DR assessment engine. Every number shown to the user comes
// from these pure functions — the LLM narrative layer only retells computed
// findings, it never computes or invents an RPO/RTO (origin R5–R8, R12, R20).
//
// Trust boundary: assess() returns BOTH a report view (real names, browser
// only) and a Findings payload (pseudonymized labels W1..Wn) — the payload is
// the only thing allowed to leave the browser.

import {
  TIER_TARGETS,
  RESTORE_GBPH,
  CLOUD_RESTORE_GBPH,
  RESTORE_OVERHEAD_MIN,
  REPLICA_FAILOVER_MIN,
  SECURITY_CONTROLS,
} from "./calibration";

export type DeploymentModel = "onprem" | "cloud" | "hybrid" | "private";
export type WorkloadType = "database" | "vm" | "files" | "saas";
export type Tier = 1 | 2 | 3;
export type Placement = "onprem" | "cloud";

export const MAX_WORKLOADS = 10;
export const MIN_WORKLOADS = 1;
export const MAX_NAME_LENGTH = 60; // R21: free text is length-capped

export interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  sizeGB: number;
  tier: Tier;
  /** hybrid only — which side this workload runs on; ignored otherwise */
  placement?: Placement;
  /** executive view only — cost of one hour of this workload's downtime, in
   *  IDR. Optional; browser-only; never enters FindingsPayload (R13). */
  costPerHourDowntime?: number;
}

/** One protection profile per placement group. Field semantics vary by side:
 *  frequencyHours = backup-job frequency (on-prem/private) or snapshot
 *  frequency (cloud); offsiteCopy = offsite media/cloud copy (on-prem) or
 *  cross-region copy (cloud). (origin R3) */
export interface Protection {
  frequencyHours: number; // 0 = none
  replication: boolean;
  replicationLagMin: number;
  offsiteCopy: boolean;
  immutableCopy: boolean;
  secondSite: boolean; // second site (on-prem) / second region failover (cloud)
}

export interface Environment {
  model: DeploymentModel;
  workloads: Workload[];
  protection: {
    onprem?: Protection; // used by onprem, private, hybrid
    cloud?: Protection; // used by cloud, hybrid
  };
  /** Per-environment CSF Detect/Respond control presence (R17). Absent
   *  entirely = the security functions were not assessed (R2). */
  security?: SecurityInputs;
}

// Flags are emitted as codes; UI and narrative prompt map codes to localized,
// business-framed text (origin R6, R18; keeps the findings payload minimal).
export type FlagCode =
  | "no-immutable"
  | "no-offsite"
  | "single-site"
  | "no-cross-region"
  | "saas-shared-responsibility"
  | "unprotected-workloads"
  // NIST CSF Govern/Identify/Protect/Detect/Respond gaps (per-environment, R7)
  | "no-security-policy"
  | "no-security-roles"
  | "no-third-party-risk"
  | "no-asset-inventory"
  | "no-risk-assessment"
  | "no-data-classification"
  | "no-mfa"
  | "no-patching"
  | "no-least-privilege"
  | "no-encryption"
  | "no-siem"
  | "no-central-logging"
  | "no-endpoint-monitoring"
  | "no-alerting"
  | "no-vuln-scanning"
  | "no-ir-plan"
  | "no-isolation"
  | "no-ir-ownership"
  | "no-breach-notification";

export interface RiskFlag {
  code: FlagCode;
  severity: "critical" | "warning";
  /** which placement group triggered it, for UI context ("all" for the
   *  per-environment CSF Detect/Respond gaps) */
  scope: Placement | "all";
}

// --- NIST CSF Detect/Respond posture (per-environment, R4/R5/R17) ---

export type CsfFunction = "govern" | "identify" | "protect" | "detect" | "respond";

/** The CSF functions assessed from per-environment security controls (Recover is
 *  derived from the DR engine, not from controls). */
export const CSF_SECURITY_FUNCTIONS: CsfFunction[] = [
  "govern",
  "identify",
  "protect",
  "detect",
  "respond",
];

/** One assessable control. `depth` gates generalist vs advanced intake (R18);
 *  an absent control with a `gap` raises that investment flag (R7). */
export interface SecurityControl {
  key: string; // stable id, also the i18n key
  fn: CsfFunction;
  weight: number; // contribution to the function's 0–100 maturity score
  depth: "core" | "advanced";
  gap?: { code: FlagCode; severity: "critical" | "warning" };
}

/** Environment-level control presence, keyed by SecurityControl.key. A missing
 *  key means the control is absent. Booleans only — never PII. */
export type SecurityInputs = Record<string, boolean>;

export interface FunctionResult {
  score: number; // 0–100 weighted maturity
  controls: SecurityInputs; // normalized present/absent per control (browser-only view)
  gaps: RiskFlag[]; // absent controls that carry a gap flag
}

export interface WorkloadResult {
  workload: Workload;
  label: string; // W1..Wn — the only identifier in the findings payload
  achievableRpoMin: number | null; // null = unrecoverable
  achievableRtoMin: number | null;
  rpoMeets: boolean;
  rtoMeets: boolean;
}

/** The ONLY structure allowed to leave the browser (origin R8, R12). */
export interface FindingsPayload {
  model: DeploymentModel;
  workloads: {
    label: string; // ^W\d+$
    type: WorkloadType;
    tier: Tier;
    achievableRpoMin: number | null;
    achievableRtoMin: number | null;
    targetRpoMin: number;
    targetRtoMin: number;
    rpoMeets: boolean;
    rtoMeets: boolean;
  }[];
  flags: RiskFlag[];
  rule321: { threeCopies: boolean; twoMedia: boolean; oneOffsite: boolean };
  score: number;
  /** CSF Govern/Identify/Protect/Detect/Respond maturity — score only
   *  (pseudonymized, R10). Absent when the security functions were not assessed. */
  govern?: { score: number };
  identify?: { score: number };
  protect?: { score: number };
  detect?: { score: number };
  respond?: { score: number };
}

export interface Assessment {
  results: WorkloadResult[];
  flags: RiskFlag[];
  rule321: { threeCopies: boolean; twoMedia: boolean; oneOffsite: boolean };
  score: number;
  findings: FindingsPayload;
  /** label → real name; browser-only, used to re-substitute into the narrative */
  labelMap: Record<string, string>;
  /** Browser-only CSF results (score + per-control checklist) per function.
   *  Absent when the security functions were not assessed. */
  govern?: FunctionResult;
  identify?: FunctionResult;
  protect?: FunctionResult;
  detect?: FunctionResult;
  respond?: FunctionResult;
}

export function placementOf(w: Workload, model: DeploymentModel): Placement {
  if (model === "cloud") return "cloud";
  if (model === "hybrid") return w.placement ?? "onprem";
  return "onprem"; // onprem + private share the derivation path
}

function protectionFor(env: Environment, placement: Placement): Protection | undefined {
  return placement === "cloud" ? env.protection.cloud : env.protection.onprem;
}

export function assessWorkload(
  w: Workload,
  env: Environment,
): Omit<WorkloadResult, "label"> {
  const placement = placementOf(w, env.model);
  const p = protectionFor(env, placement);
  const target = TIER_TARGETS[w.tier];

  const unprotected = !p || (p.frequencyHours <= 0 && !p.replication);

  const achievableRpoMin = unprotected
    ? null
    : p.replication
      ? p.replicationLagMin
      : p.frequencyHours * 60;

  const achievableRtoMin = unprotected
    ? null
    : p.replication
      ? REPLICA_FAILOVER_MIN
      : Math.ceil(
          (w.sizeGB / (placement === "cloud" ? CLOUD_RESTORE_GBPH : RESTORE_GBPH)) * 60,
        ) + RESTORE_OVERHEAD_MIN;

  return {
    workload: w,
    achievableRpoMin,
    achievableRtoMin,
    rpoMeets: achievableRpoMin !== null && achievableRpoMin <= target.rpoMin,
    rtoMeets: achievableRtoMin !== null && achievableRtoMin <= target.rtoMin,
  };
}

function collectFlags(env: Environment): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const groups: Placement[] =
    env.model === "hybrid" ? ["onprem", "cloud"] : env.model === "cloud" ? ["cloud"] : ["onprem"];

  for (const g of groups) {
    const p = protectionFor(env, g);
    if (!p) continue;
    const protectedAtAll = p.frequencyHours > 0 || p.replication;
    if (protectedAtAll && !p.immutableCopy)
      flags.push({ code: "no-immutable", severity: "critical", scope: g });
    if (protectedAtAll && !p.offsiteCopy)
      flags.push({
        code: g === "cloud" ? "no-cross-region" : "no-offsite",
        severity: "critical",
        scope: g,
      });
    if (!p.secondSite)
      flags.push({ code: "single-site", severity: "warning", scope: g });
  }

  if (env.workloads.some((w) => w.type === "saas"))
    flags.push({ code: "saas-shared-responsibility", severity: "warning", scope: "all" });

  const anyUnprotected = env.workloads.some(
    (w) => assessWorkload(w, env).achievableRpoMin === null,
  );
  if (anyUnprotected)
    flags.push({ code: "unprotected-workloads", severity: "critical", scope: "all" });

  return flags;
}

/** Deterministic CSF maturity for one function: weighted control presence, plus
 *  a gap flag for each absent control that carries one (R6, R7, R11). Pure —
 *  no model involvement. */
export function assessFunction(fn: CsfFunction, security: SecurityInputs): FunctionResult {
  const controls = SECURITY_CONTROLS.filter((c) => c.fn === fn);
  const total = controls.reduce((s, c) => s + c.weight, 0);
  let present = 0;
  const gaps: RiskFlag[] = [];
  const normalized: SecurityInputs = {};
  for (const c of controls) {
    const has = security[c.key] === true;
    normalized[c.key] = has;
    if (has) present += c.weight;
    else if (c.gap) gaps.push({ code: c.gap.code, severity: c.gap.severity, scope: "all" });
  }
  const score = total > 0 ? Math.round((present / total) * 100) : 0;
  return { score, controls: normalized, gaps };
}

export function assess(env: Environment): Assessment {
  const workloads = env.workloads.slice(0, MAX_WORKLOADS);

  const labelMap: Record<string, string> = {};
  const results: WorkloadResult[] = workloads.map((w, i) => {
    const label = `W${i + 1}`;
    labelMap[label] = w.name;
    return { ...assessWorkload(w, env), label };
  });

  // Recover (DR) flags drive the Recover score below; the CSF Detect/Respond
  // gaps are appended to the report/investment flag set but never affect the
  // Recover score (R1 — Recover computations unchanged).
  const drFlags = collectFlags(env);
  const sec = env.security
    ? (Object.fromEntries(
        CSF_SECURITY_FUNCTIONS.map((f) => [f, assessFunction(f, env.security!)]),
      ) as Record<CsfFunction, FunctionResult>)
    : null;
  const flags = [...drFlags, ...(sec ? CSF_SECURITY_FUNCTIONS.flatMap((f) => sec[f].gaps) : [])];

  // 3-2-1 across the environment: any protected group counts copies; media
  // diversity approximated by replication or a cloud+onprem split; offsite by
  // any group's offsite/cross-region copy. ponytail: coarse, honest.
  // Only the groups the deployment model actually uses count — leftover
  // toggles from switching models must not credit phantom protection.
  const activePlacements: Placement[] =
    env.model === "hybrid" ? ["onprem", "cloud"] : env.model === "cloud" ? ["cloud"] : ["onprem"];
  const groups = activePlacements
    .map((g) => protectionFor(env, g))
    .filter(Boolean) as Protection[];
  const anyBackup = groups.some((p) => p.frequencyHours > 0);
  const rule321 = {
    threeCopies: anyBackup && groups.some((p) => p.offsiteCopy || p.replication),
    twoMedia: groups.some((p) => p.replication) || env.model === "hybrid",
    oneOffsite: groups.some((p) => p.offsiteCopy),
  };

  // ponytail: linear score — 60% target compliance, 40% hygiene flags. Uses
  // drFlags only, so the Recover score ignores CSF Detect/Respond gaps (R1).
  const checks = results.flatMap((r) => [r.rpoMeets, r.rtoMeets]);
  const compliance = checks.length ? checks.filter(Boolean).length / checks.length : 0;
  const hygiene =
    1 -
    Math.min(
      1,
      drFlags.reduce((n, f) => n + (f.severity === "critical" ? 0.4 : 0.15), 0),
    );
  const score = Math.max(0, Math.min(100, Math.round((compliance * 0.6 + hygiene * 0.4) * 100)));

  const findings: FindingsPayload = {
    model: env.model,
    workloads: results.map((r) => ({
      label: r.label,
      type: r.workload.type,
      tier: r.workload.tier,
      achievableRpoMin: r.achievableRpoMin,
      achievableRtoMin: r.achievableRtoMin,
      targetRpoMin: TIER_TARGETS[r.workload.tier].rpoMin,
      targetRtoMin: TIER_TARGETS[r.workload.tier].rtoMin,
      rpoMeets: r.rpoMeets,
      rtoMeets: r.rtoMeets,
    })),
    flags,
    rule321,
    score,
    ...(sec
      ? (Object.fromEntries(
          CSF_SECURITY_FUNCTIONS.map((f) => [f, { score: sec[f].score }]),
        ) as Partial<Record<CsfFunction, { score: number }>>)
      : {}),
  };

  return {
    results,
    flags,
    rule321,
    score,
    findings,
    labelMap,
    ...(sec ?? {}),
  };
}

export interface DurationLabels {
  unrecoverable: string;
  min: string;
  h: string;
  d: string;
}

const EN_DURATION: DurationLabels = { unrecoverable: "unrecoverable", min: "min", h: "h", d: "d" };

export function fmtMinutes(min: number | null, labels: DurationLabels = EN_DURATION): string {
  if (min === null) return labels.unrecoverable;
  if (min < 60) return `${min} ${labels.min}`;
  if (min < 1440) return `${Math.round((min / 60) * 10) / 10} ${labels.h}`;
  return `${Math.round((min / 1440) * 10) / 10} ${labels.d}`;
}
