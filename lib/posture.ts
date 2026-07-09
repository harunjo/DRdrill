// Pure geometry + taxonomy for the NIST CSF posture radar (R2). No React here so
// the coordinate math is unit-testable; the SVG wrapper lives in the component.

export type CsfFunctionId =
  | "govern"
  | "identify"
  | "protect"
  | "detect"
  | "respond"
  | "recover";

// Display order around the radar (clockwise from top).
export const CSF_FUNCTIONS: CsfFunctionId[] = [
  "govern",
  "identify",
  "protect",
  "detect",
  "respond",
  "recover",
];

/** Per-function score 0–100, or null when the function was not assessed (R3 —
 *  null must read as "not assessed", never as zero). */
export type PostureScores = Record<CsfFunctionId, number | null>;

export interface RadarSpoke {
  fn: CsfFunctionId;
  score: number | null;
  /** unit vector × radius — the outer axis endpoint (label/line anchor) */
  axis: { x: number; y: number };
  /** point at the score's radius (equals centre when not assessed) */
  point: { x: number; y: number };
}

/** Map scores to radar geometry, centred at (0,0), first spoke at the top and
 *  going clockwise. Not-assessed spokes carry a point at the centre — the
 *  component renders them as a dashed axis with no value bar, not as a 0. */
export function radarSpokes(scores: PostureScores, radius: number): RadarSpoke[] {
  const n = CSF_FUNCTIONS.length;
  return CSF_FUNCTIONS.map((fn, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const score = scores[fn];
    const r = score == null ? 0 : (Math.max(0, Math.min(100, score)) / 100) * radius;
    return {
      fn,
      score,
      axis: { x: cos * radius, y: sin * radius },
      point: { x: cos * r, y: sin * r },
    };
  });
}
