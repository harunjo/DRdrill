import { describe, expect, it } from "vitest";
import { assess, type Environment, type Protection, type Workload, type WorkloadResult } from "./engine";
import {
  aggregateExposure,
  annualizedLoss,
  catastrophicList,
  formatIDR,
  formatMoney,
  isCatastrophic,
  postureBand,
  riskBoughtDown,
  workloadExposure,
} from "./exposure";

const noProtection: Protection = {
  frequencyHours: 0,
  replication: false,
  replicationLagMin: 0,
  offsiteCopy: false,
  immutableCopy: false,
  secondSite: false,
};

const wl = (over: Partial<Workload>): Workload => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  name: over.name ?? "W",
  type: over.type ?? "vm",
  sizeGB: over.sizeGB ?? 100,
  tier: over.tier ?? 2,
  placement: over.placement,
  costPerHourDowntime: over.costPerHourDowntime,
});

// Minimal WorkloadResult for pure-function tests.
const result = (
  over: Omit<Partial<WorkloadResult>, "workload"> & { workload?: Partial<Workload> },
): WorkloadResult => ({
  workload: wl(over.workload ?? {}),
  label: over.label ?? "W1",
  achievableRpoMin: over.achievableRpoMin ?? 60,
  achievableRtoMin: over.achievableRtoMin === undefined ? 120 : over.achievableRtoMin,
  rpoMeets: over.rpoMeets ?? false,
  rtoMeets: over.rtoMeets ?? false,
});

describe("catastrophicList", () => {
  const crit = (tier: 1 | 2 | 3) => ({ 1: "Critical", 2: "Important", 3: "Standard" })[tier];

  it("names only unrecoverable workloads, tagged with their criticality", () => {
    const results = [
      result({ workload: { name: "ERP", tier: 1 }, achievableRtoMin: null }),
      result({ workload: { name: "CRM", tier: 2 }, achievableRtoMin: 120 }), // recoverable → excluded
      result({ workload: { name: "Files", tier: 3 }, achievableRtoMin: null }),
    ];
    expect(catastrophicList(results, crit)).toBe("ERP (Critical), Files (Standard)");
  });

  it("is empty when nothing is catastrophic", () => {
    expect(catastrophicList([result({ achievableRtoMin: 60 })], crit)).toBe("");
  });
});

describe("workloadExposure", () => {
  it("computes downtime hours × cost/hour (AE1)", () => {
    const r = result({ achievableRtoMin: 1440, workload: { costPerHourDowntime: 5_000_000 } });
    expect(workloadExposure(r)).toBe(120_000_000); // 24h × Rp 5jt
  });

  it("is null when no cost supplied (qualitative, not catastrophic)", () => {
    const r = result({ achievableRtoMin: 1440, workload: {} });
    expect(workloadExposure(r)).toBeNull();
    expect(isCatastrophic(r)).toBe(false);
  });

  it("is null and catastrophic when RTO is unrecoverable (AE6)", () => {
    const r = result({ achievableRtoMin: null, workload: { costPerHourDowntime: 5_000_000 } });
    expect(workloadExposure(r)).toBeNull();
    expect(isCatastrophic(r)).toBe(true);
  });
});

describe("aggregateExposure", () => {
  it("sums finite exposures and counts catastrophic separately", () => {
    const results = [
      result({ label: "W1", achievableRtoMin: 60, workload: { costPerHourDowntime: 1_000_000 } }), // 1M
      result({ label: "W2", achievableRtoMin: 120, workload: { costPerHourDowntime: 2_000_000 } }), // 4M
      result({ label: "W3", achievableRtoMin: null, workload: { costPerHourDowntime: 9_000_000 } }), // catastrophic
    ];
    const agg = aggregateExposure(results);
    expect(agg.total).toBe(5_000_000);
    expect(agg.monetizedCount).toBe(2);
    expect(agg.catastrophicCount).toBe(1);
    expect(agg.hasCost).toBe(true);
  });

  it("reports hasCost false when no workload carries a cost", () => {
    const agg = aggregateExposure([result({ workload: {} })]);
    expect(agg.hasCost).toBe(false);
    expect(agg.total).toBe(0);
  });

  it("keeps total 0 with monetizedCount 0 when every costed workload is catastrophic", () => {
    // guards the 'Rp 0' headline bug — hero must key off monetizedCount, not hasCost
    const agg = aggregateExposure([
      result({ achievableRtoMin: null, workload: { costPerHourDowntime: 5_000_000 } }),
    ]);
    expect(agg.total).toBe(0);
    expect(agg.monetizedCount).toBe(0);
    expect(agg.catastrophicCount).toBe(1);
    expect(agg.hasCost).toBe(true);
  });
});

describe("postureBand", () => {
  it("is exposed when any workload is unrecoverable", () => {
    const results = [result({ achievableRtoMin: null, rpoMeets: true, rtoMeets: true })];
    expect(postureBand(results, [])).toBe("exposed");
  });

  it("is strong when compliant and no critical flags", () => {
    const results = [result({ rpoMeets: true, rtoMeets: true })];
    expect(postureBand(results, [])).toBe("strong");
  });

  it("is developing when partially compliant", () => {
    const results = [result({ rpoMeets: true, rtoMeets: false })];
    expect(postureBand(results, [{ code: "single-site", severity: "warning", scope: "onprem" }])).toBe(
      "developing",
    );
  });
});

describe("riskBoughtDown", () => {
  it("loss control sums in-scope monetized exposure (no-immutable)", () => {
    const results = [
      result({ label: "W1", achievableRtoMin: 60, workload: { costPerHourDowntime: 1_000_000 } }),
      result({ label: "W2", achievableRtoMin: 60, workload: { costPerHourDowntime: 2_000_000 } }),
    ];
    const bd = riskBoughtDown({ code: "no-immutable", severity: "critical", scope: "all" }, results, "onprem");
    expect(bd.kind).toBe("loss");
    expect(bd.amount).toBe(3_000_000);
  });

  it("single-site is posture-only with no invented minutes", () => {
    const bd = riskBoughtDown({ code: "single-site", severity: "warning", scope: "onprem" }, [], "onprem");
    expect(bd.kind).toBe("posture");
    expect(bd.amount).toBeNull();
  });

  it("unprotected-workloads counts catastrophic workloads made recoverable", () => {
    const results = [
      result({ achievableRtoMin: null }),
      result({ achievableRtoMin: null }),
      result({ achievableRtoMin: 60 }),
    ];
    const bd = riskBoughtDown({ code: "unprotected-workloads", severity: "critical", scope: "all" }, results, "onprem");
    expect(bd.kind).toBe("catastrophic");
    expect(bd.amount).toBe(2);
  });

  it("scopes a group flag to its placement group (hybrid, duplicate codes)", () => {
    const env: Environment = {
      model: "hybrid",
      workloads: [
        wl({ name: "OnpremDB", placement: "onprem", costPerHourDowntime: 1_000_000 }),
        wl({ name: "CloudApp", placement: "cloud", costPerHourDowntime: 2_000_000 }),
      ],
      protection: {
        onprem: { ...noProtection, frequencyHours: 24 },
        cloud: { ...noProtection, frequencyHours: 24 },
      },
    };
    const a = assess(env);
    const immutable = a.flags.filter((f) => f.code === "no-immutable");
    expect(immutable.length).toBe(2); // one per placement group
    const onprem = immutable.find((f) => f.scope === "onprem")!;
    const cloud = immutable.find((f) => f.scope === "cloud")!;
    // each ask only sums exposure for workloads in its own scope
    expect(riskBoughtDown(onprem, a.results, env.model).amount).toBe(
      workloadExposure(a.results[0]),
    );
    expect(riskBoughtDown(cloud, a.results, env.model).amount).toBe(
      workloadExposure(a.results[1]),
    );
  });
});

describe("formatIDR", () => {
  it("uses compact Indonesian units", () => {
    expect(formatIDR(120_000_000)).toBe("Rp 120 jt");
    expect(formatIDR(5_000_000)).toBe("Rp 5 jt");
    expect(formatIDR(1_500_000_000)).toBe("Rp 1.5 miliar");
    expect(formatIDR(750_000)).toBe("Rp 750 rb");
    expect(formatIDR(500)).toBe("Rp 500");
  });

  it("guards non-finite and non-positive input", () => {
    expect(formatIDR(0)).toBe("Rp 0");
    expect(formatIDR(NaN)).toBe("Rp 0");
    expect(formatIDR(Infinity)).toBe("Rp 0");
  });
});

describe("formatMoney (USD display converts from IDR)", () => {
  const usd = { code: "USD" as const, rate: 16_000 };
  it("converts IDR to USD with compact units", () => {
    expect(formatMoney(160_000_000, usd)).toBe("$10K"); // 160M / 16k = 10,000
    expect(formatMoney(16_000_000_000, usd)).toBe("$1M"); // 16bn / 16k = 1,000,000
    expect(formatMoney(1_600_000, usd)).toBe("$100"); // 1.6M / 16k = 100
  });
  it("guards non-positive with a $ zero", () => {
    expect(formatMoney(0, usd)).toBe("$0");
    expect(formatMoney(NaN, usd)).toBe("$0");
  });
});

describe("trust boundary (R13)", () => {
  it("keeps cost out of the findings payload", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "ERP", costPerHourDowntime: 7_777_777 })],
      protection: { onprem: { ...noProtection, frequencyHours: 24 } },
    };
    const a = assess(env);
    expect(JSON.stringify(a.findings)).not.toContain("7777777");
    expect(JSON.stringify(a.findings)).not.toContain("costPerHourDowntime");
  });
});

describe("riskBoughtDown — CSF security gaps (U3)", () => {
  it("treats a Detect/Respond gap as posture-kind with no monetary amount", () => {
    const r = riskBoughtDown({ code: "no-siem", severity: "critical", scope: "all" }, [], "onprem");
    expect(r.kind).toBe("posture");
    expect(r.amount).toBeNull();
  });
});

describe("annualizedLoss (ALE, R14)", () => {
  it("is 0 without a per-incident figure", () => {
    expect(annualizedLoss(0, 3)).toBe(0);
    expect(annualizedLoss(-5, 3)).toBe(0);
  });
  it("applies the base rate with no critical flags", () => {
    expect(annualizedLoss(100_000_000, 0)).toBe(Math.round(100_000_000 * 0.15));
  });
  it("rises with each critical flag", () => {
    expect(annualizedLoss(100_000_000, 2)).toBe(Math.round(100_000_000 * 0.35));
  });
  it("caps the rate so it never implies near-certainty", () => {
    expect(annualizedLoss(100_000_000, 20)).toBe(Math.round(100_000_000 * 0.6));
  });
});
