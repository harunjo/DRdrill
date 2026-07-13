"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { assess, type Assessment, type Environment } from "@/lib/engine";
import { aggregateExposure } from "@/lib/exposure";
import { dictionaries, type Lang } from "@/lib/i18n";
import { Intake, emptyProtection, emptyWorkload } from "@/components/intake";
import { Report } from "@/components/report";
import { Drill } from "@/components/drill";
import { Logo } from "@/components/logo";

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
  // Which step the intake opens on. "Klik di sini" from the report jumps
  // straight back to Workloads (step 1) to fill the downtime cost.
  const [intakeStep, setIntakeStep] = useState(0);
  const editCost = () => {
    setIntakeStep(1);
    setAssessment(null);
  };

  const t = dictionaries[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      {/* ── Command masthead: dark ink band on a firm blueprint grid; its
             bottom edge is the timeline axis (the logo's axis, page-wide). ── */}
      <header className="sticky top-0 z-20">
        <div className="masthead text-[#e7eaee]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Logo className="h-8 w-8 shrink-0 text-[#e7eaee]" />
              <div className="min-w-0 leading-tight">
                <div className="font-display text-[15px] font-bold tracking-tight">
                  {t.appName}
                </div>
                <div className="tag hidden truncate !text-[#8890a0] text-[10px] sm:block">
                  {t.masthead}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-[3px] border border-white/25 font-mono text-xs font-semibold">
              {(["id", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`flex h-11 min-w-[44px] items-center justify-center px-3 transition-colors ${
                    lang === l ? "bg-[#e7eaee] text-text" : "text-white/55 hover:text-white"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {/* Trust indicator — privacy is a core promise, inside the band */}
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-5 py-1.5 text-[11px] font-medium text-white/70">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-event" strokeWidth={2.2} aria-hidden />
              <span>{t.trustIndicator}</span>
            </div>
          </div>
          <div className="masthead-axis" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl grow px-5 pb-28 pt-4 sm:pt-5">
        {assessment ? (
          /* ── Results screen: the intake is replaced, not appended ── */
          <div>
            <button
              onClick={() => {
                setIntakeStep(0);
                setAssessment(null);
              }}
              className="btn-ghost -ml-2 mb-2 px-2 text-[13px] font-semibold text-signal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.report.newAssessment}
            </button>
            <Report
              t={t}
              assessment={assessment}
              onEditCost={editCost}
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
                  onEditCost={editCost}
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
              initialStep={intakeStep}
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

      <footer className="mt-auto">
        <div className="masthead">
          <div className="mx-auto max-w-3xl px-5 py-6 font-mono text-[11px] text-white/55">
            {t.footer.attribution}{" "}
            <a
              className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
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
