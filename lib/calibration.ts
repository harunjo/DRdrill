// Calibration constants — every number the engine uses lives here so the
// operator's practitioner pass (launch gate, see README) reviews one file.
// Sources noted per constant; adjust from field experience, not marketing.

import type { SecurityControl, Tier } from "./engine";

// Industry-typical tier targets (minutes). Source: common BC tiering used in
// enterprise DR programs (Tier-1 mission critical ≈ minutes, Tier-2 hours,
// Tier-3 next-business-day).
export const TIER_TARGETS: Record<Tier, { rpoMin: number; rtoMin: number }> = {
  1: { rpoMin: 15, rtoMin: 60 },
  2: { rpoMin: 240, rtoMin: 480 },
  3: { rpoMin: 1440, rtoMin: 2880 },
};

// On-prem restore throughput (GB/h), conservative disk-based backup restore
// including catalog/mount time amortized separately below.
export const RESTORE_GBPH = 400;

// Cloud snapshot restore is typically faster (managed storage, no media
// handling) but not instant; conservative figure.
export const CLOUD_RESTORE_GBPH = 800;

// Fixed overhead before any restore starts: locate copy, mount, verify.
export const RESTORE_OVERHEAD_MIN = 30;

// Failover to a warm replica (either direction): detection + DNS/redirect +
// verification. Not zero — nobody fails over in seconds outside a demo.
export const REPLICA_FAILOVER_MIN = 60;

// Display FX rate: the English report shows business loss in USD (the ID report
// keeps IDR). ponytail: fixed rate — it drifts; wire to a live FX feed only if
// finance ever needs report-grade precision. Rough 2026 IDR per 1 USD.
export const IDR_PER_USD = 16_000;

// Annualized loss expectancy (R14). ALE = per-incident exposure (SLE) ×
// annualized rate of occurrence (ARO, events/year). Weak posture is modeled as
// more exposed: each unresolved critical gap raises the rate, capped so the
// figure never implies near-certainty. ponytail: sector-neutral base rate — an
// operator with real incident history should tune it, same standing as
// TIER_TARGETS.
export const ARO_BASE = 0.15; // baseline ~once every ~7 years
export const ARO_PER_CRITICAL_FLAG = 0.1; // each critical gap adds to the rate
export const ARO_MAX = 0.6; // cap — never claim near-certainty

// NIST CSF 2.0 Detect/Respond controls (R4, R5). Per-environment maturity
// signals: `weight` drives the function's 0–100 score, `depth` gates the
// generalist (core) vs advanced intake (R18), and `gap` (when present) means an
// absent control raises an investment flag of that severity.
//
// Calibration rationale (weights 1–3, higher = more load-bearing for maturity):
//   Detect — "can the org SEE an attack unfold?"
//     3  centralLogging   — the substrate; without it nothing can be detected or investigated
//     3  siem             — correlation that turns raw logs into an actual detection
//     3  endpointMonitoring (EDR) — endpoints are where modern ransomware/malware lands first
//     2  alerting         — detection no one is paged on is just after-the-fact history
//     2  vulnScanning     — finds the exposed doors before an attacker does
//     1  networkMonitoring — useful corroboration, secondary to the above (advanced)
//   Respond — "can the org CONTAIN and recover?"
//     3  irPlan           — improvising a live incident burns the hours that matter
//     3  isolation        — containment is what stops one host becoming the whole estate
//     2  irOwnership      — a plan with no named owner sits in a drawer during the crisis
//     1  breachNotification — regulatory/comms; adds penalties but doesn't cut technical impact
//     1  playbooks        — makes response faster/repeatable (advanced)
//     1  tabletop         — validates the above actually works under pressure (advanced)
// ponytail: still a knob — an operator with sector-specific incident data should
// revisit these, same standing as TIER_TARGETS.
export const SECURITY_CONTROLS: SecurityControl[] = [
  // Govern (NIST CSF GV) — is security actually run as a program?
  { key: "securityPolicy", fn: "govern", weight: 2, depth: "core", gap: { code: "no-security-policy", severity: "critical" } },
  { key: "rolesResponsibilities", fn: "govern", weight: 2, depth: "core", gap: { code: "no-security-roles", severity: "warning" } },
  { key: "thirdPartyRisk", fn: "govern", weight: 1, depth: "core", gap: { code: "no-third-party-risk", severity: "warning" } },
  { key: "riskStrategy", fn: "govern", weight: 1, depth: "advanced" },
  // Identify (NIST CSF ID) — do you know what you have and what's at risk?
  { key: "assetInventory", fn: "identify", weight: 2, depth: "core", gap: { code: "no-asset-inventory", severity: "critical" } },
  { key: "riskAssessment", fn: "identify", weight: 2, depth: "core", gap: { code: "no-risk-assessment", severity: "warning" } },
  { key: "dataClassification", fn: "identify", weight: 1, depth: "core", gap: { code: "no-data-classification", severity: "warning" } },
  { key: "dataFlowMapping", fn: "identify", weight: 1, depth: "advanced" },
  // Protect (NIST CSF PR) — are the doors actually locked?
  { key: "mfa", fn: "protect", weight: 3, depth: "core", gap: { code: "no-mfa", severity: "critical" } },
  { key: "patching", fn: "protect", weight: 2, depth: "core", gap: { code: "no-patching", severity: "critical" } },
  { key: "leastPrivilege", fn: "protect", weight: 2, depth: "core", gap: { code: "no-least-privilege", severity: "warning" } },
  { key: "encryption", fn: "protect", weight: 2, depth: "core", gap: { code: "no-encryption", severity: "warning" } },
  { key: "securityTraining", fn: "protect", weight: 1, depth: "advanced" },
  { key: "networkSegmentation", fn: "protect", weight: 1, depth: "advanced" },
  // Detect (NIST CSF DE)
  { key: "siem", fn: "detect", weight: 3, depth: "core", gap: { code: "no-siem", severity: "critical" } },
  { key: "centralLogging", fn: "detect", weight: 3, depth: "core", gap: { code: "no-central-logging", severity: "critical" } },
  { key: "endpointMonitoring", fn: "detect", weight: 3, depth: "core", gap: { code: "no-endpoint-monitoring", severity: "critical" } },
  { key: "alerting", fn: "detect", weight: 2, depth: "core", gap: { code: "no-alerting", severity: "warning" } },
  { key: "vulnScanning", fn: "detect", weight: 2, depth: "core", gap: { code: "no-vuln-scanning", severity: "warning" } },
  { key: "networkMonitoring", fn: "detect", weight: 1, depth: "advanced" },
  // Respond (NIST CSF RS)
  { key: "irPlan", fn: "respond", weight: 3, depth: "core", gap: { code: "no-ir-plan", severity: "critical" } },
  { key: "isolation", fn: "respond", weight: 3, depth: "core", gap: { code: "no-isolation", severity: "critical" } },
  { key: "irOwnership", fn: "respond", weight: 2, depth: "core", gap: { code: "no-ir-ownership", severity: "warning" } },
  { key: "breachNotification", fn: "respond", weight: 1, depth: "core", gap: { code: "no-breach-notification", severity: "warning" } },
  { key: "playbooks", fn: "respond", weight: 1, depth: "advanced" },
  { key: "tabletop", fn: "respond", weight: 1, depth: "advanced" },
];

/** BIA estimator: hours a month over which system-dependent revenue is spread
 * when converting "monthly revenue through this system" into revenue lost per
 * hour of downtime. 30 days × 24h — assumes revenue arrives around the clock,
 * which is deliberately conservative: an outage during business hours costs
 * more per hour than this average. */
export const REVENUE_HOURS_PER_MONTH = 720;
