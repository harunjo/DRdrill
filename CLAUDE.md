@AGENTS.md

# DR Drill

A browser-only **business-continuity / disaster-recovery readiness self-assessment** with an AI-generated incident "drill" story. Bilingual, Indonesian market (ID is the default language, EN secondary). Next.js 16 App Router, React 19, Tailwind v4. Deployed on Vercel.

The user describes their environment (deployment model, workloads, backup/replication posture); a **deterministic engine** computes achievable RPO/RTO, risk flags, a 3-2-1 check, and a readiness score; the report presents it through four lenses; an optional AI drill retells the findings as a timed incident timeline.

## The two rules that govern everything

Almost every design decision traces to one of these. Comments cite requirement IDs (`R8`, `R12`, `R20`, …) — those are traceability tags back to `docs/brainstorms/` and `docs/plans/`.

### 1. Trust boundary — real names never leave the browser
The **only** structure allowed to leave the browser is `FindingsPayload` (`lib/engine.ts`), which identifies workloads solely by pseudonymized labels `W1..Wn`. Real workload names, sizes, and costs stay client-side.

- `assess()` returns both a report view (real names, browser-only) and the `FindingsPayload`. Only the payload is sent to `/api/narrative`.
- The server re-validates with `validateRequest()` (`lib/narrative.ts`) and rejects anything with unknown keys or non-`W\d+` labels — it never trusts the client to have stripped names.
- The browser re-substitutes real names into the validated story via `substituteLabels()` after generation.
- **Never add a field to `FindingsPayload` that could carry PII** (names, `costPerHourDowntime`, free text). Money/exposure lives in browser-only derivations (`lib/exposure.ts`), never in the payload.

### 2. Deterministic engine — the LLM retells, it never computes
Every number shown to the user comes from the pure functions in `lib/engine.ts` using constants in `lib/calibration.ts`. The LLM narrative layer only re-narrates computed findings.

- The drill prompt (`buildPrompt`) forbids inventing any number except clock times.
- `validateNarrative()` mechanically scans the returned story client-side and rejects any number not derivable from the findings (with minute→hour/day conversions allowed). On failure: regenerate once, then redact. This is why a wrong LLM number can never reach the screen.
- **Don't move any RPO/RTO/score math into the prompt or the model.** Add it to `engine.ts` and let the narrative reference it.

## Layout

```
lib/
  engine.ts        Pure BC/DR math + FindingsPayload (the trust boundary). Types live here.
  calibration.ts   EVERY tunable constant (tier targets, restore throughput, overheads).
                   One file so an operator reviews all assumptions in one pass. Put magic numbers here.
  exposure.ts      Browser-only money model (downtime exposure, posture band). Never enters FindingsPayload.
  costfill.ts      Intake cost helpers: quick-fill + estimateDowntimeCost() (BIA estimator).
  investment.ts    Browser-only "risk bought down" per fix (never prices a fix).
  heatmap.ts       Impact/likelihood placement for the heatmap.
  narrative.ts     Shared by client + API route: validateRequest, buildPrompt, validateNarrative, substituteLabels.
  i18n.ts          fmt() placeholder filler; dictionaries map.
  locales/         en.ts (defines the Dictionary type) + id.ts (must match its shape).
components/
  intake.tsx       3-step wizard (model → workloads → protection).
  report.tsx       Lens container + selector.
  lenses/          business-, technical-, investment-lens + shared.tsx.
  drill.tsx        Client drill: scenario picker, budget, generate/validate/degrade state machine.
  heatmap.tsx
app/
  page.tsx         Single-page flow: intake ⇄ report. Holds Environment + Assessment state.
  api/narrative/route.ts   The ONLY server route. Rate-limit → validate → provider chain.
```

Tests are colocated `*.test.ts` (vitest). Validators are hand-rolled, not schema libraries — the shapes are small and fixed, and zero deps keeps the paid route auditable (a ponytail call).

## Commands

```
npm run dev      # next dev
npm run build    # next build
npm test         # vitest run
npm run lint     # eslint
```

## The drill (AI narrative) — env-gated, degrades gracefully

`/api/narrative` is the only server route and the only thing that calls an AI provider. It needs env vars; without them it fails and the drill shows an "unavailable"/"cap" notice **while the deterministic report above stays fully intact** (by design).

- `ANTHROPIC_API_KEY` (primary, Haiku) or `DEEPSEEK_API_KEY` (fallback). No key → route returns 502.
- Per-IP rate limiting is **in-memory** (`lib/ratelimit.ts`): a module-level `Map` in the route, which Fluid Compute keeps alive across requests on a warm instance. Always active, no env vars. It's a best-effort throttle (`ponytail:` — not shared across all instances); the real cost backstop is the provider spend cap + `max_tokens`. There is **no Upstash/Redis** — don't reintroduce it or "restore fail-closed" without discussing; the old fail-closed limiter caused the drill to 429 with no env set.
- Copy `.env.example` → `.env.local` for local work; only the provider key is required in dev.
- Client budget: `SESSION_BUDGET` generations per page session (`drill.tsx`), one story cached per `(scenario, lang)`.

## i18n

Two dictionaries. `en.ts` **defines** the `Dictionary` type; `id.ts` must satisfy the same shape — **add keys to both** or the build breaks. ID is the default. Use `fmt(template, vars)` for `{name}` placeholders. UI copy targets a natural Indonesian register (English tech terms like RPO/RTO/cloud kept as-is).
