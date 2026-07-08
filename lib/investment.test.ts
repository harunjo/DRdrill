import { describe, expect, it } from "vitest";
import type { RiskFlag, Workload, WorkloadResult } from "./engine";
import { buildSummary, orderAsks } from "./investment";

const wl = (over: Partial<Workload>): Workload => ({
  id: "x",
  name: over.name ?? "W",
  type: "vm",
  sizeGB: 100,
  tier: 2,
  placement: over.placement,
  costPerHourDowntime: over.costPerHourDowntime,
});

const result = (
  over: Omit<Partial<WorkloadResult>, "workload"> & { workload?: Partial<Workload> },
): WorkloadResult => ({
  workload: wl(over.workload ?? {}),
  label: over.label ?? "W1",
  achievableRpoMin: 60,
  achievableRtoMin: over.achievableRtoMin === undefined ? 60 : over.achievableRtoMin,
  rpoMeets: false,
  rtoMeets: false,
});

describe("orderAsks", () => {
  it("ranks critical catastrophic above critical loss above warning posture", () => {
    const results = [
      result({ achievableRtoMin: null }), // catastrophic → unprotected
      result({ achievableRtoMin: 60, workload: { costPerHourDowntime: 1_000_000 } }),
    ];
    const flags: RiskFlag[] = [
      { code: "single-site", severity: "warning", scope: "all" }, // posture
      { code: "no-immutable", severity: "critical", scope: "all" }, // loss
      { code: "unprotected-workloads", severity: "critical", scope: "all" }, // catastrophic
    ];
    const order = orderAsks(flags, results, "onprem").map((a) => a.flag.code);
    expect(order).toEqual(["unprotected-workloads", "no-immutable", "single-site"]);
  });

  it("orders two losses by descending exposure", () => {
    const results = [
      result({ label: "W1", achievableRtoMin: 60, workload: { placement: "onprem", costPerHourDowntime: 1_000_000 } }),
      result({ label: "W2", achievableRtoMin: 60, workload: { placement: "cloud", costPerHourDowntime: 5_000_000 } }),
    ];
    const flags: RiskFlag[] = [
      { code: "no-immutable", severity: "critical", scope: "onprem" }, // 1M
      { code: "no-cross-region", severity: "critical", scope: "cloud" }, // 5M
    ];
    const order = orderAsks(flags, results, "hybrid").map((a) => a.flag.code);
    expect(order).toEqual(["no-cross-region", "no-immutable"]);
  });
});

describe("buildSummary", () => {
  it("numbers the asks and lays out the block", () => {
    const text = buildSummary({
      title: "Funding case",
      exposure: "Exposure: Rp 5 jt",
      posture: "Posture: Developing",
      asks: ["Immutable copy — closes Rp 5 jt", "Second site — resilience"],
      coverage: "Based on 2 workloads",
    });
    expect(text).toContain("1. Immutable copy — closes Rp 5 jt");
    expect(text).toContain("2. Second site — resilience");
    expect(text.startsWith("Funding case")).toBe(true);
    expect(text.trimEnd().endsWith("Based on 2 workloads")).toBe(true);
  });
});
