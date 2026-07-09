import { describe, expect, it } from "vitest";
import {
  assess,
  assessFunction,
  type Environment,
  type Protection,
  type Workload,
} from "./engine";
import { SECURITY_CONTROLS } from "./calibration";

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
  name: over.name ?? "Test workload",
  type: over.type ?? "vm",
  sizeGB: over.sizeGB ?? 100,
  tier: over.tier ?? 2,
  placement: over.placement,
});

describe("on-prem derivation (AE1)", () => {
  // Covers AE1: Tier-1 DB, nightly backups, no replication, no immutable copy
  it("fails a Tier-1 database on nightly backups and flags ransomware exposure", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "ERP database", type: "database", tier: 1 })],
      protection: {
        onprem: { ...noProtection, frequencyHours: 24 },
      },
    };
    const a = assess(env);
    expect(a.results[0].achievableRpoMin).toBe(24 * 60);
    expect(a.results[0].rpoMeets).toBe(false); // 24h vs 15-min target
    expect(a.flags).toContainEqual(
      expect.objectContaining({ code: "no-immutable", severity: "critical" }),
    );
  });
});

describe("cloud derivation (AE2)", () => {
  // Covers AE2: full cloud, 4-hourly snapshots, no cross-region copy
  it("derives RPO from snapshot frequency and flags missing cross-region copy", () => {
    const env: Environment = {
      model: "cloud",
      workloads: [wl({ name: "Core app", type: "database", tier: 2 })],
      protection: {
        cloud: { ...noProtection, frequencyHours: 4 },
      },
    };
    const a = assess(env);
    expect(a.results[0].achievableRpoMin).toBe(240);
    expect(a.flags).toContainEqual(
      expect.objectContaining({ code: "no-cross-region", severity: "critical" }),
    );
  });
});

describe("hybrid derivation", () => {
  it("derives each workload from its placement group", () => {
    const env: Environment = {
      model: "hybrid",
      workloads: [
        wl({ name: "On-prem DB", placement: "onprem", tier: 2 }),
        wl({ name: "Cloud app", placement: "cloud", tier: 2 }),
      ],
      protection: {
        onprem: { ...noProtection, frequencyHours: 24 },
        cloud: { ...noProtection, frequencyHours: 1 },
      },
    };
    const a = assess(env);
    expect(a.results[0].achievableRpoMin).toBe(24 * 60);
    expect(a.results[1].achievableRpoMin).toBe(60);
  });
});

describe("private cloud", () => {
  it("follows the on-prem derivation path", () => {
    const env: Environment = {
      model: "private",
      workloads: [wl({ name: "VM farm" })],
      protection: { onprem: { ...noProtection, frequencyHours: 12 } },
    };
    expect(assess(env).results[0].achievableRpoMin).toBe(12 * 60);
  });
});

describe("unprotected workloads", () => {
  it("reports unrecoverable and flags critically", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "Forgotten file share", type: "files" })],
      protection: { onprem: noProtection },
    };
    const a = assess(env);
    expect(a.results[0].achievableRpoMin).toBeNull();
    expect(a.results[0].achievableRtoMin).toBeNull();
    expect(a.flags).toContainEqual(
      expect.objectContaining({ code: "unprotected-workloads", severity: "critical" }),
    );
  });
});

describe("replication", () => {
  it("uses replication lag for RPO and failover time for RTO", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "Replicated DB", type: "database", tier: 1, sizeGB: 2000 })],
      protection: {
        onprem: {
          ...noProtection,
          frequencyHours: 24,
          replication: true,
          replicationLagMin: 5,
          immutableCopy: true,
          offsiteCopy: true,
          secondSite: true,
        },
      },
    };
    const a = assess(env);
    expect(a.results[0].achievableRpoMin).toBe(5);
    expect(a.results[0].rpoMeets).toBe(true);
    expect(a.results[0].achievableRtoMin).toBe(60);
    expect(a.results[0].rtoMeets).toBe(true);
  });
});

describe("score bounds", () => {
  it("scores an all-green environment at 90+", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "Good DB", tier: 3 })],
      protection: {
        onprem: {
          ...noProtection,
          frequencyHours: 4,
          replication: true,
          replicationLagMin: 5,
          immutableCopy: true,
          offsiteCopy: true,
          secondSite: true,
        },
      },
    };
    expect(assess(env).score).toBeGreaterThanOrEqual(90);
  });

  it("scores an unprotected environment at 20 or below", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "A" }), wl({ name: "B" })],
      protection: { onprem: noProtection },
    };
    expect(assess(env).score).toBeLessThanOrEqual(20);
  });

  it("never leaves 0-100", () => {
    const env: Environment = {
      model: "cloud",
      workloads: [wl({ name: "X", type: "saas" })],
      protection: { cloud: noProtection },
    };
    const s = assess(env).score;
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("SaaS shared responsibility", () => {
  it("flags SaaS workloads", () => {
    const env: Environment = {
      model: "cloud",
      workloads: [wl({ name: "CRM", type: "saas" })],
      protection: { cloud: { ...noProtection, frequencyHours: 24 } },
    };
    expect(assess(env).flags).toContainEqual(
      expect.objectContaining({ code: "saas-shared-responsibility" }),
    );
  });
});

describe("findings payload pseudonymization (R12, R8)", () => {
  it("contains only W<n> labels and no real names anywhere", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [
        wl({ name: "SIMRS-prod-db", type: "database", tier: 1 }),
        wl({ name: "core-banking", type: "vm", tier: 1 }),
      ],
      protection: { onprem: { ...noProtection, frequencyHours: 24 } },
    };
    const a = assess(env);
    const serialized = JSON.stringify(a.findings);
    expect(serialized).not.toContain("SIMRS-prod-db");
    expect(serialized).not.toContain("core-banking");
    for (const w of a.findings.workloads) {
      expect(w.label).toMatch(/^W\d+$/);
    }
  });

  it("round-trips real names through the label map", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "Alpha" }), wl({ name: "Beta" })],
      protection: { onprem: { ...noProtection, frequencyHours: 24 } },
    };
    const a = assess(env);
    expect(a.labelMap["W1"]).toBe("Alpha");
    expect(a.labelMap["W2"]).toBe("Beta");
  });
});

describe("3-2-1 rule ignores protection groups the model doesn't use", () => {
  it("full-cloud environment gets no credit from leftover on-prem toggles", () => {
    const env: Environment = {
      model: "cloud",
      workloads: [wl({ name: "App" })],
      protection: {
        cloud: noProtection, // nothing protected in the active group
        onprem: { ...noProtection, frequencyHours: 24, offsiteCopy: true }, // leftover
      },
    };
    const r = assess(env).rule321;
    expect(r.threeCopies).toBe(false);
    expect(r.oneOffsite).toBe(false);
  });
});

describe("3-2-1 rule", () => {
  it("passes with backup + offsite + replication", () => {
    const env: Environment = {
      model: "onprem",
      workloads: [wl({ name: "DB" })],
      protection: {
        onprem: {
          ...noProtection,
          frequencyHours: 24,
          replication: true,
          offsiteCopy: true,
        },
      },
    };
    const r = assess(env).rule321;
    expect(r.threeCopies).toBe(true);
    expect(r.twoMedia).toBe(true);
    expect(r.oneOffsite).toBe(true);
  });
});

describe("assessFunction (CSF Detect/Respond, U1)", () => {
  it("scores 100 with no gaps when every control is present", () => {
    const all = Object.fromEntries(
      ["siem", "centralLogging", "endpointMonitoring", "alerting", "vulnScanning", "networkMonitoring"].map(
        (k) => [k, true],
      ),
    );
    const r = assessFunction("detect", all);
    expect(r.score).toBe(100);
    expect(r.gaps).toHaveLength(0);
  });

  it("scores 0 and flags every gap-bearing control when none are present", () => {
    const r = assessFunction("detect", {});
    expect(r.score).toBe(0);
    // 5 core detect controls carry gaps; networkMonitoring is advanced (no gap)
    expect(r.gaps.map((g) => g.code).sort()).toEqual(
      ["no-alerting", "no-central-logging", "no-endpoint-monitoring", "no-siem", "no-vuln-scanning"].sort(),
    );
    expect(r.gaps.every((g) => g.scope === "all")).toBe(true);
  });

  it("scores by weight (SIEM present, others absent)", () => {
    const detect = SECURITY_CONTROLS.filter((c) => c.fn === "detect");
    const total = detect.reduce((s, c) => s + c.weight, 0);
    const siemW = detect.find((c) => c.key === "siem")!.weight;
    const r = assessFunction("detect", { siem: true });
    expect(r.score).toBe(Math.round((siemW / total) * 100));
    expect(r.gaps.some((g) => g.code === "no-siem")).toBe(false);
  });
});

describe("assess() CSF wiring (U1)", () => {
  const wl: Workload = { id: "a", name: "ERP", type: "database", sizeGB: 100, tier: 1 };
  const base: Environment = {
    model: "onprem",
    workloads: [wl],
    protection: { onprem: { ...noProtection, frequencyHours: 24 } },
  };

  it("omits detect/respond when security is not assessed (R2)", () => {
    const a = assess(base);
    expect(a.detect).toBeUndefined();
    expect(a.findings.detect).toBeUndefined();
    expect(a.flags.some((f) => f.code.startsWith("no-siem"))).toBe(false);
  });

  it("adds security gaps to flags but leaves the Recover score unchanged (R1)", () => {
    const a = assess({ ...base, security: {} }); // assessed, nothing present
    const recoverOnly = assess(base);
    expect(a.score).toBe(recoverOnly.score); // Recover score not dragged by security gaps
    expect(a.detect?.score).toBe(0);
    expect(a.findings.detect).toEqual({ score: 0 });
    expect(a.flags.some((f) => f.code === "no-siem")).toBe(true);
  });
});
