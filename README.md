# DR Drill — drdrill.harunjonatan.com

A free, bilingual (Indonesian/English) business-continuity readiness tool.
Describe your environment — on-premise, full cloud, hybrid, or private cloud —
and get a four-part report: readiness score, RPO/RTO gap table, risk flags,
and an AI-narrated disaster drill story.

Built by Harun Jonatan · [harunjonatan.com](https://harunjonatan.com)

## Architecture (trust model)

- **Deterministic engine, browser-only** (`lib/engine.ts`): every number is
  computed client-side. Environment details never leave the browser.
- **Pseudonymized narrative** (`lib/narrative.ts`, `app/api/narrative/route.ts`):
  the LLM receives only anonymized findings (labels `W1..Wn`); the browser
  re-substitutes real names after mechanically validating the story — every
  number and label in the story must exist in the findings, or it is
  regenerated once and then withheld.
- **Server guards**: strict schema validation, per-IP rate limit (in-memory,
  best-effort — `lib/ratelimit.ts`), provider chain Claude Haiku → DeepSeek.
- **No persistent storage**: no accounts, no sessions, no database. The only
  server-side state is a best-effort in-memory per-IP rate-limit counter (held
  transiently on the warm function instance) plus anonymous aggregate usage
  counts (Vercel Web Analytics).

Docs: `docs/brainstorms/` (requirements) and `docs/plans/` (implementation plan).

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest — engine + narrative validation suites
npm run build
```

Copy `.env.example` to `.env.local` and fill in keys. Without LLM keys the
assessment works fully; the drill section degrades gracefully.

## Deployment

- Vercel project (team: harunkerja), production branch `master`.
- Domain: `drdrill.harunjonatan.com` — add as a custom domain on the Vercel
  project; Vercel provides the CNAME to add to harunjonatan.com's DNS.
- Environment variables (Vercel project settings): see `.env.example`.
- Rate limiting is in-memory (`lib/ratelimit.ts`) — no external store to
  provision. It throttles per-IP on a warm Fluid Compute instance (best-effort,
  not shared across instances); the hard cost ceiling is the provider spend cap
  + `max_tokens`.

## Launch checklist (gates — do not announce before these pass)

- [ ] **Calibration pass (operator):** review every constant in
      `lib/calibration.ts` against field experience; adjust and commit.
- [ ] **Provider retention terms verified (R22):** confirm Anthropic API
      no-training/retention terms; confirm DeepSeek terms — if DeepSeek does
      not meet the bar, remove it as fallback (Haiku-only) and update the
      privacy copy. Record the verification date here: ____
- [ ] **Custom-events tier check:** confirm the Vercel plan supports Web
      Analytics custom events (`assessment_completed`, `narrative_generated`,
      `scenario_swapped`). If not, page views alone are the demand signal.
- [ ] **Both locales spot-checked** end to end (intake → report → drill), on a
      phone-width viewport.
- [ ] **Drill validated in ID and EN** for a sample environment; confirm the
      story never contains a number or name outside the findings.
- [ ] **Demand gate written down:** threshold = ____ completed assessments
      within ____ weeks of the launch posts; review date = ____. If unmet,
      revisit before investing in v2 (see requirements doc).
