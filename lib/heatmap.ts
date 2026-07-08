// Pure placement logic for the risk heatmap (U4). Axes are impact × readiness
// gap — never an invented likelihood. Group- or environment-scoped flags are
// projected onto the workloads they cover; a workload with no recovery path is
// marked catastrophic and pinned to the top impact band.

import {
  placementOf,
  type DeploymentModel,
  type RiskFlag,
  type WorkloadResult,
} from "./engine";
import { workloadExposure } from "./exposure";

export type Level = 0 | 1 | 2;

export interface HeatCell {
  gap: Level; // 0 on-track · 1 partial · 2 at-risk
  impact: Level; // 0 low · 1 moderate · 2 high
  catastrophic: boolean;
}

// Exposure band thresholds (IDR). Deferred-to-implementation tuning knobs.
const EXP_HIGH = 100_000_000;
const EXP_MED = 10_000_000;

/** Does a critical flag in this workload's scope cover it? Group-scoped flags
 *  cover only workloads in that placement group; `all` covers everyone. */
export function criticalInScope(
  r: WorkloadResult,
  flags: RiskFlag[],
  model: DeploymentModel,
): boolean {
  // Only group-scoped critical flags raise a peer workload's gap. Env-wide
  // "all" flags (e.g. unprotected-workloads) fire when ANY workload is
  // unprotected and would otherwise drag compliant workloads to At-risk — the
  // unprotected ones are already at gap 2 via their own null RTO.
  return flags.some(
    (f) =>
      f.severity === "critical" &&
      f.scope !== "all" &&
      placementOf(r.workload, model) === f.scope,
  );
}

export function gapLevel(r: WorkloadResult, hasCriticalInScope: boolean): Level {
  if (r.achievableRtoMin === null) return 2; // catastrophic → highest gap
  const misses = (r.rpoMeets ? 0 : 1) + (r.rtoMeets ? 0 : 1);
  if (misses === 0 && !hasCriticalInScope) return 0;
  if (misses >= 2 || hasCriticalInScope) return 2;
  return 1;
}

/** Impact axis: exposure bands when any workload carries a cost, else tier. A
 *  workload with no cost of its own falls back to its tier band rather than
 *  sinking to Low, so a partially-costed intake never hides a critical system. */
export function impactLevel(r: WorkloadResult, useExposureAxis: boolean): Level {
  if (r.achievableRtoMin === null) return 2; // catastrophic → top impact
  if (useExposureAxis) {
    const e = workloadExposure(r);
    if (e !== null) return e >= EXP_HIGH ? 2 : e >= EXP_MED ? 1 : 0;
    // no cost on this workload → fall through to the tier band below
  }
  return r.workload.tier === 1 ? 2 : r.workload.tier === 2 ? 1 : 0;
}

export function placeWorkload(
  r: WorkloadResult,
  hasCriticalInScope: boolean,
  useExposureAxis: boolean,
): HeatCell {
  return {
    gap: gapLevel(r, hasCriticalInScope),
    impact: impactLevel(r, useExposureAxis),
    catastrophic: r.achievableRtoMin === null,
  };
}
