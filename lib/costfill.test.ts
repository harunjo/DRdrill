import { describe, expect, it } from "vitest";
import { applyToAll, estimateDowntimeCost } from "./costfill";
import type { Workload } from "./engine";

const wl = (over: Partial<Workload>): Workload => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  name: over.name ?? "W",
  type: "vm",
  sizeGB: 100,
  tier: over.tier ?? 2,
  costPerHourDowntime: over.costPerHourDowntime,
});

describe("applyToAll", () => {
  it("sets the same cost on every workload", () => {
    const out = applyToAll([wl({ tier: 1 }), wl({ tier: 3 })], 5_000_000);
    expect(out.map((w) => w.costPerHourDowntime)).toEqual([5_000_000, 5_000_000]);
  });

  it("clears cost when given undefined", () => {
    const out = applyToAll([wl({ costPerHourDowntime: 9 })], undefined);
    expect(out[0].costPerHourDowntime).toBeUndefined();
  });
});

describe("estimateDowntimeCost", () => {
  it("sums staff productivity and revenue spread over the month (salary ÷ 176, revenue ÷ 720)", () => {
    // 20 staff × (Rp13.2M/176 = Rp75k/hr) + Rp1.44B/mo ÷ 720 = Rp2M/hr → 3.5M
    expect(
      estimateDowntimeCost({
        staffAffected: 20,
        monthlySalaryPerStaff: 13_200_000,
        monthlyRevenue: 1_440_000_000,
      }),
    ).toBe(3_500_000);
  });

  it("works from productivity alone for internal systems", () => {
    // 10 staff × (Rp17.6M/176 = Rp100k/hr) = 1M
    expect(
      estimateDowntimeCost({ staffAffected: 10, monthlySalaryPerStaff: 17_600_000, monthlyRevenue: 0 }),
    ).toBe(1_000_000);
  });

  it("clamps blank/negative/NaN inputs to zero", () => {
    expect(
      estimateDowntimeCost({ staffAffected: NaN, monthlySalaryPerStaff: -5, monthlyRevenue: 0 }),
    ).toBe(0);
  });
});
