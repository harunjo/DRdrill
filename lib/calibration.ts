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

// NIST CSF 2.0 Detect/Respond controls (R4, R5). Per-environment maturity
// signals: `weight` drives the function's 0–100 score, `depth` gates the
// generalist (core) vs advanced intake (R18), and `gap` (when present) means an
// absent control raises an investment flag of that severity.
// ponytail: weights are a first-pass calibration — review with a practitioner
// before launch, same standing as TIER_TARGETS.
export const SECURITY_CONTROLS: SecurityControl[] = [
  // Detect (NIST CSF DE)
  { key: "siem", fn: "detect", weight: 2, depth: "core", gap: { code: "no-siem", severity: "critical" } },
  { key: "centralLogging", fn: "detect", weight: 2, depth: "core", gap: { code: "no-central-logging", severity: "critical" } },
  { key: "endpointMonitoring", fn: "detect", weight: 2, depth: "core", gap: { code: "no-endpoint-monitoring", severity: "warning" } },
  { key: "alerting", fn: "detect", weight: 1, depth: "core", gap: { code: "no-alerting", severity: "warning" } },
  { key: "vulnScanning", fn: "detect", weight: 1, depth: "core", gap: { code: "no-vuln-scanning", severity: "warning" } },
  { key: "networkMonitoring", fn: "detect", weight: 1, depth: "advanced" },
  // Respond (NIST CSF RS)
  { key: "irPlan", fn: "respond", weight: 2, depth: "core", gap: { code: "no-ir-plan", severity: "critical" } },
  { key: "isolation", fn: "respond", weight: 2, depth: "core", gap: { code: "no-isolation", severity: "critical" } },
  { key: "irOwnership", fn: "respond", weight: 1, depth: "core", gap: { code: "no-ir-ownership", severity: "warning" } },
  { key: "breachNotification", fn: "respond", weight: 1, depth: "core", gap: { code: "no-breach-notification", severity: "warning" } },
  { key: "playbooks", fn: "respond", weight: 1, depth: "advanced" },
  { key: "tabletop", fn: "respond", weight: 1, depth: "advanced" },
];
