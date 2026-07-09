"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { AlertOctagon, AlertTriangle, Copy, Check, FileDown } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import type { Assessment } from "@/lib/engine";
import { fmtMinutes } from "@/lib/engine";
import { TIER_TARGETS } from "@/lib/calibration";
import { aggregateExposure, catastrophicList, formatMoney, isCatastrophic, postureBand } from "@/lib/exposure";
import { buildSummary, orderAsks, type Ask } from "@/lib/investment";
import type { PdfBlock, PdfDoc } from "@/lib/pdf";
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
  // When the same flag code appears in more than one placement group (hybrid),
  // label each ask with its group so the two don't read as duplicates.
  const dupCodes = new Set(
    a.flags.map((f) => f.code).filter((c, _i, arr) => arr.indexOf(c) !== arr.lastIndexOf(c)),
  );
  const scopeSuffix = (ask: Ask): string =>
    dupCodes.has(ask.flag.code) && ask.flag.scope !== "all" ? ` (${inv.scope[ask.flag.scope]})` : "";

  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [fallback, setFallback] = useState("");
  const printDate = new Date().toLocaleDateString();

  // Name the unrecoverable workloads with their criticality (e.g. "ERP (Kritis)")
  // instead of a bare count — browser-only, real names never leave here.
  const critLabel = (tier: 1 | 2 | 3) => inv.pdf.crit[tier];
  const catWorkloads = a.results.filter(isCatastrophic);
  const catNames = catastrophicList(a.results, critLabel);

  const exposureText =
    agg.monetizedCount > 0
      ? formatMoney(agg.total, t.currency) +
        (catWorkloads.length > 0 ? ` · ${fmt(inv.plusUnrecoverable, { names: catNames })}` : "")
      : catWorkloads.length > 0
        ? fmt(inv.allUnrecoverable, { names: catNames })
        : inv.noCost;
  const hasFigure = agg.monetizedCount > 0;
  const critHeadline = hasFigure || catWorkloads.length > 0;

  // --- Data derived for the C-level PDF sections (browser-only, real names) ---
  const P = inv.pdf;
  const durLabels = {
    unrecoverable: t.report.unrecoverable,
    min: t.report.units.min,
    h: t.report.units.h,
    d: t.report.units.d,
  };
  const dur = (m: number | null) => fmtMinutes(m, durLabels);
  const modelLabel = t.intake.models[model];
  const recoverable = a.results.filter((r) => r.achievableRtoMin !== null);
  const anyCat = catWorkloads.length > 0;
  const worstRto =
    anyCat || recoverable.length === 0
      ? null
      : Math.max(...recoverable.map((r) => r.achievableRtoMin as number));
  const worstRpo =
    anyCat || recoverable.length === 0
      ? null
      : Math.max(...recoverable.map((r) => r.achievableRpoMin as number));
  const targetRto = Math.min(...a.results.map((r) => TIER_TARGETS[r.workload.tier].rtoMin));
  const targetRpo = Math.min(...a.results.map((r) => TIER_TARGETS[r.workload.tier].rpoMin));
  const hasSingleSite = a.flags.some((f) => f.code === "single-site");
  const hasNoImmutable = a.flags.some((f) => f.code === "no-immutable");
  const financialCell = (ask: Ask): string => {
    const bd = ask.boughtDown;
    if (bd.kind === "loss" && bd.amount != null) return formatMoney(bd.amount, t.currency);
    if (bd.kind === "catastrophic") return P.unbounded;
    return "—";
  };

  const effectLine = (ask: Ask): string => {
    const bd = ask.boughtDown;
    if (bd.kind === "catastrophic") return fmt(inv.makesRecoverable, { n: bd.amount ?? 0 });
    if (bd.kind === "loss")
      return bd.amount != null ? fmt(inv.closes, { amount: formatMoney(bd.amount, t.currency) }) : inv.closesQual;
    return inv.strengthens;
  };
  const flagTitle = (ask: Ask): string => t.report.flags[ask.flag.code].title + scopeSuffix(ask);

  const summaryText = () =>
    buildSummary({
      title: inv.fundingCase,
      exposure: `${inv.exposureAtRisk}: ${exposureText}`,
      posture: `${inv.posture}: ${t.report.posture[posture]} — ${inv.bia}`,
      asks: asks.map((ask) => `${flagTitle(ask)} — ${effectLine(ask)}`),
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

  // The C-level justification as an ordered list of blocks. Data sections are
  // engine-computed; sections tagged with a guide are skeletons the sponsoring
  // team completes (the app never prices a fix / R2). Rendered to a real PDF
  // file by lib/pdf.ts — browser-only, no egress (R13).
  function buildPdfDoc(): PdfDoc {
    const blocks: PdfBlock[] = [
      { kind: "heading", num: 1, title: P.execSummary },
      {
        kind: "paragraph",
        text: fmt(P.execBody, {
          n,
          model: modelLabel,
          exposure: exposureText,
          posture: t.report.posture[posture],
        }),
      },
      {
        kind: "loss",
        label: P.lossHeading,
        value: exposureText,
        sub: `${inv.posture}: ${t.report.posture[posture]} · ${inv.bia}`,
        critical: critHeadline,
      },

      { kind: "heading", num: 2, title: P.currentSituation },
      { kind: "paragraph", text: fmt(P.situationLead, { model: modelLabel }) },
      a.flags.length === 0
        ? { kind: "paragraph", text: P.noGaps }
        : { kind: "bullets", items: a.flags.map((f) => t.report.flags[f.code].title) },

      { kind: "heading", num: 3, title: P.riskAssessment },
      asks.length === 0
        ? { kind: "paragraph", text: P.noGaps }
        : {
            kind: "table",
            head: [P.thRisk, P.thSeverity, P.thFinancial],
            rows: asks.map((ask) => [
              flagTitle(ask),
              ask.flag.severity === "critical" ? t.report.severity.critical : t.report.severity.warning,
              financialCell(ask),
            ]),
          },

      { kind: "heading", num: 4, title: P.bia },
      {
        kind: "table",
        head: [P.thWorkload, P.thCriticality, P.thTolerance, P.thImpact],
        rows: a.results.map((r) => [
          r.workload.name,
          critLabel(r.workload.tier),
          dur(TIER_TARGETS[r.workload.tier].rtoMin),
          P.biaImpact[r.workload.tier],
        ]),
      },

      { kind: "heading", num: 5, title: P.currentGap },
      { kind: "paragraph", text: P.gapLead },
      {
        kind: "table",
        head: [P.thCapability, P.thCurrent, P.thTarget],
        rows: [
          [P.capabilityRto, dur(worstRto), dur(targetRto)],
          [P.capabilityRpo, dur(worstRpo), dur(targetRpo)],
          ...(hasSingleSite ? [[P.capabilitySite, P.none, P.active]] : []),
          ...(hasNoImmutable ? [[P.capabilityCyber, P.none, P.yes]] : []),
        ],
      },

      { kind: "heading", num: 6, title: P.options, guide: P.guideTag },
      { kind: "guide", lines: P.optionsGuide },

      { kind: "heading", num: 7, title: P.solution, guide: P.guideTag },
      { kind: "guide", lines: P.solutionGuide },

      { kind: "heading", num: 8, title: P.financial, guide: P.guideTag },
      { kind: "guide", lines: [P.financialGuide] },
      { kind: "table", head: [P.thItem, P.thCost], rows: P.finItems.map((it) => [it, ""]) },

      { kind: "heading", num: 9, title: P.doingNothing },
      { kind: "paragraph", text: P.doingNothingLead },
      { kind: "loss", label: "", value: exposureText, sub: "", critical: critHeadline },
      { kind: "bullets", items: P.doingNothingList },

      { kind: "heading", num: 10, title: P.benefits },
      { kind: "subheading", text: P.tangibleH },
      asks.length === 0
        ? { kind: "paragraph", text: "—" }
        : {
            kind: "bullets",
            items: asks.map((ask) => `${t.report.flags[ask.flag.code].title} — ${effectLine(ask)}`),
          },
      { kind: "subheading", text: P.intangibleH },
      { kind: "bullets", items: P.intangible },

      { kind: "heading", num: 11, title: P.roadmap, guide: P.guideTag },
      { kind: "guide", lines: P.roadmapGuide },

      { kind: "heading", num: 12, title: P.governance, guide: P.guideTag },
      { kind: "guide", lines: P.governanceGuide },

      { kind: "heading", num: 13, title: P.kpis },
      { kind: "paragraph", text: P.kpiLead },
      {
        kind: "bullets",
        items: [
          `${P.capabilityRto} <= ${dur(targetRto)}`,
          `${P.capabilityRpo} <= ${dur(targetRpo)}`,
          ...P.kpiStatic,
        ],
      },

      { kind: "heading", num: 14, title: P.recommendation },
      { kind: "paragraph", text: fmt(P.recBody, { fill: P.fillHint }) },
      { kind: "subheading", text: P.asksHeading },
      asks.length === 0
        ? { kind: "paragraph", text: t.report.investEmpty }
        : {
            kind: "bullets",
            items: asks.map((ask) => `${flagTitle(ask)} — ${P.whatItBuys}: ${effectLine(ask)}`),
          },
    ];

    return {
      filename: `${P.docTitle}.pdf`,
      title: P.docTitle,
      subtitle: P.forC,
      brand: t.appName,
      date: printDate,
      intro: P.intro,
      footer: `${coverage} · ${inv.preparedBy}`,
      blocks,
    };
  }

  const onDownloadPdf = async () => {
    track("pdf_exported"); // R24: anonymous count, no payload
    // Build a real PDF file client-side and download it — no print dialog, no
    // egress. jsPDF is code-split, loaded only on demand.
    const { downloadPdf } = await import("@/lib/pdf");
    downloadPdf(buildPdfDoc());
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
            className={`mt-1 font-mono font-semibold tracking-tight ${hasFigure ? "text-[2rem]" : critHeadline ? "text-[1.35rem]" : "text-[15px]"}`}
            style={{ color: critHeadline ? "var(--color-crit)" : "var(--color-muted)" }}
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
                        <span className="text-[14px] font-semibold text-text">
                          {copy.title}
                          {scopeSuffix(ask)}
                        </span>
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
          <button onClick={onDownloadPdf} className="btn-ghost px-4 text-sm">
            <FileDown className="h-4 w-4" />
            {inv.pdf.download}
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
