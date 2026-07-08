"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { assess, type Assessment, type Environment } from "@/lib/engine";
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
    <main className="mx-auto w-full max-w-3xl grow px-5 pb-16 pt-8 sm:pt-12">
      {/* App bar */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-[13px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]"
          >
            DR
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">{t.appName}</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              {t.masthead}
            </div>
          </div>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-line bg-panel text-xs font-semibold shadow-sm">
          {(["id", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-3 py-1.5 transition-colors ${
                lang === l ? "bg-signal text-white" : "text-faint hover:text-muted"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {assessment ? (
        /* ── Results screen: the intake is replaced, not appended ── */
        <div>
          <button
            onClick={() => setAssessment(null)}
            className="mt-8 inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-semibold text-signal shadow-sm transition-colors hover:bg-signal-soft"
          >
            ← {t.report.newAssessment}
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
              />
            }
          />
        </div>
      ) : (
        /* ── Intake screen: thesis + wizard ── */
        <>
          {/* Thesis */}
          <h1 className="mt-11 max-w-[24ch] font-display text-[2rem] font-medium leading-[1.18] tracking-[-0.01em] text-balance sm:text-[2.6rem]">
            {t.tagline}
          </h1>

          {/* Trust note — runs local */}
          <div className="mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-signal-soft bg-signal-soft/60 px-4 py-3.5 text-[13px] leading-relaxed text-[#2b4a86]">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="mt-0.5 h-4 w-4 shrink-0 text-signal"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>{t.privacyLine}</span>
          </div>

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

      <footer className="mt-20 border-t border-line pt-5 text-[12px] text-faint">
        {t.footer.attribution}{" "}
        <a
          className="text-muted underline decoration-line underline-offset-2 hover:text-text"
          href="https://harunjonatan.com"
        >
          harunjonatan.com
        </a>
      </footer>
    </main>
  );
}
