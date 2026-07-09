---
date: 2026-07-09
topic: nist-csf-posture-expansion
---

# NIST CSF Posture Expansion — Requirements

## Summary

Reposition DR Drill from a BC/DR readiness tool into a **NIST CSF 2.0 posture self-assessment**. The existing RPO/RTO/3-2-1 engine becomes the **Recover** function; the first build adds **Detect** and **Respond** as fully-scored functions under the same deterministic, calibrated-weight discipline, surfacing a per-function posture radar and a full attack-to-recovery drill narrative. The remaining review suggestions are triaged into greenlit parallel improvements and deferred follow-ons.

## Problem Frame

The tool today assesses recovery only — RPO/RTO, the 3-2-1 rule, a readiness score. A round of field feedback (13 items from a user's colleague who ran a real assessment) clustered into three pressures: broaden the assessment beyond backup/recovery into detection, response, and security controls; keep the intake from becoming a tiring "next-next" slog as inputs grow; and make the report more visual and consequential rather than an arithmetic sum.

The trap in answering that pressure is dilution. The tool's credibility rests on one property — every number shown is computed from calibrated constants and is defensible, and the LLM only retells, never invents. A generic security questionnaire with soft maturity ratings would satisfy the feature list while destroying the thing that makes the tool worth trusting.

## Key Decisions

- **NIST CSF 2.0 is the organizing spine.** The six functions (Govern, Identify, Protect, Detect, Respond, Recover) structure the whole product. The existing engine already *is* Recover, so the expansion extends rather than rewrites.
- **Deterministic maturity scoring, never LLM-rated.** Each new function scores from a practitioner-calibrated control-weight table in `lib/calibration.ts`, exactly as tier targets do today. This is non-negotiable — it is the property the repositioning must not break.
- **MVP is depth-first: Detect + Respond.** Two new functions built to the same rigor as Recover, chosen because the colleague's specific asks (SIEM, monitoring, isolation) map there. Govern / Identify / Protect wait for later phases; the posture picture is knowingly partial until then.
- **Detect/Respond are assessed per-environment.** These are organizational controls — a SIEM, an IR plan, or an isolation capability isn't owned per workload — so they're asked once for the environment. Recover stays per-workload.
- **Two depths, one product.** A generalist default (plain language, controls explained, current SMB register) with an opt-in advanced/compliance depth (raw CSF terminology, fuller control set). The default stays the front door; security-literate users are not capped.
- **Per-function scores, no blended overall number.** While the radar is partial, collapsing it into one "overall posture" score would mislead. Scores stay per-function.
- **Money stays DR/downtime-only.** Detect/Respond gaps yield a maturity score, prioritized fix-asks, and a *qualitative* incident-amplification in the drill — not a monetary breach figure. A calibrated breach-cost model is deferred.
- **Performance is not a first-class axis.** It folds in only as availability/HA under Protect/Recover. Raw latency/capacity can't be self-assessed honestly without telemetry.
- **"Scary" is achieved honestly.** The requested dramatic forecast becomes an Annualized Loss Expectancy (per-incident loss × a calibrated event-likelihood), plus a drill that is alarming because the gaps are real — never inflated numbers.

## Requirements

**NIST CSF repositioning**

R1. The product presents IT resilience organized by the six NIST CSF 2.0 functions. The existing RPO/RTO/3-2-1 assessment is presented as the Recover function; its computations are unchanged.

R2. The report surfaces a per-function posture radar across the CSF functions. Only assessed functions carry a score; unassessed functions render as "not yet assessed," not as zero.

R3. No single blended overall posture score is shown while the radar is partial; scores are per-function.

**Detect + Respond assessment (MVP)**

R4. Intake gains a Detect section capturing control presence/maturity: SIEM, centralized logging, endpoint/EDR monitoring, network monitoring, alerting, and vulnerability-scan cadence.

R5. Intake gains a Respond section: documented incident-response plan, response ownership/on-call, network isolation/segmentation ("isolate zone"), response playbooks, tabletop-exercise cadence, and a breach-notification process.

R6. Detect and Respond each yield a deterministic maturity score computed by pure functions from calibrated control weights; no score is model-generated.

R7. Detect/Respond gaps become risk flags that feed the investment lens as prioritized "risk bought down" asks (e.g., adding a SIEM closes a named Detect gap).

R8. Detect/Respond gaps produce a qualitative incident-amplification in the drill (e.g., "no SIEM → the intruder dwelled undetected for weeks; no isolation → it spread"); they produce no monetary figure.

R9. The drill extends into a full attack-to-recovery timeline spanning Detect → Respond → Recover, retelling only computed findings.

**Engine and trust-boundary invariants**

R10. New control signals enter `FindingsPayload` only as pseudonymized booleans/enums (W1..Wn scope where workload-specific); no name, cost, or free text is ever added.

R11. Every new number is computed by pure functions from constants in `lib/calibration.ts`; `validateNarrative` continues to reject any number in the story not derivable from findings.

**Parallel improvements — independent of the CSF work, greenlit to ship alongside**

R12. Report and PDF accept an optional company name and logo; both stay browser-only, the logo embeds in the PDF as a data-URI, and neither enters `FindingsPayload`.

R13. Workload size accepts a GB/TB unit; the engine stores a single canonical unit internally.

R14. The DR money model gains an Annualized Loss Expectancy view: per-incident loss × a calibrated event-likelihood constant, presented as an honest expected-annual figure.

R15. The report reduces prose in favor of charts that visualize only computed values (posture radar, exposure, gaps).

R16. Each material risk carries a short static "why this matters" context note shipped with the app; no external or live news is fetched.

**Assessment granularity and audience**

R17. Detect and Respond are assessed once per environment (organization-level); no Detect/Respond control is attributed per workload. Recover remains per-workload.

R18. The product offers two depths: a generalist default (plain-language, controls explained, current SMB register) and an opt-in advanced/compliance depth (raw CSF terminology, fuller control set). The generalist default is the entry experience.

## Disposition of the 13 review items

| # | Reviewer item | Disposition |
|---|---|---|
| 1 | Company name + logo | **In** — R12, browser-only |
| 2 | Multi-site option | **Deferred** — later phase |
| 3 | Left-right canvas intake | **Deferred** — revisit as CSF/multi-site inflate inputs |
| 4 | Size unit dropdown (not just GB) | **In** — R13 |
| 5 | Downtime cost in USD by currency | **Done** — shipped 2026-07-09 |
| 6 | NIST reference in Protection | **Adopted as the spine** — Detect/Respond MVP (R4–R9) |
| 7 | Per-workload backup window | **Deferred** — later phase |
| 8 | Replication what/via checklist | **Deferred** — later phase |
| 9 | "Scary" business-impact forecast | **Reframed** — honest ALE (R14), not inflation |
| 10 | Comprehensive technical (perf/security) | Security: **in** via CSF (R4–R9). Performance: **out** as its own axis |
| 11 | Investment from perf/HA/security | Security: **in** via R7. Performance/HA: **deferred** |
| 12 | Charts / less text / predictive | **In** — R15 (charts of computed values); "predictive" limited to R14 ALE |
| 13 | News about real incidents | **Reframed** — static curated context (R16); live feed rejected |

## Scope Boundaries

**Deferred for later** (eventually, not this phase)
- Govern, Identify, and Protect CSF functions.
- Multi-site modeling (#2), per-workload backup window (#7), replication what/via detail (#8), and per-workload/per-site protection granularity.
- Left-right canvas intake (#3) — revisit when input volume makes the wizard tiring.
- Performance/HA investment angle (#11 performance part).

**Outside this product's identity** (positioning rejections)
- A live news feed (#13 as literally asked) — breaks the browser-only / no-egress promise.
- LLM-generated maturity ratings or any model-invented number — violates the deterministic-engine rule.
- Fear-inflated impact figures — credibility is honest numbers; the "serem" effect comes from real gaps and the ALE, not exaggeration.
- Raw performance benchmarking (latency/capacity) — not honestly self-assessable without telemetry.

## Dependencies / Assumptions

- The NIST CSF 2.0 function set is the reference taxonomy.
- Deterministic scoring assumes a practitioner-calibrated control-weight table per function, reviewed like the existing tier targets. **Unverified assumption:** the specific control lists and weights need a practitioner pass before launch.
- Existing invariants hold: `app/api/narrative/route.ts` is the only server route and the only egress; assessment, report, and PDF are entirely client-side.

## Outstanding Questions

**Deferred to planning**
- Exact control list and calibrated weights per function.
- Radar chart approach — reuse the heatmap component patterns vs a new chart.
- Whether Recover's existing "readiness score" is renamed or repositioned under the per-function framing.
