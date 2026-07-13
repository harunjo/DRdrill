"use client";

import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { fmtMinutes, type Assessment, type DurationLabels } from "@/lib/engine";
import { aggregateExposure, annualizedLoss, catastrophicList, formatMoney, isCatastrophic, postureBand, workloadExposure } from "@/lib/exposure";
import { Heatmap } from "@/components/heatmap";
import { PostureChip } from "@/components/lenses/shared";

export function BusinessLens({ t, assessment }: { t: Dictionary; assessment: Assessment }) {
  const a = assessment;
  const b = t.report.business;
  const inv = t.report.invest;
  const n = a.results.length;
  const agg = aggregateExposure(a.results);
  const ale = annualizedLoss(agg.total, a.flags.filter((f) => f.severity === "critical").length);
  const posture = postureBand(a.results, a.flags);
  const coverage = fmt(t.report.coverageShort, { n });
  const dur: DurationLabels = { unrecoverable: t.report.unrecoverable, ...t.report.units };
  const catNames = catastrophicList(a.results, (tier) => inv.pdf.crit[tier]);

  return (
    <section className="panel mt-4 overflow-hidden">
      {/* Hero: exposure headline + posture */}
      <div className="hero-band border-b border-line px-5 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-tight">{b.title}</h2>
            <p className="mt-0.5 text-[12px] text-faint">{coverage}</p>
          </div>
          <PostureChip t={t} posture={posture} />
        </div>

        <div className="mt-4">
          <div className="tag text-[10px]">{b.exposureHeadline}</div>
          {agg.monetizedCount > 0 ? (
            <div className="mt-1 font-mono text-[2rem] font-semibold tracking-tight text-crit">
              {formatMoney(agg.total, t.currency)}
              {agg.catastrophicCount > 0 && (
                <span className="ml-2 align-middle text-[13px] font-semibold text-crit">
                  · {fmt(inv.plusUnrecoverable, { names: catNames })}
                </span>
              )}
            </div>
          ) : agg.catastrophicCount > 0 ? (
            <div className="mt-1 font-mono text-[1.35rem] font-semibold tracking-tight text-crit">
              {fmt(inv.allUnrecoverable, { names: catNames })}
            </div>
          ) : (
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{b.addCost}</p>
          )}
          {agg.monetizedCount > 0 && ale > 0 && (
            <div className="mt-3">
              <div className="tag text-[10px]">{b.annualized}</div>
              <div className="mt-0.5 font-mono text-[1.2rem] font-semibold text-warn">
                {formatMoney(ale, t.currency)}
              </div>
              <div className="mt-0.5 max-w-sm text-[11px] leading-relaxed text-faint">{b.aleNote}</div>
            </div>
          )}
          <div className="mt-2 text-[12px] text-faint">{inv.bia}</div>
        </div>
      </div>

      {/* Heatmap + per-workload breakdown. The 3×3 grid only reads as a grid with
          a few workloads to place — below that it's mostly empty cells, so the
          per-workload list below carries it. */}
      <div className="px-5 py-5 sm:px-6">
        {a.results.length >= 3 && (
          <Heatmap t={t} results={a.results} flags={a.flags} model={a.findings.model} />
        )}

        <div className="mt-5 border-t border-line-soft pt-4">
          <div className="tag mb-2 text-[10px]">{b.perWorkload}</div>
          <div className="grid gap-1.5">
            {a.results.map((r) => {
              const cat = isCatastrophic(r);
              const e = workloadExposure(r);
              return (
                <div
                  key={r.workload.id}
                  className="flex items-center justify-between gap-2 text-[13px]"
                >
                  <span className="truncate text-muted">{r.workload.name}</span>
                  {cat ? (
                    // Short label — the full unrecoverable phrase inside a
                    // nowrap chip forces the page wider than a phone viewport.
                    <span className="chip chip-crit shrink-0">{t.report.timeline.noPath}</span>
                  ) : e != null ? (
                    <span className="shrink-0 font-mono font-semibold text-crit">{formatMoney(e, t.currency)}</span>
                  ) : (
                    <span className="shrink-0 font-mono text-faint">
                      {fmtMinutes(r.achievableRtoMin, dur)} {b.downtimeLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {a.results.some(isCatastrophic) && (
          <p className="mt-4 border-t border-line-soft pt-3 text-[12px] font-medium text-crit">
            {b.unrecoverableNote}
          </p>
        )}
      </div>
    </section>
  );
}
