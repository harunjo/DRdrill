"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import { LineChart, Layers, Wallet, type LucideProps } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Assessment } from "@/lib/engine";
import { TechnicalLens } from "@/components/lenses/technical-lens";
import { BusinessLens } from "@/components/lenses/business-lens";
import { InvestmentLens } from "@/components/lenses/investment-lens";
import { PostureRadar } from "@/components/posture-radar";
import type { PostureScores } from "@/lib/posture";

type Lens = "business" | "technical" | "investment";

const LENSES: { key: Lens; icon: ComponentType<LucideProps> }[] = [
  { key: "business", icon: LineChart },
  { key: "technical", icon: Layers },
  { key: "investment", icon: Wallet },
];

// One assessment, three audience lenses (R3). Business impact opens by default;
// switching re-renders from the same findings and never re-runs the assessment.
export function Report({
  t,
  assessment,
  drill,
}: {
  t: Dictionary;
  assessment: Assessment;
  drill: ReactNode;
}) {
  const [lens, setLens] = useState<Lens>("business");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (key: Lens) => {
    setLens(key);
    track("lens_viewed"); // R24: anonymous count, event name only — no payload
  };

  // Roving tablist: arrow keys move focus and selection together.
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + LENSES.length) % LENSES.length;
    select(LENSES[next].key);
    tabs.current[next]?.focus();
  };

  // CSF posture across the six functions. Recover = the DR readiness score;
  // Detect/Respond come from the security step; the rest are not yet assessed.
  const postureScores: PostureScores = {
    govern: null,
    identify: null,
    protect: null,
    detect: assessment.detect?.score ?? null,
    respond: assessment.respond?.score ?? null,
    recover: assessment.score,
  };

  return (
    <div className="mt-4">
      <PostureRadar t={t} scores={postureScores} />
      <div
        role="tablist"
        aria-label={t.report.lensesLabel}
        className="mt-4 flex gap-1 rounded-xl border border-line bg-panel p-1 shadow-sm"
      >
        {LENSES.map(({ key, icon: Icon }, i) => {
          const active = lens === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => select(key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border-b-2 px-2 text-[12px] transition-colors sm:text-[13px] ${
                active
                  ? "border-signal bg-signal-soft font-semibold text-signal-ink"
                  : "border-transparent text-faint hover:text-muted"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {t.report.lenses[key]}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {lens === "business" && <BusinessLens t={t} assessment={assessment} />}
        {lens === "technical" && <TechnicalLens t={t} assessment={assessment} drill={drill} />}
        {lens === "investment" && <InvestmentLens t={t} assessment={assessment} />}
      </div>
    </div>
  );
}
