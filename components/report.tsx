"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { fmtMinutes, type Assessment, type DurationLabels } from "@/lib/engine";

// Every panel is screenshot-self-contained (R10): its own title, verdict, and
// a caption naming the tool and the "as described" framing.

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="panel mt-4 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{caption}</span>
      </div>
      <div className="mt-3 rule" />
      {children}
    </section>
  );
}

function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}

// A single RPO or RTO gap on a shared time axis: green fill up to the target,
// red "overrun" from the target out to the (worse) achievable reality.
function GapMeter({
  label,
  target,
  achievable,
  meets,
  dur,
  lit,
}: {
  label: string;
  target: number;
  achievable: number | null;
  meets: boolean;
  dur: DurationLabels;
  lit: boolean;
}) {
  const unrecoverable = achievable === null;
  const scale = unrecoverable ? target : Math.max(target, achievable, 1);
  const greenW = unrecoverable ? 0 : (Math.min(achievable, target) / scale) * 100;
  const redW = unrecoverable ? 100 : achievable > target ? ((achievable - target) / scale) * 100 : 0;
  const tickPos = unrecoverable ? -1 : (target / scale) * 100;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-mono text-[11px]">
          <span className={meets ? "text-ok" : "text-crit"}>{fmtMinutes(achievable, dur)}</span>
          <span className="text-faint"> / {fmtMinutes(target, dur)}</span>
        </span>
      </div>
      <div className="relative">
        <div className="flex h-2 w-full overflow-hidden rounded-sm bg-well">
          <div
            className="h-full bg-ok transition-[width] duration-700 ease-out"
            style={{ width: lit ? `${greenW}%` : "0%" }}
          />
          <div
            className="h-full bg-crit transition-[width] duration-700 ease-out"
            style={{ width: lit ? `${redW}%` : "0%" }}
          />
        </div>
        {tickPos >= 0 && tickPos < 100 && (
          <span
            aria-hidden
            className="absolute -top-1 h-4 w-px bg-text/70"
            style={{ left: `${tickPos}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function Report({
  t,
  assessment,
  drill,
}: {
  t: Dictionary;
  assessment: Assessment;
  drill: ReactNode;
}) {
  const a = assessment;
  const caption = t.appName;
  const dur: DurationLabels = { unrecoverable: t.report.unrecoverable, ...t.report.units };

  const [lit, setLit] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const count = useCountUp(a.score, lit);

  const tier = a.score >= 70 ? "good" : a.score >= 40 ? "fair" : "poor";
  const band =
    tier === "good" ? "var(--color-ok)" : tier === "fair" ? "var(--color-warn)" : "var(--color-crit)";

  const rule = [
    [a.rule321.threeCopies, t.report.rule321.threeCopies],
    [a.rule321.twoMedia, t.report.rule321.twoMedia],
    [a.rule321.oneOffsite, t.report.rule321.oneOffsite],
  ] as const;

  return (
    <div className="mt-10">
      <Panel title={t.report.scoreTitle} caption={caption}>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-display text-[4rem] font-semibold leading-none tracking-tight"
                style={{ color: band }}
              >
                {count}
              </span>
              <span className="font-display text-2xl text-faint">{t.report.scoreOutOf}</span>
            </div>
          </div>
          {/* Signature: the verdict stamped onto the sheet */}
          <span className="stamp mr-1 mt-2 shrink-0" style={{ color: band }}>
            {t.report.statusLabel[tier]}
          </span>
        </div>

        <div className="relative mt-5 max-w-xl">
          <div className="h-2 overflow-hidden rounded-sm bg-well">
            <div
              className="h-full transition-[width] duration-1000 ease-out"
              style={{ width: lit ? `${a.score}%` : "0%", background: band }}
            />
          </div>
          {[40, 70].map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-faint"
              style={{ left: `${tick}%` }}
            />
          ))}
        </div>

        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-muted">
          {fmt(t.report.coverage, { n: a.results.length })}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
          <span className="text-[12px] font-medium text-muted">{t.report.rule321Title}</span>
          {rule.map(([pass, label]) => (
            <span key={label} className={pass ? "chip chip-ok" : "chip chip-neutral"}>
              {pass ? "✓" : "✕"} {label}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title={t.report.gapTitle} caption={caption}>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ok" />
            {t.report.legend.withinTarget}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-crit" />
            {t.report.legend.overrun}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-px bg-text/70" />
            {t.report.legend.target}
          </span>
        </div>
        <div className="mt-2">
          {a.results.map((r) => {
            const f = a.findings.workloads.find((w) => w.label === r.label)!;
            return (
              <div
                key={r.workload.id}
                className="border-t border-line-soft py-4 first:border-t-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{r.workload.name}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint">
                    {t.report.workload} · T{r.workload.tier}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <GapMeter
                    label={t.report.achievableRpo}
                    target={f.targetRpoMin}
                    achievable={r.achievableRpoMin}
                    meets={r.rpoMeets}
                    dur={dur}
                    lit={lit}
                  />
                  <GapMeter
                    label={t.report.achievableRto}
                    target={f.targetRtoMin}
                    achievable={r.achievableRtoMin}
                    meets={r.rtoMeets}
                    dur={dur}
                    lit={lit}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title={t.report.flagsTitle} caption={caption}>
        <div className="mt-1">
          {a.flags.map((f, i) => {
            const copy = t.report.flags[f.code];
            const critical = f.severity === "critical";
            return (
              <div
                key={`${f.code}-${f.scope}-${i}`}
                className="flex gap-4 border-t border-line-soft py-4 text-[13px] first:border-t-0"
              >
                <span className="mt-0.5 font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={critical ? "chip chip-crit" : "chip chip-warn"}>
                      {critical ? t.report.severity.critical : t.report.severity.warning}
                    </span>
                    <span className="font-medium text-text">{copy.title}</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-muted">{copy.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title={t.drill.title} caption={caption}>
        {drill}
      </Panel>
    </div>
  );
}
