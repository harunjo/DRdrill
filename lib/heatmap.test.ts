import { describe, expect, it } from "vitest";
import type { RiskFlag, Workload, WorkloadResult } from "./engine";
import { criticalInScope, gapLevel, impactLevel, placeWorkload } from "./heatmap";

const wl = (over: Partial<Workload>): Workload => ({
  id: "x",
  name: over.name ?? "W",
  type: "vm",
  sizeGB: 100,
  tier: over.tier ?? 2,
  placement: over.placement,
  costPerHourDowntime: over.costPerHourDowntime,
});

const result = (
  over: Omit<Partial<WorkloadResult>, "workload"> & { workload?: Partial<Workload> },
): WorkloadResult => ({
  workload: wl(over.workload ?? {}),
  label: over.label ?? "W1",
  achievableRpoMin: over.achievableRpoMin ?? 60,
  achievableRtoMin: over.achievableRtoMin === undefined ? 120 : over.achievableRtoMin,
  rpoMeets: over.rpoMeets ?? true,
  rtoMeets: over.rtoMeets ?? true,
});

describe("gapLevel", () => {
  it("is 0 when both targets met and no critical flag", () => {
    expect(gapLevel(result({ rpoMeets: true, rtoMeets: true }), false)).toBe(0);
  });
  it("is 2 when a target is missed and a critical flag applies", () => {
    expect(gapLevel(result({ rpoMeets: true, rtoMeets: false }), true)).toBe(2);
  });
  it("is 1 (partial) when one target is missed and no critical flag applies", () => {
    expect(gapLevel(result({ rpoMeets: true, rtoMeets: false }), false)).toBe(1);
  });
  it("is 2 for a catastrophic workload", () => {
    expect(gapLevel(result({ achievableRtoMin: null }), false)).toBe(2);
  });
});

describe("impactLevel", () => {
  it("uses exposure bands when the exposure axis is active", () => {
    expect(impactLevel(result({ achievableRtoMin: 60, workload: { costPerHourDowntime: 200_000_000 } }), true)).toBe(2);
    expect(impactLevel(result({ achievableRtoMin: 60, workload: { costPerHourDowntime: 20_000_000 } }), true)).toBe(1);
  });
  it("uses tier when no exposure axis", () => {
    expect(impactLevel(result({ workload: { tier: 1 } }), false)).toBe(2);
    expect(impactLevel(result({ workload: { tier: 3 } }), false)).toBe(0);
  });
  it("pins catastrophic workloads to the top impact band", () => {
    expect(impactLevel(result({ achievableRtoMin: null }), true)).toBe(2);
  });
  it("falls back to tier for an uncosted workload even in exposure mode", () => {
    // a Tier-1 workload with no cost must not sink to Low next to costed peers
    expect(impactLevel(result({ achievableRtoMin: 60, workload: { tier: 1 } }), true)).toBe(2);
    expect(impactLevel(result({ achievableRtoMin: 60, workload: { tier: 3 } }), true)).toBe(0);
  });
});

describe("criticalInScope", () => {
  const flags: RiskFlag[] = [{ code: "no-immutable", severity: "critical", scope: "onprem" }];
  it("covers a workload in the flag's group (hybrid)", () => {
    const r = result({ workload: { placement: "onprem" } });
    expect(criticalInScope(r, flags, "hybrid")).toBe(true);
  });
  it("does not cover a workload in another group", () => {
    const r = result({ workload: { placement: "cloud" } });
    expect(criticalInScope(r, flags, "hybrid")).toBe(false);
  });
  it("an all-scoped critical flag does NOT drag peer workloads to at-risk", () => {
    // unprotected-workloads (scope 'all') fires when ANY workload is unprotected;
    // it must not raise a compliant peer's gap — the unprotected one is already
    // at gap 2 via its own null RTO.
    const all: RiskFlag[] = [{ code: "unprotected-workloads", severity: "critical", scope: "all" }];
    expect(criticalInScope(result({ workload: { placement: "cloud" } }), all, "hybrid")).toBe(false);
  });
});

describe("placeWorkload (AE4)", () => {
  it("a workload missing RTO with a critical flag lands high-impact/high-gap", () => {
    const r = result({ rtoMeets: false, rpoMeets: true, workload: { tier: 1 } });
    const cell = placeWorkload(r, true, false);
    expect(cell.gap).toBe(2);
    expect(cell.impact).toBe(2);
    expect(cell.catastrophic).toBe(false);
  });
});
