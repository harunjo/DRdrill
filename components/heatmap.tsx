"use client";

import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import type { DeploymentModel, RiskFlag, WorkloadResult } from "@/lib/engine";
import { aggregateExposure } from "@/lib/exposure";
import { criticalInScope, placeWorkload, type Level } from "@/lib/heatmap";

// impact × readiness-gap. No probability axis. Every cell carries a text label;
// color is never the sole signal (R12).

type Placed = { r: WorkloadResult; catastrophic: boolean };

function tone(score: number): string {
  return score >= 3 ? "crit" : score >= 2 ? "warn" : "ok";
}
const TINT: Record<string, string> = {
  ok: "var(--color-ok-soft)",
  warn: "var(--color-warn-soft)",
  crit: "var(--color-crit-soft)",
};
const INK: Record<string, string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
};

export function Heatmap({
  t,
  results,
  flags,
  model,
}: {
  t: Dictionary;
  results: WorkloadResult[];
  flags: RiskFlag[];
  model: DeploymentModel;
}) {
  const useExposureAxis = aggregateExposure(results).hasCost;
  const h = t.report.heatmap;

  // matrix[impact][gap] — impact 0..2 (row), gap 0..2 (col)
  const matrix: Placed[][][] = [0, 1, 2].map(() => [0, 1, 2].map(() => [] as Placed[]));
  for (const r of results) {
    const cell = placeWorkload(r, criticalInScope(r, flags, model), useExposureAxis);
    matrix[cell.impact][cell.gap].push({ r, catastrophic: cell.catastrophic });
  }

  const rows: Level[] = [2, 1, 0]; // top row = high impact
  const cols: Level[] = [0, 1, 2];

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        {/* y-axis label */}
        <div className="flex w-5 shrink-0 items-center justify-center">
          <span className="tag rotate-180 [writing-mode:vertical-rl] text-[9px]">{h.impact}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-3 gap-1.5">
            {rows.map((impact) =>
              cols.map((gap) => {
                const cell = matrix[impact][gap];
                const cls = tone(impact + gap);
                const filled = cell.length > 0;
                const shown = cell.slice(0, 2);
                const overflow = cell.length - shown.length;
                return (
                  <div
                    key={`${impact}-${gap}`}
                    className="min-h-[3.25rem] rounded-md p-1"
                    style={{ background: filled ? TINT[cls] : "var(--color-well)" }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {shown.map(({ r, catastrophic }) => (
                        <span
                          key={r.label}
                          title={r.workload.name}
                          className="max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: catastrophic ? "var(--color-crit)" : "var(--color-panel)",
                            color: catastrophic ? "#fff" : INK[cls],
                            border: catastrophic ? "none" : `1px solid ${INK[cls]}33`,
                          }}
                        >
                          {r.workload.name}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                          {fmt(h.more, { n: overflow })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }),
            )}
          </div>
          {/* x-axis labels */}
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            {cols.map((gap) => (
              <span key={gap} className="tag text-center text-[9px]">
                {h.gapLevels[gap]}
              </span>
            ))}
          </div>
          <div className="mt-1 text-center">
            <span className="tag text-[9px]">{h.readiness}</span>
          </div>
        </div>
      </div>

      {/* legend: impact bands + catastrophic marker */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
        <span>
          {h.impact}: {h.impactLevels[0]} → {h.impactLevels[2]}
        </span>
        {results.some((r) => r.achievableRtoMin === null) && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-crit" />
            {h.catastrophic}
          </span>
        )}
        {!useExposureAxis && <span>· {h.tierAxis}</span>}
      </div>
    </div>
  );
}
