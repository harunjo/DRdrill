"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
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
  // cache: story per scenario+lang for THIS assessment (the component is
  // keyed per assessment in app/page.tsx, so a re-run resets all of this)
  const cache = useRef<Map<string, string>>(new Map());
  const [story, setStory] = useState<string | null>(null);
  const inFlight = useRef(false);
  // The (scenario, lang) the user currently wants. A generation that finishes
  // for a superseded key re-fires for this one instead of displaying.
  const wanted = useRef("");

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
      // Out of budget. Same scenario in the other language → keep showing it
      // with the language notice (R23). Otherwise the cap notice.
      const otherLang = cache.current.get(`${sc}:${lg === "id" ? "en" : "id"}`);
      if (otherLang) {
        setStory(otherLang);
        setStatus("idle");
        setStaleLang(true);
      } else {
        setStory(null);
        setStatus("cap");
      }
      return;
    }
    if (inFlight.current) return; // the finally-block re-fire covers this key
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
          if (wanted.current === key) {
            setStory(data.narrative);
            setStatus("idle");
            setStaleLang(false);
          }
          track("narrative_generated"); // R24: anonymous count, no payload
          return;
        }
      }
      if (wanted.current === key) {
        setStory(null);
        setStatus("redacted");
      }
    } catch {
      budgetUsed -= 1; // refund — no story was produced by a provider
      if (wanted.current === key) {
        setStory(null);
        setStatus("unavailable");
      }
    } finally {
      inFlight.current = false;
      // If the user switched scenario/language mid-flight, serve them now.
      if (wanted.current !== key) {
        const [wsc, wlg] = wanted.current.split(":") as [Scenario, Lang];
        void generate(wsc, wlg);
      }
    }
  }

  // First load: generate the default scenario automatically (F1 — the report
  // renders instantly, the story arrives after). Language switch re-fires and
  // regenerates within budget (R23).
  useEffect(() => {
    wanted.current = `${scenario}:${lang}`;
    void generate(scenario, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, lang]);

  const generating = status === "generating";

  return (
    <div className="mt-3">
      <div className="text-[13px] text-muted">{t.drill.pickScenario}</div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {SCENARIOS.map((sc) => (
          <button
            key={sc}
            disabled={generating}
            onClick={() => {
              setScenario(sc);
              track("scenario_swapped"); // R24: anonymous count
            }}
            className={`rounded-[3px] border px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              scenario === sc
                ? "border-text bg-signal-soft font-medium text-text"
                : "border-line text-muted hover:border-faint hover:text-text"
            }`}
          >
            {t.drill.scenarios[sc]}
          </button>
        ))}
      </div>

      {/* Drill readout — reads like a quoted incident appendix */}
      <div className="mt-4 overflow-hidden rounded-[3px] border border-line bg-well">
        <div className="border-b border-line px-4 py-2 font-mono text-[11px] text-faint">
          drill://{scenario}
        </div>
        <div className="min-h-[7rem] border-l-2 border-l-text p-4 font-mono text-[13px] leading-relaxed">
          {generating && (
            <p className="text-muted motion-safe:animate-pulse">{t.drill.generating}</p>
          )}
          {!generating && status === "unavailable" && (
            <p className="text-muted">{t.drill.unavailable}</p>
          )}
          {!generating && status === "redacted" && (
            <p className="text-muted">{t.drill.redacted}</p>
          )}
          {!generating && status === "cap" && <p className="text-muted">{t.drill.capReached}</p>}
          {!generating && story && status === "idle" && (
            <>
              {staleLang && (
                <p className="mb-2 text-warn">{t.drill.languageNotice}</p>
              )}
              <div className="whitespace-pre-line text-text">
                {substituteLabels(story, labelMap)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
