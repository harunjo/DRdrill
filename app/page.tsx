"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { assess, fmtMinutes, type Assessment, type Environment } from "@/lib/engine";
import { aggregateExposure } from "@/lib/exposure";
import { dictionaries, type Lang } from "@/lib/i18n";
import { Intake, emptyProtection, emptyWorkload } from "@/components/intake";
import { Report } from "@/components/report";
import { Drill } from "@/components/drill";
import { IncidentTimeline } from "@/components/incident-timeline";

export default function Home() {
  const [lang, setLang] = useState<Lang>("id");
  const [env, setEnv] = useState<Environment>({
    model: "onprem",
    workloads: [emptyWorkload()],
    protection: { onprem: { ...emptyProtection }, cloud: { ...emptyProtection } },
  });
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  // Increments per run — keys the Drill so its story cache/state never
  // survives a re-assessment (a story must match the findings on screen).
  const [runId, setRunId] = useState(0);

  const t = dictionaries[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      {/* ── App header: white, textured, persistent trust strip ── */}
      <header className="sticky top-0 z-20 border-b border-line bg-panel/85 backdrop-blur-md">
        <div className="grid-texture">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Incident Timeline mark — the amber t=0 event line inside a
                  datasheet box; ties the wordmark to the signature visual. */}
              <span
                aria-hidden
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-text bg-panel"
              >
                <span className="absolute inset-y-[6px] left-1/2 w-[2px] -translate-x-1/2 bg-event" />
                <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-event" />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="text-[15px] font-semibold tracking-tight">{t.appName}</div>
                <div className="tag hidden truncate text-[10px] sm:block">{t.masthead}</div>
              </div>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-line bg-panel text-xs font-semibold shadow-sm">
              {(["id", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`flex h-11 min-w-[44px] items-center justify-center px-3 transition-colors ${
                    lang === l ? "bg-signal text-white" : "text-faint hover:text-muted"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Trust indicator — privacy is a core promise, surfaced persistently */}
        <div className="border-t border-line-soft bg-signal-soft/50">
          <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-5 py-1.5 text-[11px] font-medium text-signal-ink">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            <span>{t.trustIndicator}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl grow px-5 pb-28 pt-6 sm:pt-10">
        {assessment ? (
          /* ── Results screen: the intake is replaced, not appended ── */
          <div>
            <button
              onClick={() => setAssessment(null)}
              className="btn-ghost -ml-2 mb-2 px-2 text-[13px] font-semibold text-signal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.report.newAssessment}
            </button>
            <Report
              t={t}
              assessment={assessment}
              drill={
                <Drill
                  key={runId}
                  t={t}
                  lang={lang}
                  findings={assessment.findings}
                  labelMap={assessment.labelMap}
                  totalLossValue={(() => {
                    const agg = aggregateExposure(assessment.results);
                    return agg.monetizedCount > 0 ? agg.total : null;
                  })()}
                  currency={t.currency}
                />
              }
            />
          </div>
        ) : (
          /* ── Intake screen: thesis + wizard ── */
          <>
            {/* Thesis — the persistent trust banner above already carries the
                privacy promise, so the hero doesn't repeat it. */}
            <h1 className="mt-6 max-w-[22ch] text-[1.95rem] font-semibold leading-[1.16] tracking-[-0.02em] text-balance sm:text-[2.5rem]">
              {t.tagline}
            </h1>

            {/* Signature thesis — the Incident Timeline, shown as a labelled
                sample so the visitor sees the payoff before filling anything.
                Illustrative values only; the real one is computed in the report. */}
            <section className="panel mt-7 px-5 py-5 sm:px-6">
              <div className="mb-3">
                <span className="tag text-[10px] text-event">{t.heroExampleTag}</span>
              </div>
              <IncidentTimeline
                rpoAchievableMin={1440}
                rpoTargetMin={240}
                rtoAchievableMin={1800}
                rtoTargetMin={480}
                fmtDur={(m) =>
                  fmtMinutes(m, { unrecoverable: t.report.unrecoverable, ...t.report.units })
                }
                labels={t.report.timeline}
              />
            </section>

            <Intake
              t={t}
              env={env}
              onChange={setEnv}
              onRun={() => {
                setAssessment(assess(env));
                setRunId((r) => r + 1);
                // R24: anonymous event counts only — no environment data attached.
                track("assessment_completed");
              }}
            />
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-line bg-panel">
        <div className="grid-texture">
          <div className="mx-auto max-w-3xl px-5 py-6 text-[12px] text-faint">
            {t.footer.attribution}{" "}
            <a
              className="text-muted underline decoration-line underline-offset-2 hover:text-text"
              href="https://harunjonatan.com"
            >
              harunjonatan.com
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
