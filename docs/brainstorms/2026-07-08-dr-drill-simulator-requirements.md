---
date: 2026-07-08
topic: dr-drill-simulator
---

# DR Drill Simulator — Requirements

## Summary

A free, bilingual (Indonesian/English) business-continuity readiness tool at drdrill.harunjonatan.com. An IT manager describes their environment — on-premise, full cloud, hybrid, or private cloud — and gets a four-part report: readiness score, RPO/RTO gap table, risk flags, and an AI-narrated drill scenario for a disaster they pick.

---

## Problem Frame

Indonesian mid-market companies (50–2000 employees: hospitals, manufacturers, distributors, regional banks) run real workloads with informal continuity planning. The IT manager usually cannot answer "if ransomware hits tonight, when are we back?" with a number — the honest answer lives in backup schedules, replication settings, and assumptions nobody has combined. Existing assessment tools are vendor sales funnels (Veeam/Commvault calculators) in English, tuned to sell licenses rather than tell the truth. The moment of pain is concrete: management asks "backup kita aman?" after a ransomware headline, and the IT manager has no defensible artifact to answer with.

Demand is assumed, not evidenced — see Dependencies / Assumptions.

---

## Key Decisions

- **Report shape now, playable drill later.** V1 is an assessment report; the drill is the report's fourth section with a user-selected scenario. A fully interactive, story-first drill experience is the headline v2 candidate, not v1.
- **Deterministic engine in the browser; LLM narrates only.** Every number (RPO, RTO, score, flags) is computed client-side in pure code. The LLM receives only the computed findings — never raw environment descriptions — and writes prose from them. The narrative may not introduce any fact not present in the findings.
- **Privacy as a stated feature.** No accounts, no server-side storage of environment data, stateless sessions. Workload names are pseudonymized in the browser before any narrative call, so the page can state plainly: environment details and names never leave the browser — the narrative service receives only anonymized computed findings. The only server-side data is anonymous aggregate usage counts (R24), which carry no environment information. This is the trust unlock for an audience describing their infrastructure to a website.
- **Bilingual from day one.** Indonesian and English ship together; retrofit is worse than upfront cost. Follows the konverterteks.com precedent.
- **Business-continuity framing, not backup-checking.** The question answered is "does the business keep running," which is why deployment model is a first-class input rather than an afterthought.
- **Vendor-neutral.** The tool never recommends a specific backup product or brand. Credibility comes from neutrality; the operator's name is the only attribution.

---

## Actors

- A1. IT manager / IT head (primary user) — completes the assessment, owns the result.
- A2. Management / business stakeholders (report audience) — receive the score, flags, or drill story as a screenshot or shared artifact; never use the tool directly.

---

## Requirements

**Environment intake**

- R1. The user selects a deployment model — on-premise, full cloud, hybrid, or private cloud — and the intake adapts to it (e.g., cloud asks about snapshot/cross-region policy, on-prem asks about backup jobs and media).
- R2. The user describes their 5–10 most critical workloads: name, type (database, VMs, file shares, SaaS), size, and criticality tier — the intake is explicitly scoped to the most critical systems, not an exhaustive inventory.
- R3. The user describes current protection — backup frequency, replication, offsite copy, immutable copy, second site/region — with the specific inputs varying by the deployment model selected in R1 (e.g., "backup frequency" reads as job frequency on-premise and snapshot frequency in cloud).
- R4. Intake is completable by a mid-market IT manager from memory in under ~10 minutes — no inputs that require opening a vendor console to answer.

**Assessment engine**

- R5. The engine computes achievable RPO and RTO per workload deterministically, and compares them against criticality-tier targets.
- R6. The engine emits risk flags with severity and plain-language explanations (ransomware exposure without an immutable copy, single-site exposure, SaaS shared-responsibility gaps, unprotected workloads).
- R7. The engine evaluates the 3-2-1 rule (at least 3 copies of data, on 2 different media, 1 offsite) and produces a 0–100 readiness score.
- R8. All engine computation runs in the browser; no environment data is transmitted for scoring.

**Report**

- R9. The report presents four parts on one screen: readiness score, per-workload RPO/RTO gap table, risk flags, and the drill narrative.
- R10. Each report part is self-contained enough to screenshot into a chat or slide and still make sense (title, verdict, context on the artifact itself).
- R16. Intake and report are mobile-responsive; the primary sharing action (screenshot to chat) and discovery channel (LinkedIn) are phone-first.
- R17. The report states the inputs it was computed from and which workloads it covers, and labels the score as "readiness as described" — a conditional verdict on the self-reported inputs, not an audited finding.
- R18. Gap and flag language is addressed to the business as investment asks ("to reach the 15-minute target, X is needed"), never as operator fault — a low score reads as budget ammunition for the IT manager, not evidence against them.

**Drill narrative**

- R11. The user picks the disaster scenario: ransomware (default), site loss (fire/flood), cloud/region outage, or accidental deletion.
- R12. The narrative is a timestamped incident story generated from the computed findings only, and must not invent facts, systems, or numbers not present in the findings. Workload names are pseudonymized before the narrative call and re-substituted in the browser, so the rendered story shows the user's real names without those names ever leaving the browser.
- R13. If the narrative service is unavailable, the report's other three parts still render fully — the drill section degrades, the assessment does not.
- R19. Narrative generations are capped per session (one per scenario plus a small total budget) with a plain-language notice when the cap is reached; the cap reuses the R13 degradation presentation.
- R20. The browser mechanically validates each generated narrative against the findings payload — every number and workload label in the story must appear in the findings — and redacts or regenerates on failure, making the no-invention guarantee checked on every generation, not spot-checked.
- R21. User-supplied free text (workload names) is length-capped and treated as untrusted data in the narrative prompt; the narrative is constrained to a fixed output structure rather than free-form continuation of user text.
- R22. The narrative provider must offer a no-training / short-retention commitment for the findings payload; the provider choice at planning documents it.

**Language and distribution**

- R14. Full Indonesian and English versions ship at launch; the user can switch languages without losing entered data.
- R15. The tool is hosted at drdrill.harunjonatan.com with attribution to Harun Jonatan linking harunjonatan.com; no other branding.
- R23. Switching language after the report has rendered re-renders the deterministic parts in the new language; the drill narrative is regenerated in the new language within the R19 cap, and past the cap it remains in the original language with a notice.

**Measurement**

- R24. Anonymous, aggregate usage events only — page view, assessment completed, narrative generated, scenario swapped — with no environment data attached; these counts are the explicitly stated carve-out from the privacy promise and the data source for the demand go/no-go decision.

---

## Key Flows

- F1. Assessment
  - **Trigger:** User lands on the page (from a LinkedIn post or shared link).
  - **Steps:** Pick language → pick deployment model → add workloads → describe protection → run assessment → four-part report renders (score, gap table, flags render instantly from the local engine; drill narrative streams in after).
  - **Outcome:** User screenshots or shares a report part; no data persisted anywhere.
  - **Covers:** R1–R12 (initial render uses the default scenario); scenario swaps are F2.
- F2. Drill scenario swap
  - **Trigger:** User picks a different disaster in the report's drill section.
  - **Steps:** New narrative generated from the same computed findings; rest of the report unchanged.
  - **Outcome:** Fresh drill story without re-entering the environment.
  - **Covers:** R11–R13.

---

## Acceptance Examples

- AE1. **Covers R5, R6.** Given a Tier-1 database with nightly backups, no replication, and no immutable copy, when the assessment runs, then the gap table shows achievable RPO of 24h against a 15-minute target (fail), and a critical ransomware-exposure flag appears.
- AE2. **Covers R1, R5.** Given a full-cloud deployment with 4-hourly snapshots and no cross-region copy, when the assessment runs, then RPO derives from snapshot frequency (not backup jobs) and a region-outage exposure flag appears.
- AE3. **Covers R12.** Given computed findings that include workload "ERP" with achievable RPO of 11h, when the ransomware drill is generated, then the narrative may say the last clean copy is 11 hours old, and must not name any system, tool, or number absent from the findings.
- AE4. **Covers R13.** Given the narrative service errs or times out, when the report renders, then score, gap table, and flags display normally with a graceful notice in the drill section.
- AE5. **Covers R14.** Given a user who filled the intake in Indonesian, when they switch to English, then entered workloads and protection answers persist.

---

## Success Criteria

- An IT manager who has never seen the tool completes the assessment unaided and shares at least one report part — the shareability test drives design more than feature count.
- The drill narrative never contains a fact absent from the computed findings (spot-checkable on every generation).
- A data-protection practitioner reading the engine's outputs finds the numbers defensible, not marketing-shaped.

---

## Scope Boundaries

**Deferred for later**

- Interactive, story-first playable drill (the v2 headline).
- PDF export and shareable result links.
- Peer benchmarking / aggregated industry comparisons (requires storage, kills the stateless promise).
- Consulting lead capture, email collection, accounts.

**Outside this product's identity**

- Vendor or product recommendations — the tool never says "buy X."
- Full BC/DR documentation generation (runbooks, BIA documents) — this is an assessment and a wake-up call, not a compliance artifact.

---

## Dependencies / Assumptions

- **Demand is an assumption.** No confirmed pull from the target audience yet; the launch bet is distribution through the operator's LinkedIn network (Indonesian IT mid-market). The R24 usage counts are the evidence stream: if launch posts produce no meaningful completions within the first weeks (threshold set at planning), revisit before investing in v2.
- An LLM provider key (server-side) is required for the drill narrative; the deterministic report must not depend on it (R13).
- A Next.js scaffold exists at the repo root with a first-cut engine (`lib/engine.ts`) and form page (`app/page.tsx`); both predate this document and are expected to be revised by planning, not treated as fixed.

---

## Outstanding Questions

**Deferred to planning**

- How deployment model shapes intake structurally (per-environment vs per-workload protection settings; hybrid needs workload placement).
- Engine calibration: tier targets, restore-throughput assumptions, cloud snapshot/failover math — parameters need a practitioner pass (the operator) before launch.
- LLM provider and fallback chain for the narrative (existing pattern: DeepSeek primary, Claude Haiku fallback).
- i18n mechanism and how the narrative is generated in the selected language.
