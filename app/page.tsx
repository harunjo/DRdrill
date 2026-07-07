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
    <main className="mx-auto w-full max-w-3xl grow px-5 py-10 sm:py-14">
      {/* Console header bar */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="relative flex h-2.5 w-2.5"
            title="online"
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-signal/50 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
          </span>
          <div className="leading-none">
            <div className="font-display text-xl font-bold tracking-tight">{t.appName}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              business-continuity readout
            </div>
          </div>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-line font-mono text-xs">
          {(["id", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-3 py-1.5 transition-colors ${
                lang === l
                  ? "bg-signal/15 font-semibold text-signal"
                  : "text-muted hover:text-text"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Thesis */}
      <h1 className="mt-10 max-w-2xl font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-[2.6rem]">
        {t.tagline}
      </h1>

      {/* Trust chip — runs local */}
      <p className="mt-6 flex items-start gap-3 rounded-xl border border-signal/25 bg-signal/[0.06] p-4 text-sm text-muted">
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
      </p>

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

      <footer className="mt-20 border-t border-line-soft pt-5 font-mono text-[11px] text-faint">
        {t.footer.attribution}{" "}
        <a className="text-muted underline decoration-line hover:text-signal" href="https://harunjonatan.com">
          harunjonatan.com
        </a>
      </footer>
    </main>
  );
}
