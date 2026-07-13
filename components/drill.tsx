"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import {
  Lock,
  Flame,
  CloudOff,
  Trash2,
  Play,
  RotateCw,
  AlertTriangle,
  type LucideProps,
} from "lucide-react";
import type { Dictionary, Lang } from "@/lib/i18n";
import type { FindingsPayload } from "@/lib/engine";
import { formatMoney, type Currency } from "@/lib/exposure";
import {
  SCENARIOS,
  substituteLabels,
  validateNarrative,
  type Scenario,
} from "@/lib/narrative";

// Session budget for narrative generations (R19): one story per
// (scenario, language) is cached, and total draws are bounded. Module-level so
// it survives re-assessments within the page session.
const SESSION_BUDGET = 8;
let budgetUsed = 0;

type Status = "idle" | "generating" | "ready" | "unavailable" | "redacted" | "cap";

const SCENARIO_ICON: Record<Scenario, ComponentType<LucideProps>> = {
  ransomware: Lock,
  siteloss: Flame,
  outage: CloudOff,
  deletion: Trash2,
};

// Count a value up to target once `run` flips true — the exposure meter
// bleeding as the incident clock runs. Reduced-motion lands on the final
// figure immediately (no animation).
function useCountUp(target: number, run: boolean): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    // Reduced motion → dur 0 so the first rAF frame lands on target; keeps all
    // setState inside the callback (no synchronous setState-in-effect).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : 1500;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return v;
}

// The incident feed: beats reveal one by one down the timeline, the newest
// pulsing amber like a live event; the first beat is the t=0 diamond. Keyed by
// story in the caller so a regenerate restarts the sequence from the top.
// Reduced motion shows the full timeline immediately.
function Beats({
  beats,
  finale,
}: {
  beats: { time: string | null; text: string }[];
  // Deterministic closing beat, revealed after the last story beat — the
  // business loss in money. Computed browser-side; never part of the LLM text.
  finale?: ReactNode;
}) {
  const [revealed, setRevealed] = useState(0);
  // One extra reveal step for the finale, so it lands a beat after the story.
  const steps = beats.length + (finale ? 1 : 0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setRevealed(steps));
      return () => cancelAnimationFrame(raf);
    }
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= steps) {
          clearInterval(id);
          return r;
        }
        return r + 1;
      });
    }, 450);
    return () => clearInterval(id);
  }, [steps]);

  return (
    <ol>
      {beats.map((b, i) => {
        const shown = i < revealed;
        const live = shown && i === revealed - 1 && revealed < beats.length;
        return (
          <li
            key={i}
            className={`flex gap-3 transition-all duration-500 ${
              shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="flex flex-col items-center">
              {i === 0 ? (
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rotate-45 bg-event ring-4 ring-event-soft ${live ? "alert-blink" : ""}`}
                />
              ) : (
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    live ? "alert-blink bg-event ring-4 ring-event-soft" : "bg-signal ring-4 ring-signal-soft"
                  }`}
                />
              )}
              {(i < beats.length - 1 || !!finale) && (
                <span className="mt-1 w-px flex-1 bg-line" />
              )}
            </div>
            <div className="pb-4">
              {b.time && <span className="tag block leading-none">{b.time}</span>}
              <p className="mt-1 text-[13px] leading-relaxed text-text">{b.text}</p>
            </div>
          </li>
        );
      })}
      {finale && (
        <li
          className={`flex gap-3 transition-all duration-500 ${
            revealed >= steps ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="mt-1 h-3 w-3 shrink-0 rotate-45 bg-crit ring-4 ring-crit-soft" />
          </div>
          <div className="pb-1">{finale}</div>
        </li>
      )}
    </ol>
  );
}

// Split the validated story into timeline beats. A beat line looks like
// "02:14 — …"; the clock prefix becomes the timestamp, the rest the text.
function parseBeats(text: string): { time: string | null; text: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{1,2}[:.]\d{2})\s*[—\-–]\s*(.*)$/);
      return m ? { time: m[1], text: m[2] } : { time: null, text: line };
    });
}

export function Drill({
  t,
  lang,
  findings,
  labelMap,
  totalLossValue,
  currency,
  onEditCost,
}: {
  t: Dictionary;
  lang: Lang;
  findings: FindingsPayload;
  labelMap: Record<string, string>;
  // Browser-only exposure total in IDR (R13), from aggregateExposure(). Never
  // enters the payload or the LLM story — it just frames the stakes above the
  // timeline, and counts up as the meter scrolls into view. null = no cost given.
  totalLossValue: number | null;
  currency: Currency;
  /** Jump back to the intake's workload step to fill the downtime cost. */
  onEditCost: () => void;
}) {
  const [scenario, setScenario] = useState<Scenario>("ransomware");
  const [status, setStatus] = useState<Status>("idle");
  const [staleLang, setStaleLang] = useState(false);
  // cache: story per scenario+lang for THIS assessment (the component is
  // keyed per assessment in app/page.tsx, so a re-run resets all of this)
  const cache = useRef<Map<string, string>>(new Map());
  const [story, setStory] = useState<string | null>(null);
  const inFlight = useRef(false);
  // The (scenario, lang) the user currently wants. A generation that finishes
  // for a superseded key re-fires for this one instead of displaying.
  const wanted = useRef("");

  async function generate(sc: Scenario, lg: Lang) {
    const key = `${sc}:${lg}`;
    const cached = cache.current.get(key);
    if (cached) {
      setStory(cached);
      setStatus("ready");
      setStaleLang(false);
      return;
    }
    if (budgetUsed >= SESSION_BUDGET) {
      // Out of budget. Same scenario in the other language → keep showing it
      // with the language notice (R23). Otherwise the cap notice.
      const otherLang = cache.current.get(`${sc}:${lg === "id" ? "en" : "id"}`);
      if (otherLang) {
        setStory(otherLang);
        setStatus("ready");
        setStaleLang(true);
      } else {
        setStory(null);
        setStatus("cap");
      }
      return;
    }
    if (inFlight.current) return; // the finally-block re-fire covers this key
    inFlight.current = true;
    setStatus("generating");
    budgetUsed += 1;
    try {
      // regenerate once on validation failure, then redact (R20)
      for (let attempt = 0; attempt < 2; attempt++) {
        const resp = await fetch("/api/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ findings, scenario: sc, lang: lg }),
        });
        if (!resp.ok) throw new Error(String(resp.status));
        const data = (await resp.json()) as { narrative?: string };
        if (!data.narrative) throw new Error("empty");
        const check = validateNarrative(data.narrative, findings);
        if (check.ok) {
          cache.current.set(key, data.narrative);
          if (wanted.current === key) {
            setStory(data.narrative);
            setStatus("ready");
            setStaleLang(false);
          }
          track("narrative_generated"); // R24: anonymous count, no payload
          return;
        }
      }
      if (wanted.current === key) {
        setStory(null);
        setStatus("redacted");
      }
    } catch {
      budgetUsed -= 1; // refund — no story was produced by a provider
      if (wanted.current === key) {
        setStory(null);
        setStatus("unavailable");
      }
    } finally {
      inFlight.current = false;
      // If the user switched scenario/language mid-flight, serve them now.
      if (wanted.current !== key) {
        const [wsc, wlg] = wanted.current.split(":") as [Scenario, Lang];
        void generate(wsc, wlg);
      }
    }
  }

  // Language switch: show the cached story in the new language if we have one;
  // otherwise, if a story is on screen, mark it stale and let the user rerun
  // (R23). Manual generation means we never auto-spend budget on a switch.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const cached = cache.current.get(`${scenario}:${lang}`);
    if (cached) {
      setStory(cached);
      setStatus("ready");
      setStaleLang(false);
    } else if (story) {
      setStaleLang(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const selectScenario = (sc: Scenario) => {
    setScenario(sc);
    track("scenario_swapped"); // R24: anonymous count
    const cached = cache.current.get(`${sc}:${lang}`);
    if (cached) {
      setStory(cached);
      setStatus("ready");
      setStaleLang(false);
    } else {
      setStory(null);
      setStatus("idle");
      setStaleLang(false);
    }
  };

  const run = () => {
    wanted.current = `${scenario}:${lang}`;
    void generate(scenario, lang);
  };

  const generating = status === "generating";
  const beats = story ? parseBeats(substituteLabels(story, labelMap)) : [];

  // Run the exposure meter when it scrolls into view (once).
  const lossRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const el = lossRef.current;
    if (!el || totalLossValue == null) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLit(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [totalLossValue]);
  const shownLoss = useCountUp(totalLossValue ?? 0, lit);

  return (
    <div className="mt-3">
      <div className="text-[13px] text-muted">{t.drill.pickScenario}</div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {SCENARIOS.map((sc) => {
          const Icon = SCENARIO_ICON[sc];
          const active = scenario === sc;
          return (
            <button
              key={sc}
              disabled={generating}
              onClick={() => selectScenario(sc)}
              aria-pressed={active}
              className={`keycap flex min-h-[44px] max-w-full items-center gap-1.5 rounded-lg border bg-panel px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-signal bg-signal-soft font-semibold text-signal-ink"
                  : "border-line text-muted hover:border-faint hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {t.drill.scenarios[sc]}
            </button>
          );
        })}
      </div>

      {/* ── Drill readout ── */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-well/40">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <span className="font-mono text-[11px] text-faint">drill://{scenario}</span>
          {status === "ready" && !generating && (
            <button
              onClick={run}
              className="btn-ghost h-8 gap-1.5 px-2 text-[12px] font-medium text-signal"
            >
              <RotateCw className="h-3.5 w-3.5" />
              {t.drill.regenerate}
            </button>
          )}
        </div>

        {/* Stakes: deterministic browser-only loss total, stays intact even if
            the story degrades — the numbers here never come from the LLM. The
            figure counts up as it scrolls in: the money bleeding as it unfolds. */}
        {totalLossValue != null ? (
          <div
            ref={lossRef}
            className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-b border-line bg-crit-soft/40 px-4 py-2.5"
          >
            <span className="tag text-[10px]">{t.drill.totalLoss}</span>
            <span className="font-mono text-[15px] font-semibold tabular-nums text-crit">
              {formatMoney(Math.round(shownLoss), currency)}
              <span aria-hidden className="ml-1 text-[12px]">
                ▲
              </span>
            </span>
          </div>
        ) : (
          // No downtime cost given → a working way to fix that, not a notice.
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-b border-line bg-well/60 px-4 py-2.5">
            <span className="tag text-[10px]">{t.drill.totalLoss}</span>
            <button
              type="button"
              onClick={onEditCost}
              className="text-left text-[12px] font-medium text-signal underline decoration-signal/40 underline-offset-2 hover:decoration-signal"
            >
              {t.report.business.addCost}
            </button>
          </div>
        )}

        <div className="min-h-[9rem] p-4">
          {/* Idle — prompt + run CTA */}
          {status === "idle" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="max-w-sm text-[13px] leading-relaxed text-muted">{t.drill.idlePrompt}</p>
              <button onClick={run} className="btn-primary px-5 text-sm">
                <Play className="h-4 w-4" />
                {t.drill.generate}
              </button>
            </div>
          )}

          {/* Generating — pulsing timeline skeleton */}
          {generating && (
            <div>
              <p className="mb-4 text-[13px] text-muted motion-safe:animate-pulse">
                {t.drill.generating}
              </p>
              <div className="space-y-3 motion-safe:animate-pulse">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-line" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-14 rounded bg-line" />
                      <div className="h-2.5 w-full rounded bg-line" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Degraded states — parts 1–3 above stay fully intact */}
          {!generating && (status === "unavailable" || status === "redacted" || status === "cap") && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertTriangle className="h-6 w-6 text-faint" strokeWidth={1.75} aria-hidden />
              <p className="max-w-sm text-[13px] leading-relaxed text-muted">
                {status === "unavailable"
                  ? t.drill.unavailable
                  : status === "redacted"
                    ? t.drill.redacted
                    : t.drill.capReached}
              </p>
              {status !== "cap" && budgetUsed < SESSION_BUDGET && (
                <button onClick={run} className="btn-ghost h-9 gap-1.5 px-3 text-[13px] text-signal">
                  <RotateCw className="h-4 w-4" />
                  {t.drill.regenerate}
                </button>
              )}
            </div>
          )}

          {/* Ready — the incident timeline */}
          {!generating && status === "ready" && story && (
            <>
              {staleLang && (
                <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-[12px] text-warn">
                  {t.drill.languageNotice}
                </p>
              )}
              <Beats
                key={story}
                beats={beats}
                // The punchline: the drill ends on the BUSINESS loss in money,
                // not just the technical closing state. Deterministic figure
                // (aggregateExposure), never from the LLM.
                finale={
                  <div>
                    <span className="tag block leading-none !text-crit">{t.drill.totalLoss}</span>
                    {totalLossValue != null ? (
                      <p className="mt-1 font-mono text-[19px] font-bold tabular-nums text-crit">
                        {formatMoney(totalLossValue, currency)}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={onEditCost}
                        className="mt-1 text-left text-[13px] font-medium leading-relaxed text-signal underline decoration-signal/40 underline-offset-2 hover:decoration-signal"
                      >
                        {t.report.business.addCost}
                      </button>
                    )}
                  </div>
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
