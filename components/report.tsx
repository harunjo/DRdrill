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
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{caption}</span>
      </div>
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

// A single RPO or RTO gap rendered on a shared time axis: green fill up to the
// target, red "overrun" from the target out to the (worse) achievable reality.
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
      <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
        <span className="uppercase tracking-wider text-faint">{label}</span>
        <span>
          <span className={meets ? "text-ok" : "text-crit"}>{fmtMinutes(achievable, dur)}</span>
          <span className="text-faint"> / {fmtMinutes(target, dur)}</span>
        </span>
      </div>
      <div className="relative">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
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
            className="absolute -top-[3px] h-3 w-px bg-text/70"
            style={{ left: `${tickPos}%` }}
          />
        )}
      </div>
    </div>
  );
}

function ScoreRing({ value, band, label }: { value: number; band: string; label: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={band}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-medium tracking-tight leading-none" style={{ color: band }}>
          {value}
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
          {label}
        </span>
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

  const band =
    a.score >= 70 ? "var(--color-ok)" : a.score >= 40 ? "var(--color-signal)" : "var(--color-crit)";

  const rule = [
    [a.rule321.threeCopies, t.report.rule321.threeCopies],
    [a.rule321.twoMedia, t.report.rule321.twoMedia],
    [a.rule321.oneOffsite, t.report.rule321.oneOffsite],
  ] as const;

  return (
    <div className="mt-10">
      <Panel title={t.report.scoreTitle} caption={caption}>
        <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing value={count} band={band} label={t.report.scoreOutOf} />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-muted">
              {fmt(t.report.coverage, { n: a.results.length })}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                {t.report.rule321Title}
              </span>
              {rule.map(([pass, label]) => (
                <span
                  key={label}
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs ${
                    pass ? "border-ok/30 bg-ok/[0.08] text-ok" : "border-line text-faint"
                  }`}
                >
                  {pass ? "●" : "○"} {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={t.report.gapTitle} caption={caption}>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ok" />
            {t.report.legend.withinTarget}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-crit" />
            {t.report.legend.overrun}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-0.5 rounded-full bg-text/80" />
            {t.report.legend.target}
          </span>
        </div>
        <div className="mt-3">
          {a.results.map((r) => {
            const f = a.findings.workloads.find((w) => w.label === r.label)!;
            return (
              <div
                key={r.workload.id}
                className="border-t border-line-soft py-4 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-sm font-medium">{r.workload.name}</span>
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
        <div className="mt-4 space-y-2.5">
          {a.flags.map((f, i) => {
            const copy = t.report.flags[f.code];
            const critical = f.severity === "critical";
            return (
              <div
                key={`${f.code}-${f.scope}-${i}`}
                className="flex gap-3 rounded-md border border-line bg-well p-3.5 text-[13px]"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 w-0.5 shrink-0 self-stretch rounded-full ${
                    critical ? "bg-crit" : "bg-warn"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-text">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider ${
                        critical ? "text-crit" : "text-warn"
                      }`}
                    >
                      {critical ? "crit" : "warn"}
                    </span>
                    {copy.title}
                  </div>
                  <div className="mt-1 text-muted">{copy.detail}</div>
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
