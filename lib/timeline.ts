// Pure geometry for the Incident Timeline (the signature visual). Maps RPO/RTO
// minute values onto ONE shared log time-scale with the incident at t=0 (centre,
// 50%). Data-loss (RPO) reads left of centre; recovery (RTO) right. Each side
// splits into a within-target segment and an overrun segment past the target —
// mirroring the engine's own "green to target, red beyond" logic (see the
// technical lens GapRow). Kept separate from the component so the math is
// unit-tested; the component only positions coloured divs from these numbers.

/** Half-width, in %, from centre (50) out to each edge. Leaves a small margin. */
const SPAN = 44;

// "Nice" ceilings the axis snaps to, in minutes: 1h, 4h, 8h, 1d, 2d, 1wk, 1mo.
const CANDIDATE_CAPS_MIN = [60, 240, 480, 1440, 2880, 10080, 43200];

export interface Seg {
  leftPct: number;
  widthPct: number;
}

export interface SideGeometry {
  within: Seg | null; // centre → target (or → achievable if it beats target)
  overrun: Seg | null; // target → achievable, only when the target is missed
  achPct: number; // x-position of the achievable end (edge when unrecoverable)
  targetPct: number; // x-position of the target tick
  noPath: boolean; // achievable === null → unrecoverable, bar runs off-scale
}

export interface TimelineGeometry {
  capMin: number; // the axis ceiling actually used
  rpo: SideGeometry;
  rto: SideGeometry;
  ticks: { pct: number; min: number }[]; // ruler ticks incl. 0 at centre
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Pick the smallest nice ceiling that covers every value on screen. */
function pickCap(minutes: number[]): number {
  const maxMin = Math.max(1, ...minutes);
  return CANDIDATE_CAPS_MIN.find((c) => c >= maxMin) ?? Math.ceil(maxMin * 1.15);
}

/** x-position (%) for a minute value on the given side. null → the axis edge. */
function pos(min: number | null, side: "left" | "right", capMin: number): number {
  const frac = min === null ? 1 : clamp(Math.log(1 + min) / Math.log(1 + capMin), 0, 1);
  return side === "right" ? 50 + frac * SPAN : 50 - frac * SPAN;
}

function sideGeometry(
  achMin: number | null,
  targetMin: number,
  side: "left" | "right",
  capMin: number,
): SideGeometry {
  const targetPct = pos(targetMin, side, capMin);
  const achPct = pos(achMin, side, capMin);
  const noPath = achMin === null;
  // "missed" = the achievable end sits further from centre than the target.
  const missed = noPath || (achMin as number) > targetMin;

  // Distance from centre (50) is what a segment covers; convert the two ends
  // to a left/width box regardless of side.
  const seg = (aPct: number, bPct: number): Seg => ({
    leftPct: Math.min(aPct, bPct),
    widthPct: Math.abs(aPct - bPct),
  });

  const innerEnd = missed ? targetPct : achPct; // the within-target outer edge
  const within = { ...seg(50, innerEnd) };
  const overrun = missed ? seg(targetPct, achPct) : null;
  return { within, overrun, achPct, targetPct, noPath };
}

/** Ruler ticks: 0 at centre plus nice values ≤ cap, mirrored on both sides.
 *  On a log axis the big values bunch against the edge, so we walk edge→centre
 *  keeping the cap and dropping any tick within MIN_GAP% of the last kept one —
 *  labels never collide regardless of the ceiling chosen. */
function buildTicks(capMin: number): { pct: number; min: number }[] {
  // % between adjacent tick labels. Sized for a ~350px axis on a phone, where
  // a label like "−1 hari" is ~11% of the width — 16% keeps neighbours clear.
  const MIN_GAP = 16;
  const inRange = CANDIDATE_CAPS_MIN.filter((c) => c <= capMin);
  const ticks: { pct: number; min: number }[] = [{ pct: 50, min: 0 }];
  for (const side of ["left", "right"] as const) {
    let lastPct = -Infinity;
    for (let i = inRange.length - 1; i >= 0; i--) {
      const m = inRange[i];
      const pct = pos(m, side, capMin);
      if (lastPct === -Infinity || Math.abs(pct - lastPct) >= MIN_GAP) {
        ticks.push({ pct, min: side === "left" ? -m : m });
        lastPct = pct;
      }
    }
  }
  return ticks;
}

export function timelineGeometry(
  rpoAchievableMin: number | null,
  rpoTargetMin: number,
  rtoAchievableMin: number | null,
  rtoTargetMin: number,
): TimelineGeometry {
  const capMin = pickCap(
    [rpoAchievableMin, rpoTargetMin, rtoAchievableMin, rtoTargetMin].filter(
      (v): v is number => v !== null,
    ),
  );
  return {
    capMin,
    rpo: sideGeometry(rpoAchievableMin, rpoTargetMin, "left", capMin),
    rto: sideGeometry(rtoAchievableMin, rtoTargetMin, "right", capMin),
    ticks: buildTicks(capMin),
  };
}
