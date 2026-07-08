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
    <>
      {/* App bar */}
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-6 w-6 items-center justify-center rounded-md bg-signal text-[11px] font-semibold text-white"
            >
              DR
            </span>
            <span className="text-[15px] font-semibold tracking-tight">{t.appName}</span>
          </div>

          <div className="flex overflow-hidden rounded-md border border-line text-xs font-medium">
            {(["id", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`px-3 py-1.5 transition-colors ${
                  lang === l ? "bg-well text-text" : "text-faint hover:text-muted"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl grow px-5 pb-14 pt-12 sm:pt-16">
        {/* Thesis */}
        <h1 className="max-w-[28ch] text-[1.7rem] font-semibold leading-[1.22] tracking-[-0.02em] text-balance sm:text-[2.05rem]">
          {t.tagline}
        </h1>

        {/* Trust callout — runs local */}
        <div className="mt-6 flex max-w-2xl items-start gap-3 rounded-lg border border-[#cde4e1] bg-signal-soft px-4 py-3.5 text-[13px] leading-relaxed text-[#2a4d48]">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="mt-0.5 h-4 w-4 shrink-0 text-signal"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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

      {assessment && (
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
      )}

        <footer className="mt-20 border-t border-line pt-5 text-[12px] text-faint">
          {t.footer.attribution}{" "}
          <a
            className="text-muted underline decoration-line underline-offset-2 hover:text-signal"
            href="https://harunjonatan.com"
          >
            harunjonatan.com
          </a>
        </footer>
      </main>
    </>
  );
}
