import type { PostureBand } from "@/lib/exposure";
import type { Dictionary } from "@/lib/i18n";

const TONE: Record<"ok" | "warn" | "crit", string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
};
const POSTURE_TONE: Record<PostureBand, "ok" | "warn" | "crit"> = {
  strong: "ok",
  developing: "warn",
  exposed: "crit",
};

/** The continuity posture pill shared by the Business impact and Investment
 *  case lens headers. */
export function PostureChip({ t, posture }: { t: Dictionary; posture: PostureBand }) {
  const tone = TONE[POSTURE_TONE[posture]];
  return (
    <span className="chip shrink-0" style={{ background: `${tone}18`, color: tone }}>
      {t.report.posture[posture]}
    </span>
  );
}
