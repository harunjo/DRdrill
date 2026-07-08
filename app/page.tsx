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
      {/* Letterhead masthead */}
      <header className="border-b-[3px] border-double border-text pb-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-semibold tracking-[0.02em]">
              {t.appName}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">
              {t.masthead}
            </div>
          </div>
          <div className="flex overflow-hidden rounded-[3px] border border-line text-xs font-medium">
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

      {/* Thesis */}
      <h1 className="mt-11 max-w-[24ch] font-display text-[2rem] font-medium leading-[1.18] tracking-[-0.01em] text-balance sm:text-[2.6rem]">
        {t.tagline}
      </h1>

      {/* Trust note — runs local */}
      <div className="mt-6 flex max-w-2xl items-start gap-3 border-l-2 border-text bg-well px-4 py-3 text-[13px] leading-relaxed text-muted">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="mt-0.5 h-4 w-4 shrink-0 text-text"
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
          className="text-muted underline decoration-line underline-offset-2 hover:text-text"
          href="https://harunjonatan.com"
        >
          harunjonatan.com
        </a>
      </footer>
    </main>
  );
}
