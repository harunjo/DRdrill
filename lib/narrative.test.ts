import { describe, expect, it } from "vitest";
import type { FindingsPayload } from "./engine";
import {
  buildPrompt,
  substituteLabels,
  validateNarrative,
  validateRequest,
} from "./narrative";

const findings: FindingsPayload = {
  model: "onprem",
  workloads: [
    {
      label: "W1",
      type: "database",
      tier: 1,
      achievableRpoMin: 660, // 11 h
      achievableRtoMin: 90,
      targetRpoMin: 15,
      targetRtoMin: 60,
      rpoMeets: false,
      rtoMeets: false,
    },
  ],
  flags: [{ code: "no-immutable", severity: "critical", scope: "onprem" }],
  rule321: { threeCopies: false, twoMedia: false, oneOffsite: false },
  score: 34,
};

const goodRequest = { findings, scenario: "ransomware", lang: "en" };

describe("validateRequest (server-side trust boundary)", () => {
  it("accepts a valid pseudonymized payload", () => {
    expect(validateRequest(goodRequest)).not.toBeNull();
  });

  it("rejects non-W labels (real names smuggled in)", () => {
    const bad = structuredClone(goodRequest);
    bad.findings.workloads[0].label = "SIMRS-prod-db";
    expect(validateRequest(bad)).toBeNull();
  });

  it("rejects unknown fields (payload smuggling)", () => {
    const bad = { ...structuredClone(goodRequest), extra: "field" };
    expect(validateRequest(bad)).toBeNull();
  });

  it("rejects oversized workload arrays", () => {
    const bad = structuredClone(goodRequest);
    bad.findings.workloads = Array.from({ length: 11 }, (_, i) => ({
      ...findings.workloads[0],
      label: `W${i + 1}`,
    }));
    expect(validateRequest(bad)).toBeNull();
  });

  it("rejects bad scenario and language values", () => {
    expect(validateRequest({ ...goodRequest, scenario: "alien-invasion" })).toBeNull();
    expect(validateRequest({ ...goodRequest, lang: "fr" })).toBeNull();
  });

  it("rejects out-of-range numbers", () => {
    const bad = structuredClone(goodRequest);
    bad.findings.score = 101;
    expect(validateRequest(bad)).toBeNull();
  });
});

describe("buildPrompt (R21 — no raw user text reaches the prompt)", () => {
  it("contains only labels, never real names", () => {
    const prompt = buildPrompt({ findings, scenario: "ransomware", lang: "en" });
    expect(prompt).toContain("W1");
    expect(prompt).not.toContain("SIMRS");
    expect(prompt).toContain("660");
  });
});

describe("validateNarrative (R20, AE3)", () => {
  it("accepts a story using only findings-derived numbers and valid labels", () => {
    const story =
      "02:14 — Ransomware detected on W1.\n03:00 — The last clean copy is 11 hours old.\n04:30 — Restore begins; 90 minutes to bring W1 back.";
    expect(validateNarrative(story, findings).ok).toBe(true);
  });

  it("rejects a story that invents a number", () => {
    const story = "02:14 — W1 fails over in 4 hours."; // 4h not derivable
    const v = validateNarrative(story, findings);
    expect(v.ok).toBe(false);
    expect(v.offending).toContain("4");
  });

  it("rejects a story referencing an unknown workload label", () => {
    const story = "02:14 — W9 is encrypted."; // W9 doesn't exist
    expect(validateNarrative(story, findings).ok).toBe(false);
  });

  it("exempts clock-time beat prefixes from number checking", () => {
    const story = "23:59 — W1 monitoring alarms fire.";
    expect(validateNarrative(story, findings).ok).toBe(true);
  });
});

describe("substituteLabels", () => {
  it("re-substitutes real names in the browser", () => {
    const out = substituteLabels("02:14 — W1 is down.", { W1: "ERP database" });
    expect(out).toContain("ERP database (W1)");
  });
});
