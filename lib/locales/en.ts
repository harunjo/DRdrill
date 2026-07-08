// English dictionary. Structure is the contract — lib/locales/id.ts must
// mirror it exactly (typeof en). Placeholders use {name} and are filled by
// fmt() in lib/i18n.ts. Flag copy is business-framed by requirement (R18):
// investment asks, never operator fault.

export const en = {
  appName: "DR Drill",
  masthead: "Business-continuity assessment",
  tagline: "Describe your environment. Get your recovery reality — the RPO/RTO you can actually achieve, not the one on the slide.",
  privacyLine:
    "Your environment details and workload names never leave this browser. The drill story is written from anonymized findings only (W1, W2, …), and nothing you enter is stored anywhere.",
  trustIndicator: "Runs locally · data stays on device",

  intake: {
    steps: {
      model: "Environment",
      workloads: "Workloads",
      protection: "Protection",
    },
    empty: {
      title: "No workloads yet",
      body: "Add the systems whose recovery you want to check — start with the 5–10 the business can least afford to lose.",
    },
    stepModel: "1. Where does your infrastructure run?",
    models: {
      onprem: "On-premise",
      cloud: "Full cloud",
      hybrid: "Hybrid",
      private: "Private cloud",
    },
    stepWorkloads: "2. Your most critical workloads",
    workloadsHint: "List your 5–10 most critical systems — not an exhaustive inventory.",
    workloadName: "Name (e.g. ERP database)",
    nameCounter: "{n}/60",
    types: {
      database: "Database",
      vm: "Virtual machines",
      files: "File shares",
      saas: "SaaS",
    },
    sizeLabel: "Size (GB)",
    tiers: {
      1: "Tier 1 — mission critical",
      2: "Tier 2 — business important",
      3: "Tier 3 — normal",
    } as Record<1 | 2 | 3, string>,
    placement: {
      onprem: "Runs on-premise",
      cloud: "Runs in cloud",
    },
    addWorkload: "+ add workload",
    remove: "remove",
    errors: {
      nameRequired: "Give this workload a name.",
      sizeInvalid: "Size must be a number above 0.",
      maxWorkloads: "10 workloads is the cap — keep it to the most critical systems.",
    },
    stepProtection: "3. Current protection",
    protectionGroups: {
      onprem: "On-premise protection",
      cloud: "Cloud protection",
    },
    freqLabel: {
      onprem: "Backups run every … hours (0 = none)",
      cloud: "Snapshots taken every … hours (0 = none)",
    },
    replication: "Replication to a second system",
    replicationLag: "Replication lag (minutes)",
    offsite: {
      onprem: "Offsite / cloud copy exists",
      cloud: "Cross-region copy exists",
    },
    immutable: "Immutable (WORM) copy exists",
    secondSite: {
      onprem: "A second site is available",
      cloud: "A second region is ready for failover",
    },
    run: "Run assessment",
    zeroWorkloads: "Add at least one named workload to run the assessment.",
    back: "Back",
    next: "Continue",
    stepCounter: "Step {n} of {total}",
  },

  report: {
    newAssessment: "New assessment",
    coverageShort: "Based on the {n} workloads you described",
    tiles: { readiness: "Readiness", workloads: "Workloads", flags: "Risk flags", rule: "3-2-1" },
    scoreTitle: "Recovery readiness",
    scoreOutOf: "/100",
    coverage:
      "Based on the {n} workloads you described — readiness as described, computed from your answers, not an audit.",
    gapsTitle: "Recovery gaps",
    gapSummary: "{met}/{total} targets met",
    gapPill: { meets: "MEETS", gap: "GAP", noPath: "NO PATH" },
    tierTag: "Tier {n}",
    gapTitle: "RPO / RTO gap table",
    workload: "Workload",
    target: "Target RPO / RTO",
    achievableRpo: "Achievable RPO",
    achievableRto: "Achievable RTO",
    unrecoverable: "unrecoverable",
    units: { min: "min", h: "h", d: "d" },
    investTitle: "Where to invest",
    investLabel: "priorities",
    investOne: "priority",
    investEmpty: "No open gaps — the essentials are covered.",
    flagsTitle: "Risk flags",
    flags: {
      "no-immutable": {
        title: "Ransomware could reach the backups",
        detail:
          "With admin credentials, an attacker can encrypt or delete backups along with production. An immutable (WORM) copy is the investment that closes this gap — it is what contained 2017-class outbreaks at the backup layer.",
      },
      "no-offsite": {
        title: "One location holds everything",
        detail:
          "Fire, flood, or a site-level compromise takes production and backups together. An offsite copy is what protects the business against losing both at once.",
      },
      "no-cross-region": {
        title: "A region outage takes the business down",
        detail:
          "To survive a cloud-region incident, the business needs a cross-region copy of its data. Without it, recovery waits on the provider.",
      },
      "single-site": {
        title: "No second site to fail over to",
        detail:
          "A site- or region-level outage means recovery is bounded by procurement and rebuild time, not restore speed. A failover target is the investment that turns days into hours.",
      },
      "saas-shared-responsibility": {
        title: "SaaS data relies on the vendor",
        detail:
          "Shared responsibility: the vendor keeps the service running; keeping the data recoverable requires the business's own copy. Verify SaaS data is actually in the backup scope.",
      },
      "unprotected-workloads": {
        title: "Some workloads cannot be recovered",
        detail:
          "Workloads without any protection are one incident away from permanent loss. Protecting them is the first investment to make.",
      },
    },
    rule321Title: "3-2-1 rule",
    rule321: {
      threeCopies: "three copies",
      twoMedia: "two media",
      oneOffsite: "one offsite",
    },
    legend: {
      withinTarget: "within target",
      overrun: "overrun",
      target: "target",
    },
    statusLabel: {
      good: "Ready",
      fair: "Needs attention",
      poor: "At risk",
    },
    severity: {
      critical: "Critical",
      warning: "Attention",
    },
  },

  drill: {
    title: "Live drill",
    pickScenario: "Pick the disaster to simulate:",
    idlePrompt: "Choose a scenario, then run the drill to see how tonight would unfold — beat by beat.",
    generate: "Run the drill",
    regenerate: "Run again",
    scenarios: {
      ransomware: "Ransomware",
      siteloss: "Site loss (fire/flood)",
      outage: "Cloud/region outage",
      deletion: "Accidental deletion",
    },
    generating: "Writing your drill story…",
    unavailable:
      "The drill story is unavailable right now. Your assessment above is complete and unaffected.",
    redacted:
      "Part of the generated story could not be verified against your computed findings and was withheld. Your assessment above is complete and unaffected.",
    capReached:
      "Story budget for this session is used up. The assessment above stays fully available.",
    languageNotice: "This story was written before the language switch — regenerate to update it.",
  },

  footer: {
    attribution: "Built by Harun Jonatan — 25+ years in enterprise data protection.",
  },

  language: {
    id: "Bahasa Indonesia",
    en: "English",
  },
};

export type Dictionary = typeof en;
