// Pure helpers for the Investment case lens (U6): order the asks and build the
// shareable plain-text summary. No i18n here — the component passes localized
// strings in, so the ordering and formatting stay unit-testable.

import { riskBoughtDown, type RiskBoughtDown } from "./exposure";
import type { DeploymentModel, RiskFlag, WorkloadResult } from "./engine";

export interface Ask {
  flag: RiskFlag;
  boughtDown: RiskBoughtDown;
}

const KIND_RANK: Record<RiskBoughtDown["kind"], number> = {
  catastrophic: 0,
  loss: 1,
  posture: 2,
};

/** Highest-priority ask first: critical before warning, then catastrophic →
 *  loss → posture, then larger exposure/impact first. */
export function orderAsks(
  flags: RiskFlag[],
  results: WorkloadResult[],
  model: DeploymentModel,
): Ask[] {
  return flags
    .map((flag) => ({ flag, boughtDown: riskBoughtDown(flag, results, model) }))
    .sort((a, b) => {
      const sev =
        (a.flag.severity === "critical" ? 0 : 1) - (b.flag.severity === "critical" ? 0 : 1);
      if (sev !== 0) return sev;
      const kind = KIND_RANK[a.boughtDown.kind] - KIND_RANK[b.boughtDown.kind];
      if (kind !== 0) return kind;
      return (b.boughtDown.amount ?? 0) - (a.boughtDown.amount ?? 0);
    });
}

/** Assemble the board-ready talking-points block for copy/share. */
export function buildSummary(parts: {
  title: string;
  exposure: string;
  posture: string;
  asks: string[];
  coverage: string;
}): string {
  return [
    parts.title,
    "",
    parts.exposure,
    parts.posture,
    "",
    ...parts.asks.map((a, i) => `${i + 1}. ${a}`),
    "",
    parts.coverage,
  ].join("\n");
}
