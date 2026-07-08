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

/** Teach-by-doing estimator: many managers can't name a downtime cost but can
 *  answer its inputs. Standard BIA decomposition — one hour of downtime costs
 *  the lost staff productivity plus the revenue not earned:
 *    cost/hr ≈ (staff blocked × their loaded hourly cost) + revenue lost/hr
 *  Negatives and NaN clamp to 0 so partial/blank inputs still return a usable
 *  number. Revenue term is 0 for internal-only systems. */
export function estimateDowntimeCost(input: {
  staffAffected: number;
  hourlyCostPerStaff: number;
  revenuePerHour: number;
}): number {
  const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const productivity = pos(input.staffAffected) * pos(input.hourlyCostPerStaff);
  return Math.round(productivity + pos(input.revenuePerHour));
}
