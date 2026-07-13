"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import { LineChart, Layers, Wallet, Siren, type LucideProps } from "lucide-react";
import { fmt, type Dictionary } from "@/lib/i18n";
import type { Assessment } from "@/lib/engine";
import { TechnicalLens } from "@/components/lenses/technical-lens";
import { BusinessLens } from "@/components/lenses/business-lens";
import { InvestmentLens } from "@/components/lenses/investment-lens";
import { PostureRadar } from "@/components/posture-radar";
import type { PostureScores } from "@/lib/posture";
import type { Branding } from "@/lib/pdf";

type Lens = "business" | "drill" | "technical" | "investment";

// The drill sits second — the headline feature gets its own surface instead
// of hiding at the bottom of the technical lens.
const LENSES: { key: Lens; icon: ComponentType<LucideProps> }[] = [
  { key: "business", icon: LineChart },
  { key: "drill", icon: Siren },
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
  // Optional report branding — browser-only, never enters FindingsPayload (R12).
  const [branding, setBranding] = useState<Branding>({ name: "", logo: null });

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
    govern: assessment.govern?.score ?? null,
    identify: assessment.identify?.score ?? null,
    protect: assessment.protect?.score ?? null,
    detect: assessment.detect?.score ?? null,
    respond: assessment.respond?.score ?? null,
    recover: assessment.score,
  };

  return (
    <div className="mt-4">
      <PostureRadar t={t} scores={postureScores} />
      <p className="mt-5 text-[12px] font-medium text-muted">{t.report.lensesHint}</p>
      <div
        role="tablist"
        aria-label={t.report.lensesLabel}
        // 2×2 on phones — four labels in one 390px row clips the longest
        // ("Usulan investasi"); a single row returns at sm.
        className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border-2 border-signal-soft bg-panel p-1 shadow-md sm:flex"
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
              className={`keycap flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border-b-2 px-2 text-[12px] font-medium transition-colors sm:text-[13px] ${
                active
                  ? "border-signal bg-signal-soft font-semibold text-signal-ink"
                  : "border-transparent text-muted hover:bg-well hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {t.report.lenses[key]}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {lens === "business" && (
          <BusinessLens t={t} assessment={assessment} />
        )}
        {lens === "drill" && (
          <section className="panel mt-4 overflow-hidden ring-2 ring-signal-soft">
            <div className="hero-band flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-signal text-white shadow-[0_6px_16px_-8px_rgba(23,20,14,0.55)]"
              >
                <Siren className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold tracking-tight">{t.drill.title}</h2>
                <p className="mt-0.5 text-[12px] text-faint">
                  {fmt(t.report.coverageShort, { n: assessment.results.length })}
                </p>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6">{drill}</div>
          </section>
        )}
        {lens === "technical" && <TechnicalLens t={t} assessment={assessment} />}
        {lens === "investment" && (
          <InvestmentLens
            t={t}
            assessment={assessment}
            branding={branding}
            onBranding={setBranding}
          />
        )}
      </div>
    </div>
  );
}
