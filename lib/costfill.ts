// Pure helpers for the intake downtime-cost calculator (U2). Kept out of the
// component so the mapping is unit-testable.

import { REVENUE_HOURS_PER_MONTH } from "./calibration";
import type { Workload } from "./engine";

/** Set the same downtime cost (Rp/hour) on every workload. `undefined` clears. */
export function applyToAll(workloads: Workload[], cost: number | undefined): Workload[] {
  return workloads.map((w) => ({ ...w, costPerHourDowntime: cost }));
}

/** Working hours in a month (~22 days × 8h) — turns a monthly salary, which a
 *  manager actually knows, into the hourly cost the BIA needs. ponytail: fixed
 *  constant; move to calibration if payroll models ever need to vary it. */
export const WORK_HOURS_PER_MONTH = 176;

/** Teach-by-doing calculator: managers can't name a downtime cost, but they can
 *  answer its inputs. Standard BIA decomposition — one hour of downtime costs
 *  the lost staff productivity plus the revenue not earned:
 *    cost/hr ≈ (staff blocked × their salary/hour) + (monthly revenue / hours)
 *  Every input is a number people already know (headcount, monthly salary,
 *  monthly revenue) — nothing per-hour is ever guessed. Negatives and NaN clamp
 *  to 0 so partial/blank inputs still return a usable number. Revenue term is 0
 *  for internal-only systems. */
export function estimateDowntimeCost(input: {
  staffAffected: number;
  monthlySalaryPerStaff: number;
  monthlyRevenue: number;
}): number {
  const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const hourly = pos(input.monthlySalaryPerStaff) / WORK_HOURS_PER_MONTH;
  const productivity = pos(input.staffAffected) * hourly;
  const revenuePerHour = pos(input.monthlyRevenue) / REVENUE_HOURS_PER_MONTH;
  return Math.round(productivity + revenuePerHour);
}
