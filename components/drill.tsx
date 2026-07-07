"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary, Lang } from "@/lib/i18n";
import type { FindingsPayload } from "@/lib/engine";
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

type Status = "idle" | "generating" | "unavailable" | "redacted" | "cap";

export function Drill({
  t,
  lang,
  findings,
  labelMap,
}: {
  t: Dictionary;
  lang: Lang;
  findings: FindingsPayload;
  labelMap: Record<string, string>;
}) {
  const [scenario, setScenario] = useState<Scenario>("ransomware");
  const [status, setStatus] = useState<Status>("idle");
  const [staleLang, setStaleLang] = useState(false);
  // cache: story per scenario+lang for THIS assessment
  const cache = useRef<Map<string, string>>(new Map());
  const [story, setStory] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function generate(sc: Scenario, lg: Lang) {
    const key = `${sc}:${lg}`;
    const cached = cache.current.get(key);
    if (cached) {
      setStory(cached);
      setStatus("idle");
      setStaleLang(false);
      return;
    }
    if (budgetUsed >= SESSION_BUDGET) {
      // Out of budget: keep whatever story is shown; if it's another
      // language, mark it stale (R23), or show the cap notice when empty.
      if (story) setStaleLang(true);
      else setStatus("cap");
      return;
    }
    if (inFlight.current) return;
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
          setStory(data.narrative);
          setStatus("idle");
          setStaleLang(false);
          return;
        }
      }
      setStory(null);
      setStatus("redacted");
    } catch {
      setStory(null);
      setStatus("unavailable");
    } finally {
      inFlight.current = false;
    }
  }

  // First load: generate the default scenario automatically (F1 — the report
  // renders instantly, the story arrives after). Language switch re-fires and
  // regenerates within budget (R23).
  useEffect(() => {
    void generate(scenario, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, lang]);

  const generating = status === "generating";

  return (
    <div className="mt-2">
      <div className="text-sm text-neutral-500">{t.drill.pickScenario}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {SCENARIOS.map((sc) => (
          <button
            key={sc}
            disabled={generating}
            onClick={() => setScenario(sc)}
            className={`rounded border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              scenario === sc
                ? "border-blue-600 bg-blue-50 font-medium text-blue-900"
                : "border-neutral-300 hover:border-blue-400"
            }`}
          >
            {t.drill.scenarios[sc]}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[6rem] text-sm leading-relaxed">
        {generating && (
          <p className="animate-pulse text-neutral-500">{t.drill.generating}</p>
        )}
        {!generating && status === "unavailable" && (
          <p className="rounded border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
            {t.drill.unavailable}
          </p>
        )}
        {!generating && status === "redacted" && (
          <p className="rounded border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
            {t.drill.redacted}
          </p>
        )}
        {!generating && status === "cap" && (
          <p className="rounded border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
            {t.drill.capReached}
          </p>
        )}
        {!generating && story && status === "idle" && (
          <>
            {staleLang && (
              <p className="mb-2 text-xs text-amber-600">{t.drill.languageNotice}</p>
            )}
            <div className="whitespace-pre-line rounded border border-neutral-200 bg-neutral-50 p-3 font-mono text-[13px]">
              {substituteLabels(story, labelMap)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
