"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { assess, type Assessment, type Environment } from "@/lib/engine";
import { aggregateExposure, formatMoney } from "@/lib/exposure";
import { dictionaries, type Lang } from "@/lib/i18n";
import { Intake, emptyProtection, emptyWorkload } from "@/components/intake";
import { Report } from "@/components/report";
import { Drill } from "@/components/drill";

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
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-[#5b64df] to-[#4b56d6] text-white shadow-[0_6px_16px_-8px_rgba(75,86,214,0.8)]"
              >
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <div className="leading-tight">
                <div className="text-[15px] font-semibold tracking-tight">{t.appName}</div>
                <div className="tag text-[10px]">{t.masthead}</div>
              </div>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-line bg-panel text-xs font-semibold shadow-sm">
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
                  totalLoss={(() => {
                    const agg = aggregateExposure(assessment.results);
                    return agg.monetizedCount > 0 ? formatMoney(agg.total, t.currency) : null;
                  })()}
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
