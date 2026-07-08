"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { AlertOctagon, AlertTriangle, Copy, Check } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import type { Assessment } from "@/lib/engine";
import { aggregateExposure, formatIDR, postureBand } from "@/lib/exposure";
import { buildSummary, orderAsks, type Ask } from "@/lib/investment";
import { PostureChip } from "@/components/lenses/shared";

export function InvestmentLens({ t, assessment }: { t: Dictionary; assessment: Assessment }) {
  const a = assessment;
  const inv = t.report.invest;
  const n = a.results.length;
  const model = a.findings.model;
  const agg = aggregateExposure(a.results);
  const posture = postureBand(a.results, a.flags);
  const asks = orderAsks(a.flags, a.results, model);
  const coverage = fmt(t.report.coverageShort, { n });

  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [fallback, setFallback] = useState("");

  const exposureText = agg.hasCost
    ? formatIDR(agg.total) +
      (agg.catastrophicCount > 0 ? ` · ${fmt(inv.plusUnrecoverable, { n: agg.catastrophicCount })}` : "")
    : inv.noCost;

  const effectLine = (ask: Ask): string => {
    const bd = ask.boughtDown;
    if (bd.kind === "catastrophic") return fmt(inv.makesRecoverable, { n: bd.amount ?? 0 });
    if (bd.kind === "loss")
      return bd.amount != null ? fmt(inv.closes, { amount: formatIDR(bd.amount) }) : inv.closesQual;
    return inv.strengthens;
  };

  const summaryText = () =>
    buildSummary({
      title: inv.fundingCase,
      exposure: `${inv.exposureAtRisk}: ${exposureText}`,
      posture: `${inv.posture}: ${t.report.posture[posture]} — ${inv.bia}`,
      asks: asks.map((ask) => `${t.report.flags[ask.flag.code].title} — ${effectLine(ask)}`),
      coverage,
    });

  const onCopy = async () => {
    const text = summaryText();
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
      track("one_pager_shared"); // R24: anonymous count, no payload
    } catch {
      setFallback(text);
      setCopyState("failed");
    }
  };

  return (
    <section className="panel mt-4 overflow-hidden">
      {/* One-pager header */}
      <div className="hero-band border-b border-line px-5 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-tight">{inv.fundingCase}</h2>
            <p className="mt-0.5 text-[12px] text-faint">{coverage}</p>
          </div>
          <PostureChip t={t} posture={posture} />
        </div>
        <div className="mt-4">
          <div className="tag text-[10px]">{inv.exposureAtRisk}</div>
          <div
            className={`mt-1 font-mono font-semibold tracking-tight ${agg.hasCost ? "text-[2rem]" : "text-[15px]"}`}
            style={{ color: agg.hasCost ? "var(--color-crit)" : "var(--color-muted)" }}
          >
            {exposureText}
          </div>
          <div className="mt-1 text-[12px] text-faint">{inv.bia}</div>
        </div>
      </div>

      {/* Prioritized asks */}
      <div className="px-5 py-5 sm:px-6">
        {asks.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-ok-soft/60 p-4 text-[13px] text-ok">
            <Check className="h-5 w-5 shrink-0" aria-hidden />
            <span className="font-medium text-text">{t.report.investEmpty}</span>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-semibold">{t.report.investTitle}</span>
              <span className="chip chip-neutral">{asks.length}</span>
            </div>
            <div className="grid gap-3">
              {asks.map((ask, i) => {
                const copy = t.report.flags[ask.flag.code];
                const critical = ask.flag.severity === "critical";
                const rail = critical ? "var(--color-crit)" : "var(--color-warn)";
                const Icon = critical ? AlertOctagon : AlertTriangle;
                return (
                  <div
                    key={`${ask.flag.code}-${ask.flag.scope}-${i}`}
                    className="relative overflow-hidden rounded-xl border border-line bg-panel"
                  >
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: rail }} />
                    <div className="py-3.5 pl-4 pr-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" style={{ color: rail }} aria-hidden />
                        <span className={critical ? "chip chip-crit" : "chip chip-warn"}>
                          {critical ? t.report.severity.critical : t.report.severity.warning}
                        </span>
                        <span className="text-[14px] font-semibold text-text">{copy.title}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] font-semibold" style={{ color: rail }}>
                        {effectLine(ask)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Share */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
          <button onClick={onCopy} className="btn-primary px-4 text-sm">
            {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copyState === "copied" ? inv.copied : inv.copy}
          </button>
          <span className="text-[12px] text-faint">{inv.preparedBy}</span>
        </div>
        {copyState === "failed" && (
          <div className="mt-3">
            <p className="mb-1 text-[12px] text-warn">{inv.copyFailed}</p>
            <textarea
              readOnly
              rows={6}
              className="field w-full px-3 py-2 font-mono text-[12px]"
              value={fallback}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
      </div>
    </section>
  );
}
