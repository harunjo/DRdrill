// Pure helpers for the intake cost-of-downtime quick-fill (U2). Kept out of the
// component so the mapping is unit-testable.

import type { Tier, Workload } from "./engine";

/** Set the same downtime cost (Rp/hour) on every workload. `undefined` clears. */
export function applyToAll(workloads: Workload[], cost: number | undefined): Workload[] {
  return workloads.map((w) => ({ ...w, costPerHourDowntime: cost }));
}

/** Set each workload's cost from a per-tier map. Tiers absent from the map leave
 *  their workloads untouched; a tier present with `undefined` clears it. */
export function applyByTier(
  workloads: Workload[],
  byTier: Partial<Record<Tier, number>>,
): Workload[] {
  return workloads.map((w) =>
    w.tier in byTier ? { ...w, costPerHourDowntime: byTier[w.tier] } : w,
  );
}
