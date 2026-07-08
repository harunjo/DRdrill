import { describe, expect, it } from "vitest";
import { applyByTier, applyToAll, estimateDowntimeCost } from "./costfill";
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

describe("applyByTier", () => {
  it("applies per-tier values and leaves absent tiers untouched", () => {
    const wls = [wl({ tier: 1, costPerHourDowntime: 1 }), wl({ tier: 2, costPerHourDowntime: 2 })];
    const out = applyByTier(wls, { 1: 10_000_000 });
    expect(out[0].costPerHourDowntime).toBe(10_000_000); // tier 1 set
    expect(out[1].costPerHourDowntime).toBe(2); // tier 2 not in map → untouched
  });

  it("clears when a tier is present with undefined", () => {
    const out = applyByTier([wl({ tier: 1, costPerHourDowntime: 5 })], { 1: undefined });
    expect(out[0].costPerHourDowntime).toBeUndefined();
  });
});

describe("estimateDowntimeCost", () => {
  it("sums staff productivity and lost revenue (salary ÷ 176 → hourly)", () => {
    // 20 staff × (Rp13.2M/176 = Rp75k/hr) + Rp2M/hr revenue = 3.5M
    expect(
      estimateDowntimeCost({ staffAffected: 20, monthlySalaryPerStaff: 13_200_000, revenuePerHour: 2_000_000 }),
    ).toBe(3_500_000);
  });

  it("works from productivity alone for internal systems", () => {
    // 10 staff × (Rp17.6M/176 = Rp100k/hr) = 1M
    expect(
      estimateDowntimeCost({ staffAffected: 10, monthlySalaryPerStaff: 17_600_000, revenuePerHour: 0 }),
    ).toBe(1_000_000);
  });

  it("clamps blank/negative/NaN inputs to zero", () => {
    expect(
      estimateDowntimeCost({ staffAffected: NaN, monthlySalaryPerStaff: -5, revenuePerHour: 0 }),
    ).toBe(0);
  });
});
