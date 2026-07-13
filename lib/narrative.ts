// Narrative pipeline pieces shared by the API route and the client.
// Trust rules (origin R12, R20, R21):
//  - the server only ever sees pseudonymized labels (W1..Wn) — enforced by
//    schema validation here, independent of what the browser UI sends;
//  - the generated story is mechanically validated in the browser against the
//    findings payload before display; regenerate once, then redact.

import type { FindingsPayload } from "./engine";

export type Scenario = "ransomware" | "siteloss" | "outage" | "deletion";
export const SCENARIOS: Scenario[] = ["ransomware", "siteloss", "outage", "deletion"];

export interface NarrativeRequest {
  findings: FindingsPayload;
  scenario: Scenario;
  lang: "id" | "en";
}

const LABEL_RE = /^W\d{1,2}$/; // max 10 workloads — also caps label length (cost vector)
const MODELS = ["onprem", "cloud", "hybrid", "private"];
const TYPES = ["database", "vm", "files", "saas"];
const FLAG_CODES = [
  "no-immutable",
  "no-offsite",
  "single-site",
  "no-cross-region",
  "saas-shared-responsibility",
  "unprotected-workloads",
  // CSF Govern/Identify/Protect/Detect/Respond gaps (R7)
  "no-security-policy",
  "no-security-roles",
  "no-third-party-risk",
  "no-asset-inventory",
  "no-risk-assessment",
  "no-data-classification",
  "no-mfa",
  "no-patching",
  "no-least-privilege",
  "no-encryption",
  "no-siem",
  "no-central-logging",
  "no-endpoint-monitoring",
  "no-alerting",
  "no-vuln-scanning",
  "no-ir-plan",
  "no-isolation",
  "no-ir-ownership",
  "no-breach-notification",
];

// ponytail: hand-rolled strict validator instead of a schema library — the
// shape is small and fixed, and zero dependencies keeps the route auditable.
export function validateRequest(body: unknown): NarrativeRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (Object.keys(b).some((k) => !["findings", "scenario", "lang"].includes(k))) return null;
  if (!SCENARIOS.includes(b.scenario as Scenario)) return null;
  if (b.lang !== "id" && b.lang !== "en") return null;

  const f = b.findings as Record<string, unknown> | null;
  if (typeof f !== "object" || f === null) return null;
  if (
    Object.keys(f).some(
      (k) =>
        ![
          "model",
          "workloads",
          "flags",
          "rule321",
          "score",
          "govern",
          "identify",
          "protect",
          "detect",
          "respond",
        ].includes(k),
    )
  )
    return null;
  if (!MODELS.includes(f.model as string)) return null;
  if (typeof f.score !== "number" || f.score < 0 || f.score > 100) return null;

  // CSF function posture — optional; when present, score only (R10).
  for (const fnKey of ["govern", "identify", "protect", "detect", "respond"] as const) {
    if (!(fnKey in f)) continue;
    const fn = f[fnKey] as Record<string, unknown> | null;
    if (typeof fn !== "object" || fn === null) return null;
    if (Object.keys(fn).some((k) => k !== "score")) return null;
    if (typeof fn.score !== "number" || fn.score < 0 || fn.score > 100) return null;
  }

  const workloads = f.workloads;
  if (!Array.isArray(workloads) || workloads.length < 1 || workloads.length > 10) return null;
  for (const w of workloads) {
    if (typeof w !== "object" || w === null) return null;
    const ww = w as Record<string, unknown>;
    const keys = [
      "label",
      "type",
      "tier",
      "achievableRpoMin",
      "achievableRtoMin",
      "targetRpoMin",
      "targetRtoMin",
      "rpoMeets",
      "rtoMeets",
    ];
    if (Object.keys(ww).some((k) => !keys.includes(k))) return null;
    if (typeof ww.label !== "string" || !LABEL_RE.test(ww.label)) return null;
    if (!TYPES.includes(ww.type as string)) return null;
    if (![1, 2, 3].includes(ww.tier as number)) return null;
    for (const nk of ["targetRpoMin", "targetRtoMin"]) {
      const v = ww[nk];
      if (typeof v !== "number" || v < 0 || v > 1_000_000) return null;
    }
    for (const nk of ["achievableRpoMin", "achievableRtoMin"]) {
      const v = ww[nk];
      if (v !== null && (typeof v !== "number" || v < 0 || v > 1_000_000)) return null;
    }
    if (typeof ww.rpoMeets !== "boolean" || typeof ww.rtoMeets !== "boolean") return null;
  }

  const flags = f.flags;
  // Cost/DoS guard. A full CSF assessment (DR flags + Govern/Identify/Protect/
  // Detect/Respond gaps, per placement group) can legitimately reach the high
  // twenties, so the cap is generous.
  if (!Array.isArray(flags) || flags.length > 50) return null;
  for (const fl of flags) {
    if (typeof fl !== "object" || fl === null) return null;
    const ff = fl as Record<string, unknown>;
    if (Object.keys(ff).some((k) => !["code", "severity", "scope"].includes(k))) return null;
    if (!FLAG_CODES.includes(ff.code as string)) return null;
    if (ff.severity !== "critical" && ff.severity !== "warning") return null;
    if (!["onprem", "cloud", "all"].includes(ff.scope as string)) return null;
  }

  const r = f.rule321 as Record<string, unknown> | null;
  if (typeof r !== "object" || r === null) return null;
  if (Object.keys(r).some((k) => !["threeCopies", "twoMedia", "oneOffsite"].includes(k)))
    return null;
  for (const k of ["threeCopies", "twoMedia", "oneOffsite"])
    if (typeof r[k] !== "boolean") return null;

  return body as NarrativeRequest;
}

const SCENARIO_TEXT: Record<Scenario, { en: string; id: string }> = {
  ransomware: {
    en: "a ransomware attack encrypting production systems",
    id: "serangan ransomware yang mengenkripsi sistem produksi",
  },
  siteloss: {
    en: "a fire that destroys the primary site/data center",
    id: "kebakaran yang menghancurkan lokasi/data center utama",
  },
  outage: {
    en: "a full cloud region outage lasting many hours",
    id: "gangguan total satu region cloud selama berjam-jam",
  },
  deletion: {
    en: "an accidental mass deletion by an administrator",
    id: "penghapusan massal yang tidak disengaja oleh administrator",
  },
};

export function buildPrompt(req: NarrativeRequest): string {
  const lines = req.findings.workloads.map(
    (w) =>
      `${w.label}: type=${w.type}, tier=${w.tier}, achievable RPO=${w.achievableRpoMin ?? "UNRECOVERABLE"} min, achievable RTO=${w.achievableRtoMin ?? "UNRECOVERABLE"} min, target RPO=${w.targetRpoMin} min, target RTO=${w.targetRtoMin} min`,
  );
  const flags = req.findings.flags.map((f) => `${f.code} (${f.severity}, ${f.scope})`);
  const langName = req.lang === "id" ? "Indonesian (Bahasa Indonesia)" : "English";

  // CSF posture given as qualitative bands only — never numbers (R9/R11).
  const band = (s: number) => (s >= 70 ? "strong" : s >= 40 ? "developing" : "weak");
  const CSF_LABEL: Record<"govern" | "identify" | "protect" | "detect" | "respond", string> = {
    govern: "Governance (Govern)",
    identify: "Asset/risk identification (Identify)",
    protect: "Safeguards (Protect)",
    detect: "Detection (Detect)",
    respond: "Response (Respond)",
  };
  const secFns = ["govern", "identify", "protect", "detect", "respond"] as const;
  const security = secFns.some((f) => req.findings[f])
    ? secFns.map(
        (f) =>
          `${CSF_LABEL[f]} posture: ${req.findings[f] ? band(req.findings[f]!.score) : "not assessed"}`,
      )
    : [];

  return [
    `Write a short business-continuity drill story, written ENTIRELY in ${langName}: ${SCENARIO_TEXT[req.scenario][req.lang]} hits tonight.`,
    ``,
    `FACTS (the only facts that exist — computed findings):`,
    `Deployment model: ${req.findings.model}`,
    ...lines,
    `Risk flags: ${flags.join("; ") || "none"}`,
    `Readiness score: ${req.findings.score}/100`,
    ...security,
    ``,
    `RULES:`,
    `- LANGUAGE (most important): these instructions are in English, but your entire output — every beat, every word — MUST be written in ${langName}. Do not mix in another language.`,
    `- Output 6 to 10 beats, one per line, each starting with a clock time like "02:14 — ".`,
    `- Refer to workloads ONLY by their labels (W1, W2, ...). Never invent system names.`,
    `- Every duration or quantity you mention MUST come from the facts above (you may convert minutes to hours). Do not invent any number except the clock times.`,
    `- Show elapsed time and the duration of the disaster itself ONLY by advancing the clock-time prefixes (e.g. move from 02:14 to 09:30). NEVER write the outage/incident length as a bare number of hours, minutes, or days unless that exact figure is one of the RPO/RTO facts above — say "still down by 09:30", not "a 7-hour outage".`,
    `- Describe detection and response posture qualitatively (e.g. "weak", "undetected", "slow to contain"); never state a maturity score or invent a duration for it.`,
    `- For a cyber-attack scenario with weak detection or response, you may narrate the intruder operating undetected and spreading before recovery begins — kept qualitative per the rule above — then let recovery unfold per the RPO/RTO facts.`,
    `- Do not name any product, vendor, or tool.`,
    `- Do not introduce any fact, system, person, or outcome not derivable from the facts above.`,
    // "condition", not "state" — models writing Indonesian mistranslated
    // "state" as "negara" (the country kind) in the closing beat's heading.
    `- Tone: sober incident log, addressed to management; end with the condition of the business at the end of the timeline (in Indonesian: "kondisi bisnis"). Do not add headings.`,
    `- Output only the beats, no title, no preamble.`,
    ``,
    `Now write the timeline, entirely in ${langName}:`,
  ].join("\n");
}

// --- Client-side output validation (R20) ---

/** Allowed numeric tokens derived from the findings. Clock-time prefixes
 *  ("02:14 — ") are narrative structure and exempt; every other number in the
 *  story must appear in this set (minutes and their hour/day conversions). */
export function allowedNumbers(findings: FindingsPayload): Set<string> {
  const allowed = new Set<string>(["1", "2", "3"]); // tiers, 3-2-1 phrasing
  allowed.add(String(findings.score));
  allowed.add("100");
  allowed.add(String(findings.workloads.length));
  const addMinutes = (min: number | null) => {
    if (min === null) return;
    allowed.add(String(min));
    const hours = min / 60;
    for (const h of [Math.floor(hours), Math.ceil(hours), Math.round(hours * 10) / 10])
      if (h > 0) allowed.add(String(h));
    const days = Math.round((min / 1440) * 10) / 10;
    if (days >= 1) {
      allowed.add(String(days));
      allowed.add(String(Math.round(days)));
    }
  };
  for (const w of findings.workloads) {
    addMinutes(w.achievableRpoMin);
    addMinutes(w.achievableRtoMin);
    addMinutes(w.targetRpoMin);
    addMinutes(w.targetRtoMin);
  }
  return allowed;
}

export interface NarrativeValidation {
  ok: boolean;
  offending: string[];
}

export function validateNarrative(
  text: string,
  findings: FindingsPayload,
): NarrativeValidation {
  const validLabels = new Set(findings.workloads.map((w) => w.label));
  const allowed = allowedNumbers(findings);
  const offending: string[] = [];

  // Strip clock-time beat prefixes before checking.
  const stripped = text
    .split("\n")
    .map((line) => line.replace(/^\s*\d{1,2}[:.]\d{2}\s*[—\-–]\s*/, ""))
    .join("\n");

  for (const m of stripped.matchAll(/W(\d+)/g)) {
    if (!validLabels.has(m[0])) offending.push(m[0]);
  }

  // Number scan runs on text with labels removed (W4's "4" is not a number
  // claim) and inline clock times removed (the prompt permits clock times
  // anywhere; "by 06:30 the restore completes" is narrative structure).
  const numScan = stripped
    .replace(/W\d+/g, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, "");
  for (const m of numScan.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const tok = m[0].replace(",", ".");
    const normalized = String(Number(tok));
    if (!allowed.has(tok) && !allowed.has(normalized)) offending.push(tok);
  }

  return { ok: offending.length === 0, offending };
}

/** Browser-side re-substitution of real names into the validated story. */
export function substituteLabels(text: string, labelMap: Record<string, string>): string {
  return text.replace(/W\d+/g, (label) => {
    const name = labelMap[label];
    return name ? `${name} (${label})` : label;
  });
}
