# DR Drill — UI Design System

**Direction:** Audit Stamp — the assessment as a document, not a dashboard.
**Status:** Current (supersedes the earlier dark-console and light-SaaS explorations).
**Last updated:** 2026-07-08

---

## Concept

DR Drill produces a **business-continuity assessment**. The design leans into that:
the page reads like a headed audit report on ivory paper, not an ops dashboard.
The single memorable element is the readiness verdict rendered as a **rotated
rubber ink-stamp** ("AT RISK" / "BERISIKO") struck onto the sheet.

This encodes the product thesis directly: **deterministic code decides what is
true; color appears only where the engine computed a verdict.** The chrome is
monochrome ink — the only color anywhere on the page is the stamp and the
RPO/RTO gap bars.

## Palette

All tokens live in `app/globals.css` under `@theme`.

| Token | Hex | Role |
|-------|-----|------|
| `--color-ink` | `#f4f1e9` | Page (ivory paper) |
| `--color-panel` | `#fbfaf6` | Card / "sheet" surface |
| `--color-well` | `#f1ede2` | Inset well, tracks, chips |
| `--color-line` | `#ddd7c8` | Warm hairline rule / border |
| `--color-line-soft` | `#e8e3d6` | Faint inner divider |
| `--color-text` | `#1f1c16` | Warm near-black ink (also the accent) |
| `--color-muted` | `#6b6456` | Secondary text |
| `--color-faint` | `#9a927f` | Labels, captions, meta |
| `--color-signal` | `#1f1c16` | Chrome accent = ink (monochrome) |
| `--color-signal-soft` | `#ece7da` | Selected-state tint |

**Verdict colors** — the only hues on the page, always paired with a text label
(never color alone, per accessibility floor):

| Token | Hex | Meaning |
|-------|-----|---------|
| `--color-ok` / `-soft` | `#2f7a43` / `#e6efe4` | Ready / within target / pass |
| `--color-warn` / `-soft` | `#97680f` / `#f4ecd6` | Needs attention / warning |
| `--color-crit` / `-soft` | `#b0392c` / `#f4e3df` | At risk / overrun / critical |

## Typography

| Role | Family | Usage |
|------|--------|-------|
| Display | **Newsreader** (serif) | Masthead, headline, section & panel titles, score number, stamp |
| Body / UI | **Geist Sans** | Body copy, form controls, buttons |
| Data | **Geist Mono** | Times, W-labels, captions, `drill://`, finding numbers |

Loaded in `app/layout.tsx` as CSS variables (`--font-serif`, `--font-sans`,
`--font-mono`); `--font-display` maps to the serif in `@theme`.
Serif weights capped at 600; hierarchy comes from size and the serif/sans
contrast, not heavy weights.

## Layout & structure

- **Letterhead masthead** — serif wordmark + small-caps subtitle
  (`t.masthead`), closed by a classic `3px double` bottom rule. Language
  toggle top-right.
- **Serif headline** — the thesis (`t.tagline`), ~2.6rem.
- **Trust note** — left-ruled well, small print; states data never leaves the
  browser.
- **Intake** — three "sheet" cards titled with **roman numerals** (I / II / III),
  a ruled divider under each title. Selected states: ink border + `signal-soft`
  tint. Radius `3px` throughout (crisp document, not rounded app).
- **Report** — four screenshot-self-contained panels (R10), each with a serif
  title, a mono `DR DRILL` caption, and a ruled divider:
  1. **Recovery readiness** — big serif score in the verdict color, `/100`,
     the rotated **stamp** to the right, a banded meter with 40/70 threshold
     ticks, then the 3-2-1 chips.
  2. **RPO/RTO gap table** — legend + per-workload **overrun bars** (green fill
     to target, red overrun to reality, a tick at target). This is the retained
     signature from earlier iterations.
  3. **Risk flags** — numbered findings (`01`, `02`…), each led by a severity
     chip (Critical / Attention) then the business-framed detail.
  4. **Disaster drill** — scenario chips + a mono readout framed as a quoted
     incident appendix (left ink rule).

## Signature: the verdict stamp

`.stamp` in `app/globals.css`: a `rotate(-5deg)` bordered box with an inset
ring (double-line rubber-stamp look), `mix-blend-mode: multiply` to sink the ink
into the paper, colored inline to the verdict band. Same color as the score.

## Component classes (globals.css)

- `.panel` — white sheet, warm hairline, `4px` radius, faint shadow.
- `.rule` — 1px ruled divider (under titles).
- `.field` — white input, ink focus ring.
- `.btn-primary` — ink button, ivory text ("stamp of a button").
- `.chip` / `.chip-ok|warn|crit|neutral` — tinted status labels.
- `.stamp` — the verdict rubber stamp.

## Rules & guardrails

- **Monochrome chrome, verdict-only color.** Do not introduce a brand accent
  hue; a colored accent read as an AI-generated default in review. Any new
  color must be a data verdict and carry a text label.
- **i18n intact.** All UI strings come from `lib/locales/{en,id}.ts`; the two
  dictionaries must stay structurally identical (`typeof en`). New copy this
  design added: `masthead`, `report.statusLabel`, `report.severity`,
  `report.legend`.
- **Presentation only.** This system never touches `lib/engine.ts`,
  `lib/narrative.ts`, or the trust boundary — restyling must not change what
  leaves the browser or how stories are validated.
- **Accessibility floor.** 4.5:1 text contrast; color never the sole signal
  (chips and bars always carry labels); focus-visible ink outline; reduced
  motion respected.

## History

Four explorations preceded this: amber ops-console, refined console, Linear
dark, monochrome dark, then light compliance-SaaS. All rejected. Audit Stamp
was chosen from a written three-plan pitch (A: Audit Stamp, B: Enterprise Grid,
C: Advisory Memo). Design decisions now go through a written plan before code.
