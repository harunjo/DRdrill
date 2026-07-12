// Pure helpers for the Investment case lens (U6): order the asks and build the
// shareable plain-text summary. No i18n here — the component passes localized
// strings in, so the ordering and formatting stay unit-testable.

import { riskBoughtDown, type RiskBoughtDown } from "./exposure";
import type { CsfFunction, DeploymentModel, FlagCode, RiskFlag, WorkloadResult } from "./engine";
import { SECURITY_CONTROLS } from "./calibration";

export interface Ask {
  flag: RiskFlag;
  boughtDown: RiskBoughtDown;
}

// --- Group asks/flags by CSF function so a long list reads as a few sections
//     instead of a wall of cards. DR flags fall under "recover". ---

export type AskCategory = CsfFunction | "recover";

const GAP_FN = new Map<FlagCode, CsfFunction>();
for (const c of SECURITY_CONTROLS) if (c.gap) GAP_FN.set(c.gap.code, c.fn);

/** Which CSF function an ask/flag belongs to. DR recovery flags → "recover". */
export function askCategory(code: FlagCode): AskCategory {
  return GAP_FN.get(code) ?? "recover";
}

export const CSF_CATEGORY_ORDER: AskCategory[] = [
  "recover",
  "govern",
  "identify",
  "protect",
  "detect",
  "respond",
];

export interface FunctionGroup<T> {
  category: AskCategory;
  items: T[];
  hasCritical: boolean;
}

/** Bucket items by CSF function; critical-bearing groups first, then CSF order.
 *  Item order within a group is preserved (callers pass pre-sorted lists). */
export function groupByFunction<T>(
  items: T[],
  flagOf: (t: T) => Pick<RiskFlag, "code" | "severity">,
): FunctionGroup<T>[] {
  const byCat = new Map<AskCategory, T[]>();
  for (const it of items) {
    const cat = askCategory(flagOf(it).code);
    const arr = byCat.get(cat);
    if (arr) arr.push(it);
    else byCat.set(cat, [it]);
  }
  return [...byCat.entries()]
    .map(([category, group]) => ({
      category,
      items: group,
      hasCritical: group.some((x) => flagOf(x).severity === "critical"),
    }))
    .sort((a, b) =>
      a.hasCritical !== b.hasCritical
        ? a.hasCritical
          ? -1
          : 1
        : CSF_CATEGORY_ORDER.indexOf(a.category) - CSF_CATEGORY_ORDER.indexOf(b.category),
    );
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
