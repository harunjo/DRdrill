# Launch checklist (gates — do not announce before these pass)

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
