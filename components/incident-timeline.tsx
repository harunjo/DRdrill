"use client";

// The Incident Timeline — DR Drill's signature visual. One shared log time-axis
// with the incident at t=0 (centre): data-loss (RPO) reads left, recovery (RTO)
// right, each bar green/slate within target and red past it. Geometry comes from
// lib/timeline.ts (pure + tested); this file only paints it. Used per-workload in
// the report and, larger, as the intake hero.

import { timelineGeometry, type Seg } from "@/lib/timeline";

export interface IncidentTimelineLabels {
  dataYouLose: string; // "◄ Data you lose · RPO"
  timeDown: string; // "Time you're down · RTO ►"
  incident: string; // "INCIDENT · t=0"
  rpoTarget: string; // "RPO target"
  rtoTarget: string; // "RTO target"
  noPath: string; // "no path" — unrecoverable
}

export function IncidentTimeline({
  rpoAchievableMin,
  rpoTargetMin,
  rtoAchievableMin,
  rtoTargetMin,
  fmtDur,
  labels,
  exposure,
  compact = false,
}: {
  rpoAchievableMin: number | null;
  rpoTargetMin: number;
  rtoAchievableMin: number | null;
  rtoTargetMin: number;
  fmtDur: (min: number | null) => string;
  labels: IncidentTimelineLabels;
  exposure?: { label: string; text: string; critical?: boolean } | null;
  compact?: boolean;
}) {
  const g = timelineGeometry(rpoAchievableMin, rpoTargetMin, rtoAchievableMin, rtoTargetMin);
  const rpoMissed = rpoAchievableMin === null || rpoAchievableMin > rpoTargetMin;
  const rtoMissed = rtoAchievableMin === null || rtoAchievableMin > rtoTargetMin;
  // Unrecoverable prints the SHORT label (the locale's long "unrecoverable"
  // phrase, twice, in nowrap mono, overflows the card) and paints its whole
  // side crit — a green "within target" segment under a bar that never comes
  // back would read as good news.
  const val = (m: number | null) => (m === null ? labels.noPath : fmtDur(m));

  // Vertical rhythm — one set for the hero, a tighter one for report rows.
  const H = compact ? 84 : 116; // track height (bars + ruler)
  const barTop = compact ? 34 : 46; // centre-line of the bar
  const barH = 13;

  const segStyle = (s: Seg): React.CSSProperties => ({
    position: "absolute",
    left: `${s.leftPct}%`,
    width: `${s.widthPct}%`,
    top: barTop,
    height: barH,
    transform: "translateY(-50%)",
  });

  return (
    <div className="w-full">
      {/* readouts — value never wraps; the "/ target" reference drops on
          narrow screens (still shown by the dashed target tick below). */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="tag !text-[10px] text-faint">{labels.dataYouLose}</div>
          <div className="whitespace-nowrap font-mono text-[12px] font-bold sm:text-[14px]">
            <span className={rpoMissed ? "text-crit" : "text-ok"}>{val(rpoAchievableMin)}</span>
            {!compact && (
              <span className="hidden text-faint sm:inline"> / {fmtDur(rpoTargetMin)}</span>
            )}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="tag !text-[10px] text-faint">{labels.timeDown}</div>
          <div className="whitespace-nowrap font-mono text-[12px] font-bold sm:text-[14px]">
            <span className={rtoMissed ? "text-crit" : "text-ok"}>{val(rtoAchievableMin)}</span>
            {!compact && (
              <span className="hidden text-faint sm:inline"> / {fmtDur(rtoTargetMin)}</span>
            )}
          </div>
        </div>
      </div>

      {/* track */}
      <div className="relative" style={{ height: H }}>
        {/* event line + marker at t=0 */}
        <div
          className="absolute z-[3] w-0.5 bg-event"
          style={{ left: "50%", top: compact ? 6 : 10, bottom: 24, transform: "translateX(-50%)" }}
        >
          {!compact && (
            <span
              className="absolute left-1/2 top-0 whitespace-nowrap rounded-[2px] bg-event px-2 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white"
              style={{ transform: "translate(-50%,-100%)" }}
            >
              {labels.incident}
            </span>
          )}
          <span
            className="absolute left-1/2 bg-event"
            style={{
              top: barTop - (compact ? 6 : 10),
              width: 11,
              height: 11,
              transform: "translate(-50%,-50%) rotate(45deg)",
              boxShadow: "0 0 0 4px var(--color-event-soft)",
            }}
          />
        </div>

        {/* bar segments — within target vs overrun, both sides on one line.
            An unrecoverable side is one solid crit run to the axis edge. */}
        {g.rpo.noPath ? (
          <div
            style={{ ...segStyle({ leftPct: 50 - 44, widthPct: 44 }), borderRadius: "2px 0 0 2px" }}
            className="bg-crit"
          />
        ) : (
          <>
            {g.rpo.within && (
              <div style={segStyle(g.rpo.within)} className="rounded-[1px] bg-slate" />
            )}
            {g.rpo.overrun && (
              <div
                style={{ ...segStyle(g.rpo.overrun), borderRadius: "2px 0 0 2px" }}
                className="bg-crit"
              />
            )}
          </>
        )}
        {g.rto.noPath ? (
          <div
            style={{ ...segStyle({ leftPct: 50, widthPct: 44 }), borderRadius: "0 2px 2px 0" }}
            className="bg-crit"
          />
        ) : (
          <>
            {g.rto.within && (
              <div style={segStyle(g.rto.within)} className="rounded-[1px] bg-ok" />
            )}
            {g.rto.overrun && (
              <div
                style={{
                  ...segStyle(g.rto.overrun),
                  borderRadius: "0 2px 2px 0",
                  background: "linear-gradient(90deg, var(--color-warn), var(--color-crit))",
                }}
              />
            )}
          </>
        )}

        {/* target ticks */}
        {[
          { pct: g.rpo.targetPct, label: labels.rpoTarget },
          { pct: g.rto.targetPct, label: labels.rtoTarget },
        ].map((t) => (
          <div
            key={t.label}
            className="absolute z-[2] border-l border-dashed border-text/50"
            style={{ left: `${t.pct}%`, top: barTop - 16, height: 30 }}
          >
            {!compact && (
              <span
                className="absolute left-1/2 whitespace-nowrap font-mono text-[9px] tracking-wide text-muted"
                style={{ bottom: -14, transform: "translateX(-50%)" }}
              >
                {t.label}
              </span>
            )}
          </div>
        ))}

        {/* baseline ruler */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-line" style={{ height: 22 }}>
          {g.ticks.map((tk) => {
            const zero = tk.min === 0;
            return (
              <span
                key={tk.min}
                className={`absolute top-0 -translate-x-1/2 whitespace-nowrap pt-[5px] font-mono text-[8.5px] sm:text-[9.5px] ${zero ? "font-bold text-event" : "text-faint"}`}
                style={{ left: `${tk.pct}%` }}
              >
                <span
                  className={`absolute left-1/2 top-0 w-px ${zero ? "bg-event" : "bg-line"}`}
                  style={{ height: zero ? 6 : 5 }}
                />
                {zero ? "0" : signed(tk.min, fmtDur)}
              </span>
            );
          })}
        </div>
      </div>

      {/* optional exposure meter */}
      {exposure && (
        <div className="mt-3 flex items-baseline justify-end gap-2.5">
          <span className="tag !text-[10px] text-faint">{exposure.label}</span>
          <span
            className={`font-mono text-[18px] font-bold tabular-nums ${exposure.critical === false ? "text-text" : "text-crit"}`}
          >
            {exposure.text}
          </span>
        </div>
      )}
    </div>
  );
}

// Ruler labels are ± offsets from t=0; fmtDur handles the magnitude, we add sign.
function signed(min: number, fmtDur: (m: number) => string): string {
  return (min < 0 ? "−" : "+") + fmtDur(Math.abs(min));
}
