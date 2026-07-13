"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import { ShieldCheck, ArrowLeft, Download } from "lucide-react";
import { assess, type Assessment, type Environment } from "@/lib/engine";
import { aggregateExposure, catastrophicDailyLoss } from "@/lib/exposure";
import { dictionaries, type Lang } from "@/lib/i18n";
import { Intake, downloadConfig, emptyProtection, emptyWorkload } from "@/components/intake";
import { Logo } from "@/components/logo";

// The report half (lenses, charts, drill) renders only after the intake is
// done — keep it out of the first-load bundle so the landing paint is light.
const Report = dynamic(() => import("@/components/report").then((m) => m.Report));
const Drill = dynamic(() => import("@/components/drill").then((m) => m.Drill));

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

  // Warm the report/drill chunks on the first interaction — off the landing
  // critical path, but downloaded long before the intake is finished.
  useEffect(() => {
    const warm = () => {
      import("@/components/report");
      import("@/components/drill");
    };
    window.addEventListener("pointerdown", warm, { once: true });
    window.addEventListener("keydown", warm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, []);

  return (
    <>
      {/* ── Title block: a light cream header on a firm blueprint grid; its
             bottom edge is the timeline axis (the logo's axis, page-wide). The
             privacy line sits on the paper just below. ── */}
      <header className="sticky top-0 z-20">
        <div className="titleblock">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Logo className="h-7 w-7 shrink-0 text-signal" />
              <div className="min-w-0 leading-tight">
                <div className="font-display text-[15px] font-bold tracking-tight text-text">
                  {t.appName}
                </div>
                <div className="tag hidden truncate text-[10px] sm:block">
                  {t.masthead}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-[3px] border border-line font-mono text-xs font-semibold">
              {(["id", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`flex h-9 min-w-[44px] items-center justify-center px-3 transition-colors ${
                    lang === l
                      ? "bg-key text-white"
                      : "text-muted hover:bg-well hover:text-text"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="masthead-axis" aria-hidden />
        </div>
      </header>

      {/* Privacy promise — on the paper, keeping the dark band a thin strip. */}
      <div className="border-b border-line-soft bg-well/50">
        <div className="mx-auto flex max-w-3xl items-start gap-1.5 px-5 py-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-event" strokeWidth={2.2} aria-hidden />
          <span>{t.trustIndicator}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl grow px-5 pb-28 pt-4 sm:pt-5">
        {assessment ? (
          /* ── Results screen: the intake is replaced, not appended ── */
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setAssessment(null)}
                className="btn-ghost -ml-2 px-2 text-[13px] font-semibold text-key-ink"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t.report.newAssessment}
              </button>
              {/* Save belongs here — the config has just proven worth keeping;
                  the load link on the intake's first step reads it back. */}
              <button
                onClick={() => downloadConfig(env)}
                className="btn-ghost -mr-2 px-2 text-[13px] font-semibold text-key-ink"
              >
                <Download className="h-4 w-4" aria-hidden />
                {t.intake.saveConfig}
              </button>
            </div>
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
                  ongoingDailyLoss={catastrophicDailyLoss(assessment.results)}
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
            <h1 className="max-w-[20ch] text-[1.5rem] font-semibold leading-[1.12] tracking-[-0.02em] text-balance sm:text-[2.05rem]">
              {t.tagline}
            </h1>

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

      {/* Footer — a closing title block on paper, ruled off by the amber axis. */}
      <footer className="mt-auto border-t-2 border-event">
        <div className="titleblock">
          <div className="mx-auto max-w-3xl px-5 py-6 font-mono text-[11px] text-muted">
            {t.footer.attribution}{" "}
            <a
              className="text-key-ink underline decoration-key-ink/40 underline-offset-2 hover:decoration-key-ink"
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
