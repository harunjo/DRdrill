// English dictionary. Structure is the contract — lib/locales/id.ts must
// mirror it exactly (typeof en). Placeholders use {name} and are filled by
// fmt() in lib/i18n.ts. Flag copy is business-framed by requirement (R18):
// investment asks, never operator fault.

import type { Currency } from "../exposure";
import { IDR_PER_USD } from "../calibration";

export const en = {
  appName: "DR Drill",
  // Report money display currency. Values are stored in IDR; English readers
  // (C-level, foreign stakeholders) see USD. `as Currency` widens `code` so the
  // ID dictionary can supply its own without a type clash.
  currency: { code: "USD", rate: IDR_PER_USD } as Currency,
  masthead: "Business-continuity assessment",
  tagline: "Describe your environment. Get your recovery reality — the RPO/RTO you can actually achieve, not the one on the slide.",
  privacyLine:
    "Your environment details and workload names never leave this browser. The drill story is written from anonymized findings only (W1, W2, …), and nothing you enter is stored anywhere.",
  trustIndicator: "Report runs on-device · names never leave your browser",

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
      files: "File server / NAS",
      saas: "SaaS",
    },
    sizeLabel: "Size (GB)",
    cost: {
      label: "Downtime cost (optional)",
      unit: "Rp / hour",
      placeholder: "e.g. 5000000",
      quickFill: "Quick-fill downtime cost",
      sameForAll: "Same for all",
      byTier: "By tier",
      apply: "Apply",
      tierShort: "T{n}",
      estimateCta: "Don't know the cost? Estimate it",
      estimateHow: "A rough number beats none. Enter how many staff can't work and their average monthly salary — we work out the hourly cost. Add lost revenue only if this system earns money directly; otherwise leave it 0.",
      estStaff: "Staff who can't work",
      estStaffPh: "e.g. 20",
      estStaffCost: "Avg monthly salary / staff",
      estSalaryPh: "e.g. 8000000",
      estRevenue: "Revenue lost / hour (0 if none)",
      estRevenuePh: "e.g. 0",
      estResult: "≈ {v} / hour",
      estUse: "Use for all workloads",
    },
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
    lensesLabel: "Report view",
    lenses: { business: "Business impact", technical: "Technical", investment: "Investment case" },
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
    posture: { strong: "Resilient", developing: "Developing", exposed: "Exposed" },
    business: {
      title: "Business impact",
      exposureHeadline: "Exposure if nothing changes",
      perWorkload: "Per workload",
      downtimeLabel: "downtime",
      addCost: "Add downtime cost in the intake to see exposure in Rupiah. Posture and gaps still apply.",
    },
    invest: {
      fundingCase: "Business continuity — funding case",
      exposureAtRisk: "Exposure at risk",
      plusUnrecoverable: "plus {names} unrecoverable",
      allUnrecoverable: "{names} unrecoverable",
      noCost: "Add downtime cost in the intake to quantify exposure.",
      posture: "Posture",
      bia: "BIA · self-assessment aligned with ISO 22301 / NIST CSF",
      closes: "Closes ~{amount} exposure",
      closesQual: "Closes the exposure this control protects",
      makesRecoverable: "Makes {n} workload(s) recoverable",
      strengthens: "Strengthens resilience posture",
      preparedBy: "Prepared by harunjonatan.com · Your data is safe — we don't store your environment details, and your workload names never leave your browser. The drill sends anonymized findings only (W1, W2, …).",
      copy: "Copy summary",
      copied: "Copied",
      copyFailed: "Copy unavailable — select the text below to copy manually:",
      scope: { onprem: "on-premise", cloud: "cloud" },
      pdf: {
        download: "Download PDF",
        docTitle: "Business Continuity — Investment Justification",
        forC: "Prepared for executive review (C-level)",
        intro:
          "This document quantifies the business loss the organization faces if a disaster strikes today and frames the investment that reduces it. Every figure is computed from the assessment; sections marked as a guide are for the sponsoring team to complete before circulation.",
        lossHeading: "Business loss at risk (per incident)",
        asksHeading: "Recommended investments, by priority",
        whatItBuys: "What it protects",
        guideTag: "Guide — complete this section",
        crit: { 1: "Critical", 2: "Important", 3: "Standard" },
        execSummary: "Executive Summary",
        currentSituation: "Current Situation",
        riskAssessment: "Risk Assessment",
        bia: "Business Impact Analysis (BIA)",
        currentGap: "Current Gap",
        options: "Options Considered",
        solution: "Proposed Solution",
        financial: "Financial Analysis",
        doingNothing: "Cost of Doing Nothing",
        benefits: "Benefits",
        roadmap: "Roadmap",
        governance: "Governance",
        kpis: "Success Metrics (KPIs)",
        recommendation: "Recommendation",
        execBody:
          "Based on the {n} workload(s) described, running on {model}, a disruption today exposes the business to an estimated {exposure}. Continuity posture is assessed as {posture}. The prioritized investments in this document reduce that exposure; the required budget, timeline and ownership are for the sponsoring team to complete in the guided sections.",
        situationLead: "Deployment model: {model}. The following gaps were identified from the environment as described:",
        noGaps: "No open gaps — the essentials are covered.",
        thRisk: "Risk",
        thSeverity: "Severity",
        thFinancial: "Financial exposure",
        unbounded: "Permanent loss",
        thWorkload: "Workload",
        thCriticality: "Criticality",
        thTolerance: "Downtime tolerance",
        thImpact: "Business impact",
        biaImpact: { 1: "Core operations stop", 2: "Significant disruption", 3: "Limited impact" },
        gapLead: "Where recovery stands today versus the target for each capability.",
        thCapability: "Capability",
        thCurrent: "Current",
        thTarget: "Target",
        capabilityRto: "Recovery time (RTO)",
        capabilityRpo: "Recovery point (RPO)",
        capabilitySite: "Secondary site",
        capabilityCyber: "Cyber recovery",
        none: "None",
        active: "Active",
        yes: "Yes",
        optionsGuide: [
          "List the alternatives you evaluated so the board sees a decision was made, not assumed.",
          "A. Do nothing — Pros: no cost. Cons: risk unchanged; the exposure above persists.",
          "B. Improve backup only — Pros: lower investment. Cons: long downtime remains.",
          "C (recommended). Full business-continuity solution — fast recovery, reduced risk, compliance.",
        ],
        solutionGuide: [
          "Describe the chosen solution as business capabilities, not vendor product names.",
          "Typical capabilities: secondary recovery site, automated failover, continuous replication, quarterly DR testing, cyber-recovery vault, recovery orchestration, monitoring and reporting.",
          "Tie each capability back to a risk in the Risk Assessment above.",
        ],
        financialGuide:
          "Enter the quoted costs from your vendor, then compare the total against the business loss at risk above — the investment is justified when the loss avoided exceeds the spend.",
        thItem: "Item",
        thCost: "Cost",
        finItems: ["Hardware", "Software", "Implementation", "Training", "Annual support", "Total"],
        doingNothingLead:
          "If no action is taken, a single disruption exposes the business to the loss below. Unrecoverable workloads represent permanent data loss, not a delay.",
        doingNothingList: [
          "Prolonged recovery — bounded by rebuild/procurement time, not restore speed",
          "SLA penalties and regulatory exposure",
          "Customer churn and reputational damage",
          "Increasing ransomware and cyber risk",
        ],
        tangibleH: "Tangible",
        intangibleH: "Intangible",
        intangible: [
          "Customer confidence",
          "Executive and board confidence",
          "Brand protection",
          "Employee productivity",
          "Business resilience",
        ],
        kpiLead: "Target recovery objectives (from the assessment) and the operating metrics that prove the capability works:",
        kpiStatic: [
          "100% DR test success",
          "Quarterly recovery exercises",
          "Replication availability ≥ 99.9%",
          "Compliance audit passed",
        ],
        roadmapGuide: [
          "Lay out the delivery phases with durations so the board sees a realistic timeline.",
          "Typical phases: 1. Assessment (~4 weeks) · 2. Infrastructure deployment (~6 weeks) · 3. Application replication (~8 weeks) · 4. Testing (~2 weeks) · 5. Go-live.",
        ],
        governanceGuide: [
          "Name the owners so accountability is clear.",
          "Typical: Executive Sponsor (CIO) · Project Owner (Infrastructure Manager) · Business Owners (Finance, Operations, Sales, Security).",
        ],
        recBody:
          "We request approval to invest {fill} in a resilient business-continuity capability that reduces the organization's exposure to operational disruption, cyber incidents and infrastructure failure — protecting revenue, customer trust and regulatory compliance. The priorities are listed below.",
        fillHint: "________ (enter investment amount)",
      },
    },
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
    heatmap: {
      impact: "Business impact",
      readiness: "Recovery readiness",
      impactLevels: ["Low", "Moderate", "High"] as [string, string, string],
      gapLevels: ["On track", "Partial", "At risk"] as [string, string, string],
      more: "+{n}",
      catastrophic: "Unrecoverable",
      tierAxis: "by tier (no cost entered)",
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
