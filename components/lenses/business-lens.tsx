"use client";

import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { fmtMinutes, type Assessment, type DurationLabels } from "@/lib/engine";
import { aggregateExposure, formatIDR, isCatastrophic, postureBand, workloadExposure } from "@/lib/exposure";
import { Heatmap } from "@/components/heatmap";
import { PostureChip } from "@/components/lenses/shared";

export function BusinessLens({ t, assessment }: { t: Dictionary; assessment: Assessment }) {
  const a = assessment;
  const b = t.report.business;
  const inv = t.report.invest;
  const n = a.results.length;
  const agg = aggregateExposure(a.results);
  const posture = postureBand(a.results, a.flags);
  const coverage = fmt(t.report.coverageShort, { n });
  const dur: DurationLabels = { unrecoverable: t.report.unrecoverable, ...t.report.units };

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
              {formatIDR(agg.total)}
              {agg.catastrophicCount > 0 && (
                <span className="ml-2 align-middle text-[13px] font-semibold text-crit">
                  · {fmt(inv.plusUnrecoverable, { n: agg.catastrophicCount })}
                </span>
              )}
            </div>
          ) : agg.catastrophicCount > 0 ? (
            <div className="mt-1 font-mono text-[1.35rem] font-semibold tracking-tight text-crit">
              {fmt(inv.allUnrecoverable, { n: agg.catastrophicCount })}
            </div>
          ) : (
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{b.addCost}</p>
          )}
          <div className="mt-1 text-[12px] text-faint">{inv.bia}</div>
        </div>
      </div>

      {/* Heatmap + per-workload breakdown */}
      <div className="px-5 py-5 sm:px-6">
        <Heatmap t={t} results={a.results} flags={a.flags} model={a.findings.model} />

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
                    <span className="chip chip-crit shrink-0">{t.report.unrecoverable}</span>
                  ) : e != null ? (
                    <span className="shrink-0 font-mono font-semibold text-crit">{formatIDR(e)}</span>
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
      </div>
    </section>
  );
}
