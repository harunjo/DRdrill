"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { track } from "@vercel/analytics";
import { AlertOctagon, AlertTriangle, Copy, Check, FileDown } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import type { Assessment } from "@/lib/engine";
import { fmtMinutes } from "@/lib/engine";
import { TIER_TARGETS } from "@/lib/calibration";
import { aggregateExposure, catastrophicList, formatMoney, isCatastrophic, postureBand } from "@/lib/exposure";
import { buildSummary, orderAsks, type Ask } from "@/lib/investment";
import { PostureChip } from "@/components/lenses/shared";

// Stable args for a client-only flag via useSyncExternalStore (no re-subscribe).
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

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
  // Portal the print doc to <body>, but only on the client (no document on the
  // server). useSyncExternalStore returns false during SSR + first hydration.
  const mounted = useSyncExternalStore(subscribeNoop, getTrue, getFalse);
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

  const summaryText = () =>
    buildSummary({
      title: inv.fundingCase,
      exposure: `${inv.exposureAtRisk}: ${exposureText}`,
      posture: `${inv.posture}: ${t.report.posture[posture]} — ${inv.bia}`,
      asks: asks.map(
        (ask) => `${t.report.flags[ask.flag.code].title}${scopeSuffix(ask)} — ${effectLine(ask)}`,
      ),
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
    <>
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
          <button
            onClick={() => {
              track("pdf_exported"); // R24: anonymous count, no payload
              window.print();
            }}
            className="btn-ghost px-4 text-sm"
          >
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

    {/* Print-only C-level justification — native window.print() → Save as PDF.
        Portaled to <body> so it prints as a top-level element in normal flow:
        @page margins then apply on every page and content paginates cleanly
        (an absolutely-positioned box ignores page margins and can't). Hidden on
        screen; the app is display:none'd in print by the .print-root rules.
        Data sections are computed by the engine; sections tagged as a guide are
        skeletons the sponsoring team completes (the app never prices a fix / R2). */}
    {mounted && createPortal(<div className="print-root">{renderPrintDoc()}</div>, document.body)}
    </>
  );

  function renderPrintDoc() {
    const secStyle = { marginTop: "20px", breakInside: "avoid" as const };
    const hStyle = {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      fontWeight: 700,
      color: "#111",
      borderBottom: "1px solid #ddd",
      paddingBottom: "4px",
      marginBottom: "8px",
    };
    const guideTagStyle = {
      fontSize: "9px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "#8a6d00",
      background: "#fdf6e3",
      border: "1px solid #ecdca0",
      borderRadius: "4px",
      padding: "1px 6px",
    };
    const guideBoxStyle = {
      border: "1px dashed #bbb",
      background: "#f7f7f7",
      borderRadius: "6px",
      padding: "10px 12px",
      color: "#555",
      fontStyle: "italic" as const,
      fontSize: "12px",
    };
    const tblStyle = {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: "12px",
      marginTop: "4px",
    };
    const thStyle = {
      textAlign: "left" as const,
      borderBottom: "1.5px solid #111",
      padding: "5px 8px",
      fontWeight: 600,
      color: "#111",
    };
    const tdStyle = {
      borderBottom: "1px solid #e5e5e5",
      padding: "5px 8px",
      color: "#333",
      verticalAlign: "top" as const,
    };

    const secHead = (num: number, title: string, guide = false) => (
      <div style={hStyle}>
        <span>
          {num}. {title}
        </span>
        {guide && <span style={guideTagStyle}>{P.guideTag}</span>}
      </div>
    );
    const table = (headers: string[], rows: string[][]) => (
      <table style={tblStyle}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci} style={tdStyle}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
    const guideBox = (lines: string[]) => (
      <div style={guideBoxStyle}>
        {lines.map((l, i) => (
          <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>
            {l}
          </p>
        ))}
      </div>
    );
    const bullets = (items: string[]) => (
      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "12px", color: "#333" }}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: "3px" }}>
            {it}
          </li>
        ))}
      </ul>
    );

    return (
      <div style={{ color: "#111", fontSize: "12.5px", lineHeight: 1.55 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "2px solid #111",
            paddingBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{P.docTitle}</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{P.forC}</div>
          </div>
          <div style={{ fontSize: "11px", color: "#666", textAlign: "right" }}>
            {t.appName}
            <br />
            {printDate}
          </div>
        </div>
        <p style={{ marginTop: "12px", color: "#444" }}>{P.intro}</p>

        {/* 1. Executive Summary */}
        <div style={secStyle}>
          {secHead(1, P.execSummary)}
          <p style={{ margin: 0 }}>
            {fmt(P.execBody, {
              n,
              model: modelLabel,
              exposure: exposureText,
              posture: t.report.posture[posture],
            })}
          </p>
          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#666",
              }}
            >
              {P.lossHeading}
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: critHeadline ? "#c0392b" : "#111",
                marginTop: "2px",
              }}
            >
              {exposureText}
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {inv.posture}: {t.report.posture[posture]} · {inv.bia}
            </div>
          </div>
        </div>

        {/* 2. Current Situation */}
        <div style={secStyle}>
          {secHead(2, P.currentSituation)}
          <p style={{ margin: "0 0 6px" }}>{fmt(P.situationLead, { model: modelLabel })}</p>
          {a.flags.length === 0 ? (
            <p style={{ margin: 0 }}>{P.noGaps}</p>
          ) : (
            bullets(a.flags.map((f) => t.report.flags[f.code].title))
          )}
        </div>

        {/* 3. Risk Assessment */}
        <div style={secStyle}>
          {secHead(3, P.riskAssessment)}
          {asks.length === 0 ? (
            <p style={{ margin: 0 }}>{P.noGaps}</p>
          ) : (
            table(
              [P.thRisk, P.thSeverity, P.thFinancial],
              asks.map((ask) => [
                t.report.flags[ask.flag.code].title + scopeSuffix(ask),
                ask.flag.severity === "critical"
                  ? t.report.severity.critical
                  : t.report.severity.warning,
                financialCell(ask),
              ]),
            )
          )}
        </div>

        {/* 4. Business Impact Analysis */}
        <div style={secStyle}>
          {secHead(4, P.bia)}
          {table(
            [P.thWorkload, P.thCriticality, P.thTolerance, P.thImpact],
            a.results.map((r) => [
              r.workload.name,
              critLabel(r.workload.tier),
              dur(TIER_TARGETS[r.workload.tier].rtoMin),
              P.biaImpact[r.workload.tier],
            ]),
          )}
        </div>

        {/* 5. Current Gap */}
        <div style={secStyle}>
          {secHead(5, P.currentGap)}
          <p style={{ margin: "0 0 6px" }}>{P.gapLead}</p>
          {table(
            [P.thCapability, P.thCurrent, P.thTarget],
            [
              [P.capabilityRto, dur(worstRto), dur(targetRto)],
              [P.capabilityRpo, dur(worstRpo), dur(targetRpo)],
              ...(hasSingleSite ? [[P.capabilitySite, P.none, P.active]] : []),
              ...(hasNoImmutable ? [[P.capabilityCyber, P.none, P.yes]] : []),
            ],
          )}
        </div>

        {/* 6. Options Considered — guide */}
        <div style={secStyle}>
          {secHead(6, P.options, true)}
          {guideBox(P.optionsGuide)}
        </div>

        {/* 7. Proposed Solution — guide */}
        <div style={secStyle}>
          {secHead(7, P.solution, true)}
          {guideBox(P.solutionGuide)}
        </div>

        {/* 8. Financial Analysis — guide + blank cost table */}
        <div style={secStyle}>
          {secHead(8, P.financial, true)}
          <div style={guideBoxStyle}>{P.financialGuide}</div>
          <div style={{ marginTop: "8px" }}>
            {table([P.thItem, P.thCost], P.finItems.map((it) => [it, ""]))}
          </div>
        </div>

        {/* 9. Cost of Doing Nothing */}
        <div style={secStyle}>
          {secHead(9, P.doingNothing)}
          <p style={{ margin: "0 0 6px" }}>{P.doingNothingLead}</p>
          <div
            style={{ fontSize: "22px", fontWeight: 700, color: critHeadline ? "#c0392b" : "#111" }}
          >
            {exposureText}
          </div>
          {bullets(P.doingNothingList)}
        </div>

        {/* 10. Benefits */}
        <div style={secStyle}>
          {secHead(10, P.benefits)}
          <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "2px" }}>{P.tangibleH}</div>
          {asks.length === 0 ? (
            <p style={{ margin: 0 }}>—</p>
          ) : (
            bullets(asks.map((ask) => `${t.report.flags[ask.flag.code].title} — ${effectLine(ask)}`))
          )}
          <div style={{ fontWeight: 600, fontSize: "12px", margin: "8px 0 2px" }}>
            {P.intangibleH}
          </div>
          {bullets(P.intangible)}
        </div>

        {/* 11. Roadmap — guide */}
        <div style={secStyle}>
          {secHead(11, P.roadmap, true)}
          {guideBox(P.roadmapGuide)}
        </div>

        {/* 12. Governance — guide */}
        <div style={secStyle}>
          {secHead(12, P.governance, true)}
          {guideBox(P.governanceGuide)}
        </div>

        {/* 13. Success Metrics */}
        <div style={secStyle}>
          {secHead(13, P.kpis)}
          <p style={{ margin: "0 0 6px" }}>{P.kpiLead}</p>
          {bullets([
            `${P.capabilityRto} ≤ ${dur(targetRto)}`,
            `${P.capabilityRpo} ≤ ${dur(targetRpo)}`,
            ...P.kpiStatic,
          ])}
        </div>

        {/* 14. Recommendation */}
        <div style={secStyle}>
          {secHead(14, P.recommendation)}
          <p style={{ margin: "0 0 8px" }}>{fmt(P.recBody, { fill: P.fillHint })}</p>
          <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "4px" }}>
            {P.asksHeading}
          </div>
          {asks.length === 0 ? (
            <p style={{ margin: 0 }}>{t.report.investEmpty}</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: "18px" }}>
              {asks.map((ask, i) => (
                <li key={`${ask.flag.code}-${ask.flag.scope}-${i}`} style={{ marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>
                    {t.report.flags[ask.flag.code].title}
                    {scopeSuffix(ask)}
                  </span>
                  <span style={{ display: "block", color: "#555" }}>
                    {P.whatItBuys}: {effectLine(ask)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "22px",
            borderTop: "1px solid #ccc",
            paddingTop: "10px",
            fontSize: "10px",
            color: "#777",
          }}
        >
          {coverage} · {inv.preparedBy}
        </div>
      </div>
    );
  }
}
