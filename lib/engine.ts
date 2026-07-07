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
}

// Flags are emitted as codes; UI and narrative prompt map codes to localized,
// business-framed text (origin R6, R18; keeps the findings payload minimal).
export type FlagCode =
  | "no-immutable"
  | "no-offsite"
  | "single-site"
  | "no-cross-region"
  | "saas-shared-responsibility"
  | "unprotected-workloads";

export interface RiskFlag {
  code: FlagCode;
  severity: "critical" | "warning";
  /** which placement group triggered it, for UI context */
  scope: Placement | "all";
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
}

export interface Assessment {
  results: WorkloadResult[];
  flags: RiskFlag[];
  rule321: { threeCopies: boolean; twoMedia: boolean; oneOffsite: boolean };
  score: number;
  findings: FindingsPayload;
  /** label → real name; browser-only, used to re-substitute into the narrative */
  labelMap: Record<string, string>;
}

function placementOf(w: Workload, model: DeploymentModel): Placement {
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

export function assess(env: Environment): Assessment {
  const workloads = env.workloads.slice(0, MAX_WORKLOADS);

  const labelMap: Record<string, string> = {};
  const results: WorkloadResult[] = workloads.map((w, i) => {
    const label = `W${i + 1}`;
    labelMap[label] = w.name;
    return { ...assessWorkload(w, env), label };
  });

  const flags = collectFlags(env);

  // 3-2-1 across the environment: any protected group counts copies; media
  // diversity approximated by replication or a cloud+onprem split; offsite by
  // any group's offsite/cross-region copy. ponytail: coarse, honest.
  const groups = Object.values(env.protection).filter(Boolean) as Protection[];
  const anyBackup = groups.some((p) => p.frequencyHours > 0);
  const rule321 = {
    threeCopies: anyBackup && groups.some((p) => p.offsiteCopy || p.replication),
    twoMedia: groups.some((p) => p.replication) || env.model === "hybrid",
    oneOffsite: groups.some((p) => p.offsiteCopy),
  };

  // ponytail: linear score — 60% target compliance, 40% hygiene flags.
  const checks = results.flatMap((r) => [r.rpoMeets, r.rtoMeets]);
  const compliance = checks.length ? checks.filter(Boolean).length / checks.length : 0;
  const hygiene =
    1 -
    Math.min(
      1,
      flags.reduce((n, f) => n + (f.severity === "critical" ? 0.4 : 0.15), 0),
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
  };

  return { results, flags, rule321, score, findings, labelMap };
}

export function fmtMinutes(min: number | null, unrecoverableText = "unrecoverable"): string {
  if (min === null) return unrecoverableText;
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round((min / 60) * 10) / 10} h`;
  return `${Math.round((min / 1440) * 10) / 10} d`;
}
