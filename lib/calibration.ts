// Calibration constants — every number the engine uses lives here so the
// operator's practitioner pass (launch gate, see README) reviews one file.
// Sources noted per constant; adjust from field experience, not marketing.

import type { Tier } from "./engine";

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
