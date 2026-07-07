"use client";

import { useState } from "react";
import { assess, type Assessment, type Environment } from "@/lib/engine";
import { dictionaries, type Lang } from "@/lib/i18n";
import { Intake, emptyProtection, emptyWorkload } from "@/components/intake";
import { Report } from "@/components/report";

export default function Home() {
  const [lang, setLang] = useState<Lang>("id");
  const [env, setEnv] = useState<Environment>({
    model: "onprem",
    workloads: [emptyWorkload()],
    protection: { onprem: { ...emptyProtection }, cloud: { ...emptyProtection } },
  });
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const t = dictionaries[lang];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-sans">
      <header className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.appName}</h1>
        <div className="flex gap-1 text-xs">
          {(["id", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded border px-2 py-1 ${
                lang === l
                  ? "border-blue-600 bg-blue-50 font-medium text-blue-900"
                  : "border-neutral-300 text-neutral-500 hover:border-blue-400"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <p className="mt-2 text-neutral-500">{t.tagline}</p>
      <p className="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        {t.privacyLine}
      </p>

      <Intake t={t} env={env} onChange={setEnv} onRun={() => setAssessment(assess(env))} />

      {assessment && (
        <Report
          t={t}
          assessment={assessment}
          drill={<p className="mt-2 text-sm text-neutral-500">{t.drill.unavailable}</p>}
        />
      )}

      <footer className="mt-16 border-t pt-4 text-xs text-neutral-400">
        {t.footer.attribution}{" "}
        <a className="underline" href="https://harunjonatan.com">
          harunjonatan.com
        </a>
      </footer>
    </main>
  );
}
