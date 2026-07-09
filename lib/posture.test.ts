import { describe, expect, it } from "vitest";
import { CSF_FUNCTIONS, radarSpokes, type PostureScores } from "./posture";

const scores = (over: Partial<PostureScores>): PostureScores => ({
  govern: null,
  identify: null,
  protect: null,
  detect: null,
  respond: null,
  recover: null,
  ...over,
});

describe("radarSpokes (U5)", () => {
  it("returns one spoke per CSF function, in order, first at the top", () => {
    const s = radarSpokes(scores({}), 100);
    expect(s.map((x) => x.fn)).toEqual(CSF_FUNCTIONS);
    // first spoke (govern) points straight up: x≈0, y≈-radius
    expect(Math.abs(s[0].axis.x)).toBeLessThan(1e-9);
    expect(s[0].axis.y).toBeCloseTo(-100);
  });

  it("a 100 score sits on the outer ring, 0 at the centre", () => {
    const s = radarSpokes(scores({ recover: 100, detect: 0 }), 100);
    const recover = s.find((x) => x.fn === "recover")!;
    const detect = s.find((x) => x.fn === "detect")!;
    expect(Math.hypot(recover.point.x, recover.point.y)).toBeCloseTo(100);
    expect(Math.hypot(detect.point.x, detect.point.y)).toBeCloseTo(0);
  });

  it("a not-assessed function sits at the centre (radius 0), distinct from score 0", () => {
    const s = radarSpokes(scores({ govern: null }), 100);
    const govern = s.find((x) => x.fn === "govern")!;
    expect(govern.score).toBeNull();
    expect(govern.point.x).toBeCloseTo(0);
    expect(govern.point.y).toBeCloseTo(0);
  });

  it("clamps out-of-range scores to the ring", () => {
    const s = radarSpokes(scores({ detect: 150 }), 100);
    const detect = s.find((x) => x.fn === "detect")!;
    expect(Math.hypot(detect.point.x, detect.point.y)).toBeCloseTo(100);
  });
});
