# Handoff: DR Drill — estimator, privacy copy, in-memory limiter, narrative language, currency-by-language, C-level PDF

## Session Metadata
- Created: 2026-07-09 03:11:16
- Project: D:\Documents\web\DR
- Branch: master (local branch feat/dr-drill-v1 was fast-forwarded into master; work is pushed to origin/master, which auto-deploys)
- Deployed: drdrill.harunjonatan.com (Vercel team "harunkerja-9172's projects", project name `drdrill`; pushes to `master` auto-deploy)
- Session duration: ~single long session

### Recent Commits (newest first — all pushed to origin/master)
- 5f2928b feat(invest): C-level PDF justification via native print
- b4e1134 feat(report): show business loss in USD (EN) / IDR (ID)
- 7ab0bf4 fix(narrative): enforce output language, stop flipping to English
- 246063c feat(narrative): in-memory rate limiter, drop Upstash dependency
- a199849 copy(privacy): stop overclaiming zero-egress; scope to what's true
- 5731beb copy(share): stronger privacy line, credit harunjonatan.com
- 502fbc7 fix(intake): estimator asks for monthly salary, not hourly cost
- ebdf510 feat(intake): educational downtime-cost estimator (U2)

## Handoff Chain
- **Continues from**: None (fresh start)
- **Supersedes**: None

## Current State Summary

DR Drill is a bilingual (ID default / EN) browser-only business-continuity readiness tool at drdrill.harunjonatan.com. This session shipped six things end-to-end, all committed, pushed, built, and (where server-side) verified against the live endpoint: (1) an educational downtime-cost estimator in intake; (2) honesty fixes to the privacy copy; (3) replaced the Upstash rate limiter with an in-memory one (this fixed the drill returning "unavailable"); (4) fixed the drill narrative intermittently coming back in English when set to Indonesian; (5) business loss now displays in USD in English mode / IDR in Indonesian mode; (6) a "Download PDF" C-level investment justification via native `window.print()`. Everything is green (tsc, 72 tests, `npm run build`). Nothing is mid-edit. Remaining items are user-side actions (revoke a shared token, set a spend cap, eyeball the PDF on paper) and stale docs.

## Codebase Understanding

### Architecture Overview
Two rules govern almost everything (see AGENTS.md / the stale CLAUDE.md):
1. **Trust boundary** — the ONLY structure allowed to leave the browser is `FindingsPayload` (`lib/engine.ts`), which names workloads only as `W1..Wn`. Real names/sizes/costs never leave. `assess()` returns a browser-only report view + the payload; `validateRequest()` re-checks server-side. **Never add PII (names, `costPerHourDowntime`, free text) to FindingsPayload.**
2. **Deterministic engine** — every number comes from pure fns in `lib/engine.ts` + constants in `lib/calibration.ts`. The LLM only retells; `validateNarrative()` (client-side) rejects any number not derivable from the findings.

The drill (`/api/narrative`) is the ONLY server route and the only thing that calls an AI provider. Report/assessment is 100% client-side.

### Critical Files
| File | Purpose | Relevance |
|------|---------|-----------|
| lib/engine.ts | Pure BC/DR math + FindingsPayload (trust boundary), all types | Core |
| lib/calibration.ts | ALL tunable constants incl. new `IDR_PER_USD = 16000` | Money/tuning |
| lib/exposure.ts | Browser-only money model; new `formatMoney(amountIDR, currency)` + `Currency`; `formatIDR` delegates to it | Currency |
| lib/costfill.ts | Intake cost helpers; new `estimateDowntimeCost` (BIA: staff×salary/176 + revenue) | Estimator |
| lib/ratelimit.ts | NEW pure in-memory per-IP limiter (replaced Upstash) | Rate limit |
| lib/narrative.ts | Shared validate/buildPrompt/validateNarrative; `buildPrompt` language directive strengthened | Drill |
| app/api/narrative/route.ts | The only server route; now uses in-memory `hits` Map limiter | Drill/limits |
| components/intake.tsx | 3-step wizard; quick-fill + collapsible estimator calculator | Intake |
| components/lenses/business-lens.tsx | Uses `formatMoney(_, t.currency)` | Currency |
| components/lenses/investment-lens.tsx | `formatMoney`; NEW Download PDF button + `.print-root` one-pager | PDF |
| lib/locales/en.ts | Defines `Dictionary` type (`typeof en`); new `currency`, `invest.pdf`, estimator keys | i18n |
| lib/locales/id.ts | Must mirror en.ts exactly (typed `: Dictionary`) | i18n |
| app/globals.css | NEW print rules (`.print-root` print-one-element pattern, `@page` margins) | PDF |

### Key Patterns Discovered
- **i18n**: `en.ts` DEFINES the `Dictionary` type via `typeof en`. `id.ts` is typed `: Dictionary` and must mirror it. **Add every new key to BOTH files** or the build breaks. Use `fmt(template, {name})` for `{name}` placeholders. ID is default.
- **Testable logic lives in `lib/` as pure functions**, colocated `*.test.ts` (vitest). Validators are hand-rolled (no schema libs) to keep the paid route auditable. Follow this: `ratelimit.ts` takes an injected store+clock so it's testable; the route owns the module-level Map.
- **`ponytail:` comments** mark deliberate simplifications with their ceiling/upgrade path.
- Next.js 16 / React 19 — AGENTS.md says read `node_modules/next/dist/docs/` before writing Next code (breaking changes vs training data).

## Work Completed

### Tasks Finished
- [x] Educational downtime-cost estimator (`estimateDowntimeCost`) + collapsible calculator in intake; asks monthly salary (÷176 work-hours) not hourly; example placeholders; softened "rough number beats none" copy.
- [x] Privacy copy honesty pass: `trustIndicator` and `preparedBy` no longer claim zero-egress ("names never leave your browser" + "drill sends anonymized findings only"). `privacyLine` was already honest.
- [x] Diagnosed drill "Cerita simulasi tidak tersedia" → HTTP 429 (Upstash fail-closed, no UPSTASH_* env). Replaced with in-memory limiter (`lib/ratelimit.ts`), verified live 200.
- [x] Fixed narrative language flipping to English on `lang=id` — strengthened `buildPrompt` (language stated at top, as first rule, and closing line). Verified 4/4 Indonesian live.
- [x] Currency by language: USD in EN, IDR in ID, across Business + Investment lenses. Value stored in IDR; only display converts.
- [x] C-level PDF: Download PDF button → native print of a `.print-root` one-pager (title, business loss at risk, posture, prioritized investments + what each protects). Zero dependency, no egress.
- [x] Wrote CLAUDE.md (user later said "ignore claude.md" re commit hygiene; it is now stale re Upstash — see gotchas).

### Files Modified
See Critical Files table. All changes committed in the 8 commits listed above and pushed to origin/master.

### Decisions Made
| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| In-memory rate limiter over Upstash | Upstash pay-as-you-go; fail-open; in-memory | User rejected Redis signup friction; Fluid Compute reuses warm instances so a module-level counter throttles bursts; always-active so can't fail-closed(429) or ship an unlimited endpoint; cost backstopped by provider spend cap + max_tokens. Ceiling: not shared across all instances (documented `ponytail:`). |
| PDF via `window.print()` not a PDF lib | jsPDF/react-pdf; server render | Zero dependency, native "Save as PDF", and critically NO data egress (consistent with privacy promise). |
| Store money in IDR, convert only for display | store per-currency; ask currency in intake | Single source of truth; intake stays the Rp input aid; English readers (C-level) see USD. FX rate is a fixed calibration constant that drifts. |
| Estimator asks monthly salary ÷176 | hourly cost; annual | Managers know rough monthly salary + headcount, not loaded hourly cost. |

## Pending Work

## Immediate Next Steps
1. **USER: Revoke the temporary Vercel token** that was pasted into the chat this session (Vercel → Account Settings → Tokens → delete). It is exposed and must be treated as burned. (Value intentionally NOT recorded here.)
2. **USER: Set an Anthropic spend cap** (Console → monthly limit). This is now the primary cost backstop since the per-IP Redis limiter was replaced by a best-effort in-memory one.
3. **USER: Eyeball the Download PDF on paper** (Investment lens → Download PDF → Save as PDF). Print layout is the one thing not verifiable headless.

### Blockers/Open Questions
- [ ] README R22 launch-gate checkbox is still unchecked: verify Anthropic + DeepSeek no-training/retention terms; if DeepSeek doesn't meet the bar, drop it as fallback (Haiku-only) and state what was verified in the privacy copy.

### Deferred Items
- Per-tier / sector-benchmark presets for the estimator (only "same for all" is wired from the estimator).
- Live FX feed for IDR→USD (fixed `IDR_PER_USD` constant for now).
- Template-based (LLM-free) drill for absolute zero-egress — discussed as option 3; not built (drill AI quality kept).

## Context for Resuming Agent

## Important Context
- **Auto-deploy**: pushing to `master` deploys to drdrill.harunjonatan.com. Verify server-side changes by curling `POST https://drdrill.harunjonatan.com/api/narrative` (valid FindingsPayload body; see narrative.test.ts fixture for shape). A cold first request returns 200 now (was 429 pre-fix).
- **Rate limit is in-memory now** — there is NO Upstash. Do not "restore fail-closed" or reintroduce UPSTASH_* without discussing; that regression caused the original outage.
- **Provider order is intentional (R22)**: Anthropic Haiku primary, DeepSeek fallback — reversed from the operator's usual DeepSeek-primary, because Anthropic's no-training default satisfies the privacy bar. Don't "optimize" DeepSeek to primary for cost.

### Assumptions Made
- Fluid Compute keeps module-level state alive across requests on a warm instance (per Vercel platform knowledge). In-memory limiter relies on this for best-effort throttling.
- `IDR_PER_USD = 16000` is a rough 2026 rate, acceptable for a display estimate.

### Potential Gotchas
- **README.md and CLAUDE.md are now STALE re Upstash** — both still describe the Upstash/fail-closed rate limiter. The code is in-memory (`lib/ratelimit.ts`). User said "ignore claude.md" (commit-hygiene context), so it was left; update if asked. README's env/architecture section likewise needs a pass.
- CLAUDE.md was committed under a privacy-copy commit message (a199849) — user chose to leave it.
- Adding a locale key to only one of en.ts/id.ts breaks the build (Dictionary mismatch).
- `.env.example` no longer lists UPSTASH_* (removed). Vercel project `drdrill` env has only ANTHROPIC_API_KEY + DEEPSEEK_API_KEY (confirmed via API this session).
- Print CSS uses the visibility "print-one-element" trick; the `.print-root` is rendered as a sibling OUTSIDE the on-screen `<section>` to avoid overflow/positioning clipping.

## Environment State

### Tools/Services Used
- Vercel (project `drdrill`, team harunkerja-9172). Vercel CLI NOT installed locally; used the REST API with a temporary token (now to be revoked).
- Providers: Anthropic (Haiku primary) + DeepSeek (fallback) — both keys live in Vercel prod.

### Active Processes
- None. No long-running local server. Two background verification curls this session already completed.

### Environment Variables (names only)
- ANTHROPIC_API_KEY, ANTHROPIC_MODEL (default claude-haiku-4-5-20251001)
- DEEPSEEK_API_KEY, DEEPSEEK_MODEL (default deepseek-v4-flash)
- (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — REMOVED, no longer used)

## Related Resources
- docs/brainstorms/2026-07-08-dr-drill-simulator-requirements.md (R-numbers incl. R22)
- docs/plans/2026-07-08-001-feat-dr-drill-simulator-v1-plan.md
- README.md (deployment + R22 launch gate — needs Upstash update)
- AGENTS.md / CLAUDE.md (project rules; CLAUDE.md stale re Upstash)

---

**Security Reminder**: The temporary Vercel token shared in chat must be revoked. Its value is deliberately excluded from this document.
