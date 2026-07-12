"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Siren, ChevronDown } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { fmtMinutes, type Assessment, type DurationLabels } from "@/lib/engine";
import { groupByFunction } from "@/lib/investment";

type Tone = "ok" | "warn" | "crit" | "signal";

const TONE: Record<Tone, string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
  signal: "var(--color-signal)",
};

// Every part is screenshot-self-contained (R10): its own title, verdict pill,
// and a coverage line naming the N workloads.
function Part({
  title,
  coverage,
  verdict,
  verdictTone = "signal",
  children,
}: {
  title: string;
  coverage: string;
  verdict?: string;
  verdictTone?: Tone;
  children: ReactNode;
}) {
  return (
    <section className="panel mt-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
        {verdict && (
          <span className="chip shrink-0" style={{ background: `${TONE[verdictTone]}18`, color: TONE[verdictTone] }}>
            {verdict}
          </span>
        )}
      </div>
      <p className="mt-1 text-[12px] text-faint">{coverage}</p>
      <div className="mt-4 rule" />
      {children}
    </section>
  );
}

function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    // Reduced motion → dur 0 so the first frame lands on target; keeps all
    // setState inside the rAF callback (no synchronous setState-in-effect).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : 900;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}

// Circular readiness gauge (0–100), color-coded to the verdict band.
function Gauge({ value, band, lit }: { value: number; band: string; lit: boolean }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-well)" strokeWidth="11" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={band}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${lit ? dash : 0} ${c}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[2.5rem] font-semibold leading-none" style={{ color: band }}>
          {value}
        </span>
        <span className="tag mt-1 text-[10px]">/100</span>
      </div>
    </div>
  );
}

// One RPO or RTO gap: mono value pair, a MEETS/GAP/NO PATH pill, and a bar with
// a green fill to target and a red overrun to the (worse) achievable reality.
function GapRow({
  label,
  target,
  achievable,
  meets,
  dur,
  pill,
  lit,
}: {
  label: string;
  target: number;
  achievable: number | null;
  meets: boolean;
  dur: DurationLabels;
  pill: { meets: string; gap: string; noPath: string };
  lit: boolean;
}) {
  const noPath = achievable === null;
  const scale = noPath ? target : Math.max(target, achievable, 1);
  const greenW = noPath ? 0 : (Math.min(achievable, target) / scale) * 100;
  const redW = noPath ? 100 : achievable > target ? ((achievable - target) / scale) * 100 : 0;
  const tickPos = noPath ? -1 : (target / scale) * 100;

  const [pillText, pillCls] = meets
    ? [pill.meets, "chip-ok"]
    : noPath
      ? [pill.noPath, "chip-crit"]
      : [pill.gap, "chip-warn"];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
        <span className="tag">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">
            <span className={meets ? "text-ok" : "text-crit"}>{fmtMinutes(achievable, dur)}</span>
            <span className="text-faint"> / {fmtMinutes(target, dur)}</span>
          </span>
          <span className={`chip ${pillCls} font-mono !text-[10px]`}>{pillText}</span>
        </div>
      </div>
      <div className="relative">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-well">
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
            className="absolute -top-1 h-4 w-px bg-text/60"
            style={{ left: `${tickPos}%` }}
          />
        )}
      </div>
    </div>
  );
}

// The technical lens — today's four-part report (unchanged): score gauge,
// RPO/RTO recovery gaps, risk flags, and the live drill.
export function TechnicalLens({
  t,
  assessment,
  drill,
}: {
  t: Dictionary;
  assessment: Assessment;
  drill: ReactNode;
}) {
  const a = assessment;
  const n = a.results.length;
  const coverage = fmt(t.report.coverageShort, { n });
  const dur: DurationLabels = { unrecoverable: t.report.unrecoverable, ...t.report.units };

  const [lit, setLit] = useState(false);
  const [openCat, setOpenCat] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const count = useCountUp(a.score, lit);

  const tier = a.score >= 70 ? "good" : a.score >= 40 ? "fair" : "poor";
  const band = tier === "good" ? TONE.ok : tier === "fair" ? TONE.warn : TONE.crit;

  const checks = a.results.flatMap((r) => [r.rpoMeets, r.rtoMeets]);
  const met = checks.filter(Boolean).length;
  const total = checks.length;
  const hasNoPath = a.results.some((r) => r.achievableRpoMin === null || r.achievableRtoMin === null);
  const gapTone: Tone = met === total ? "ok" : met === 0 || hasNoPath ? "crit" : "warn";

  const invest = a.flags.length;
  const hasCritical = a.flags.some((f) => f.severity === "critical");
  const investTone: Tone = invest === 0 ? "ok" : hasCritical ? "crit" : "warn";
  const investVerdict =
    invest === 0
      ? t.report.investEmpty
      : `${invest} ${invest === 1 ? t.report.investOne : t.report.investLabel}`;

  const rule = [
    [a.rule321.threeCopies, t.report.rule321.threeCopies],
    [a.rule321.twoMedia, t.report.rule321.twoMedia],
    [a.rule321.oneOffsite, t.report.rule321.oneOffsite],
  ] as const;

  return (
    <div>
      {/* ── Part 1: Score gauge in a tinted hero band ── */}
      <section className="panel mt-4 overflow-hidden">
        <div className="hero-band border-b border-line px-5 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[16px] font-semibold tracking-tight">{t.report.scoreTitle}</h2>
            <span className="verdict shrink-0" style={{ background: band }}>
              {t.report.statusLabel[tier]}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-faint">{coverage}</p>
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
            <Gauge value={count} band={band} lit={lit} />
            <p className="max-w-sm text-center text-[13px] leading-relaxed text-muted sm:text-left">
              {fmt(t.report.coverage, { n })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 sm:px-6">
          <span className="text-[12px] font-medium text-muted">{t.report.rule321Title}</span>
          {rule.map(([pass, label]) => (
            <span key={label} className={pass ? "chip chip-ok" : "chip chip-neutral"}>
              {pass ? "✓" : "✕"} {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Part 2: Recovery gaps — cards, never a scroll table ── */}
      <Part
        title={t.report.gapsTitle}
        coverage={coverage}
        verdict={fmt(t.report.gapSummary, { met, total })}
        verdictTone={gapTone}
      >
        <div className="mt-4 grid gap-3">
          {a.results.map((r) => {
            const f = a.findings.workloads.find((w) => w.label === r.label)!;
            return (
              <div key={r.workload.id} className="rounded-xl border border-line bg-well/50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.workload.name}</span>
                  <span className="tag shrink-0">{fmt(t.report.tierTag, { n: r.workload.tier })}</span>
                </div>
                <div className="mt-3 space-y-3">
                  <GapRow
                    label={t.report.achievableRpo}
                    target={f.targetRpoMin}
                    achievable={r.achievableRpoMin}
                    meets={r.rpoMeets}
                    dur={dur}
                    pill={t.report.gapPill}
                    lit={lit}
                  />
                  <GapRow
                    label={t.report.achievableRto}
                    target={f.targetRtoMin}
                    achievable={r.achievableRtoMin}
                    meets={r.rtoMeets}
                    dur={dur}
                    pill={t.report.gapPill}
                    lit={lit}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Part>

      {/* ── Part 3: Where to invest — flag cards with a severity rail ── */}
      <Part
        title={t.report.investTitle}
        coverage={coverage}
        verdict={investVerdict}
        verdictTone={investTone}
      >
        {invest === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-ok-soft/60 p-4 text-[13px] text-ok">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            <span className="font-medium text-text">{t.report.investEmpty}</span>
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {groupByFunction(a.flags, (f) => f).map((g, gi) => {
              const open = openCat[g.category] ?? gi === 0;
              const crit = g.hasCritical;
              return (
                <div key={g.category} className="rounded-xl border border-line bg-panel">
                  <button
                    type="button"
                    onClick={() => setOpenCat((s) => ({ ...s, [g.category]: !open }))}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: crit ? TONE.crit : TONE.warn }}
                    />
                    <span className="flex-1 text-[13px] font-semibold text-text">
                      {t.report.csf.functions[g.category]}
                    </span>
                    <span className={`chip ${crit ? "chip-crit" : "chip-warn"}`}>{g.items.length}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className="grid gap-2 border-t border-line-soft px-3 pb-3 pt-2">
                      {g.items.map((f, i) => {
                        const copy = t.report.flags[f.code];
                        const critical = f.severity === "critical";
                        const railColor = critical ? TONE.crit : TONE.warn;
                        const Icon = critical ? AlertOctagon : AlertTriangle;
                        return (
                          <div
                            key={`${f.code}-${f.scope}-${i}`}
                            className="relative overflow-hidden rounded-lg border border-line bg-well/40"
                          >
                            <span
                              aria-hidden
                              className="absolute inset-y-0 left-0 w-1"
                              style={{ background: railColor }}
                            />
                            <div className="py-3 pl-4 pr-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0" style={{ color: railColor }} aria-hidden />
                                <span className={critical ? "chip chip-crit" : "chip chip-warn"}>
                                  {critical ? t.report.severity.critical : t.report.severity.warning}
                                </span>
                                <span className="text-[13px] font-semibold text-text">{copy.title}</span>
                              </div>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{copy.technical}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Part>

      {/* ── Security posture (CSF Detect/Respond), when assessed ── */}
      {(a.detect || a.respond) && (
        <div className="panel mt-4 p-5 sm:p-6">
          <div className="text-[13px] font-semibold">{t.report.csf.title}</div>
          <p className="mt-0.5 text-[12px] text-faint">{t.report.csf.subtitle}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["govern", a.govern?.score],
                ["identify", a.identify?.score],
                ["protect", a.protect?.score],
                ["detect", a.detect?.score],
                ["respond", a.respond?.score],
              ] as const
            ).map(([fn, sc]) =>
              sc == null ? null : (
                <div
                  key={fn}
                  className="rounded-xl border border-line bg-well/60 p-3 text-center"
                >
                  <div className="text-[11px] text-faint">{t.report.csf.functions[fn]}</div>
                  <div
                    className="mt-1 font-mono text-[1.5rem] font-semibold"
                    style={{ color: sc >= 70 ? TONE.ok : sc >= 40 ? TONE.warn : TONE.crit }}
                  >
                    {sc}
                  </div>
                  <div className="text-[10px] text-faint">/100</div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* ── Part 4: Live drill — accented so this headline feature stands out ── */}
      <section className="panel mt-4 overflow-hidden ring-2 ring-signal-soft">
        <div className="hero-band flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal text-white shadow-[0_6px_16px_-8px_rgba(75,86,214,0.8)]"
          >
            <Siren className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-tight">{t.drill.title}</h2>
            <p className="mt-0.5 text-[12px] text-faint">{coverage}</p>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6">{drill}</div>
      </section>
    </div>
  );
}
