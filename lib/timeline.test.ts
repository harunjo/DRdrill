import { describe, expect, it } from "vitest";
import { timelineGeometry } from "./timeline";

describe("timelineGeometry — Incident Timeline scale", () => {
  it("puts t=0 at centre and mirrors equal values around it", () => {
    const g = timelineGeometry(240, 240, 240, 240); // all 4h, all met
    expect(g.ticks.some((t) => t.pct === 50 && t.min === 0)).toBe(true);
    // equal RPO/RTO magnitudes land symmetrically about 50
    expect(g.rpo.achPct + g.rto.achPct).toBeCloseTo(100, 5);
  });

  it("marks a missed target with an overrun segment past the target tick", () => {
    // RTO achievable 30h vs 8h target → missed, overrun on the right
    const g = timelineGeometry(1440, 240, 1800, 480);
    expect(g.rto.overrun).not.toBeNull();
    expect(g.rto.within).not.toBeNull();
    // achievable sits further from centre (larger %) than the target on the right
    expect(g.rto.achPct).toBeGreaterThan(g.rto.targetPct);
    expect(g.rto.overrun!.widthPct).toBeGreaterThan(0);
  });

  it("has no overrun when the achievable beats the target", () => {
    const g = timelineGeometry(60, 240, 120, 480); // both well within target
    expect(g.rpo.overrun).toBeNull();
    expect(g.rto.overrun).toBeNull();
    // within-target achievable sits closer to centre than its target tick
    expect(g.rto.achPct).toBeLessThan(g.rto.targetPct);
  });

  it("runs unrecoverable (null) bars off-scale to the axis edge", () => {
    const g = timelineGeometry(null, 240, null, 480);
    expect(g.rpo.noPath).toBe(true);
    expect(g.rto.noPath).toBe(true);
    expect(g.rpo.achPct).toBeCloseTo(6, 5); // left edge (50 - 44)
    expect(g.rto.achPct).toBeCloseTo(94, 5); // right edge (50 + 44)
  });

  it("snaps the axis ceiling up to a nice value that covers the data", () => {
    expect(timelineGeometry(1440, 240, 240, 240).capMin).toBe(1440); // 1d
    expect(timelineGeometry(1500, 240, 240, 240).capMin).toBe(2880); // → 2d
  });
});
