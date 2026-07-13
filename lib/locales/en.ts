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
  masthead: "IT resilience & security assessment",
  tagline: "Describe your environment. Get your recovery reality — the RPO/RTO you can actually achieve, not the one on the slide.",
  privacyLine:
    "Your environment details and workload names never leave this browser. The drill story is written from anonymized findings only (W1, W2, …), and nothing you enter is stored anywhere.",
  trustIndicator:
    "The assessment runs entirely on your device — your data never leaves; the simulation in the next step sends only anonymized data",

  intake: {
    steps: {
      model: "Environment",
      workloads: "Workloads",
      protection: "Protection",
      security: "Security",
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
    sizeLabel: "Data size",
    sizeUnit: "Size unit",
    cost: {
      label: "Downtime cost (optional)",
      unit: "USD / hour",
      placeholder: "e.g. 300",
      estTitle: "Downtime cost calculator",
      estimateHow: "Answer with numbers you already know — we work out the cost per hour of downtime. Leave revenue at 0 if these systems don't earn money directly.",
      estStaff: "Staff who can't work",
      estStaffPh: "e.g. 20",
      estStaffCost: "Avg monthly salary / staff",
      estSalaryPh: "e.g. 500",
      estRevenue: "Monthly revenue through these systems (0 if none)",
      estRevenuePh: "e.g. 50000",
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
    stepSecurity: "4. Detection & response posture",
    security: {
      intro:
        "This step rates your organization's security as a whole — you answer it once, not per workload. Tick what you already have and leave the rest empty. You can also skip it: the rest of the report stays complete, only security goes unrated.",
      advancedToggle: "Advanced (NIST CSF terms)",
      allPresent: "All present",
      clearGroup: "Clear",
      groups: {
        govern: "Govern — running security as a program",
        identify: "Identify — knowing your assets & risks",
        protect: "Protect — locking the doors",
        detect: "Detect — spotting an attack",
        respond: "Respond — acting on an incident",
      },
      controls: {
        securityPolicy: "A written information-security policy",
        rolesResponsibilities: "Defined security roles & responsibilities",
        thirdPartyRisk: "Vendor / third-party risk is managed",
        riskStrategy: "A risk-management strategy / risk appetite",
        assetInventory: "An inventory of systems and assets",
        riskAssessment: "Periodic security risk assessments",
        dataClassification: "Data classified by sensitivity",
        dataFlowMapping: "Sensitive data flows are mapped",
        mfa: "Multi-factor authentication (MFA)",
        patching: "Timely patching of systems",
        leastPrivilege: "Least-privilege access control",
        encryption: "Data encrypted at rest and in transit",
        securityTraining: "Security-awareness training for staff",
        networkSegmentation: "Network segmentation",
        siem: "Security monitoring (SIEM) that correlates logs",
        centralLogging: "Central log collection",
        endpointMonitoring: "Endpoint protection / EDR on servers and laptops",
        alerting: "Alerts that page someone on suspicious activity",
        vulnScanning: "Regular vulnerability scanning",
        networkMonitoring: "Network traffic monitoring",
        irPlan: "A written incident-response plan",
        isolation: "Ability to isolate a compromised part of the network",
        irOwnership: "A named person or team on call for incidents",
        breachNotification: "A process to notify regulators/customers of a breach",
        playbooks: "Response playbooks for common incidents",
        tabletop: "Regular incident drills / tabletop exercises",
      },
      controlsCsf: {
        securityPolicy: "Policy (GV.PO)",
        rolesResponsibilities: "Roles & responsibilities (GV.RR)",
        thirdPartyRisk: "Supply-chain risk mgmt (GV.SC)",
        riskStrategy: "Risk-management strategy (GV.RM)",
        assetInventory: "Asset management (ID.AM)",
        riskAssessment: "Risk assessment (ID.RA)",
        dataClassification: "Data classification (ID.AM)",
        dataFlowMapping: "Data-flow mapping (ID.AM)",
        mfa: "Multi-factor auth (PR.AA)",
        patching: "Patch / vulnerability mgmt (PR.PS)",
        leastPrivilege: "Least privilege (PR.AA)",
        encryption: "Encryption at rest / in transit (PR.DS)",
        securityTraining: "Awareness & training (PR.AT)",
        networkSegmentation: "Network segmentation (PR.IR)",
        siem: "SIEM / event correlation (DE.AE)",
        centralLogging: "Centralized logging (DE.CM)",
        endpointMonitoring: "Endpoint detection & response — EDR (DE.CM)",
        alerting: "Adverse-event alerting (DE.AE)",
        vulnScanning: "Vulnerability scanning (DE.CM / ID.RA)",
        networkMonitoring: "Network monitoring (DE.CM)",
        irPlan: "Incident-response plan (RS.MA)",
        isolation: "Incident containment / segmentation (RS.MI)",
        irOwnership: "Response coordination & ownership (RS.MA)",
        breachNotification: "Breach notification / reporting (RS.CO)",
        playbooks: "Response playbooks (RS.MA)",
        tabletop: "Response exercises / tabletop (RS.MA)",
      },
    },
    run: "Run assessment",
    zeroWorkloads: "Add at least one named workload to run the assessment.",
    back: "Back",
    next: "Continue",
    stepCounter: "Step {n} of {total}",
    saveConfig: "Save config",
    loadConfig: "Load config",
    loadConfigError: "That file isn't a valid DR Drill config.",
  },

  report: {
    newAssessment: "New assessment",
    csf: {
      title: "Security posture (NIST CSF)",
      subtitle:
        "Per-function maturity. Recover is your recovery readiness; the other functions are scored as you assess them.",
      notAssessed: "not yet assessed",
      functions: {
        govern: "Govern",
        identify: "Identify",
        protect: "Protect",
        detect: "Detect",
        respond: "Respond",
        recover: "Recover",
      },
    },
    coverageShort: "Based on the {n} workloads you described",
    lensesLabel: "Report view",
    lensesHint: "Same findings — tap to switch view:",
    lenses: {
      business: "Business impact",
      drill: "Disaster drill",
      technical: "Technical",
      investment: "Investment case",
    },
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
    timeline: {
      dataYouLose: "◄ Data lost · RPO",
      timeDown: "Downtime · RTO ►",
      incident: "Incident · t=0",
      rpoTarget: "RPO target",
      rtoTarget: "RTO target",
      noPath: "no path",
    },
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
      addCost: "Don't know your downtime cost? Click here to add it.",
      annualized: "Estimated annual loss (ALE)",
      aleNote:
        "Per-incident exposure × how likely a disruption is each year — the rate rises with each unresolved critical gap.",
      unrecoverableNote: "A workload cannot be recovered if a disaster strikes",
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
      closesSecurityGap: "Closes this security gap",
      preparedBy: "Prepared by harunjonatan.com · Your data is safe — we don't store your environment details, and your workload names never leave your browser. The drill sends anonymized findings only (W1, W2, …).",
      copy: "Copy summary",
      copied: "Copied",
      copyFailed: "Copy unavailable — select the text below to copy manually:",
      scope: { onprem: "on-premise", cloud: "cloud" },
      brand: {
        companyName: "Company name",
        addLogo: "Add logo",
        changeLogo: "Change logo",
        clear: "Clear",
      },
      pdf: {
        download: "Download: Business Continuity (BC) investment proposal draft",
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
        technical:
          "Backup repositories are writable by the same admin credentials that control production. Without WORM/immutable retention enforced at the storage layer, ransomware with domain-admin or backup-console access can encrypt or delete snapshots before any retention lock would block it.",
        business:
          "With admin credentials, an attacker can encrypt or delete backups along with production. An immutable (WORM) copy is the investment that closes this gap — it is what contained 2017-class outbreaks at the backup layer.",
      },
      "no-offsite": {
        title: "One location holds everything",
        technical:
          "Production and backup copies sit in the same physical location with no air gap. A single-site event — fire, flood, structural failure, physical theft — removes the primary copy and the only recovery copy in the same failure domain.",
        business:
          "Fire, flood, or a site-level compromise takes production and backups together. An offsite copy is what protects the business against losing both at once.",
      },
      "no-cross-region": {
        title: "A region outage takes the business down",
        technical:
          "Backups replicate only within the same cloud region as production. A regional control-plane or infrastructure outage on the provider's side removes access to both production and its backup simultaneously, since neither crosses an availability boundary.",
        business:
          "To survive a cloud-region incident, the business needs a cross-region copy of its data. Without it, recovery waits on the provider.",
      },
      "single-site": {
        title: "No second site to fail over to",
        technical:
          "No standby compute, network, or storage is provisioned in a second location. Recovery after a site-level failure is bounded by hardware procurement and rebuild lead time — not restore throughput — because there's nothing to fail over to.",
        business:
          "A site- or region-level outage means recovery is bounded by procurement and rebuild time, not restore speed. A failover target is the investment that turns days into hours.",
      },
      "saas-shared-responsibility": {
        title: "SaaS data relies on the vendor",
        technical:
          "Under the SaaS shared-responsibility model, the vendor's SLA covers uptime, not data recoverability — deletion, sync errors, or a compromised admin account are the tenant's liability. Unless SaaS data is explicitly pulled into your own backup pipeline, it has no recovery point independent of the vendor's retention window.",
        business:
          "Shared responsibility: the vendor keeps the service running; keeping the data recoverable requires the business's own copy. Verify SaaS data is actually in the backup scope.",
      },
      "unprotected-workloads": {
        title: "Some workloads cannot be recovered",
        technical:
          "One or more workloads have no backup job, snapshot schedule, or replication configured — achievable RPO/RTO resolve to null because there is no recovery point to restore from. Any failure on these systems is permanent data loss, not downtime.",
        business:
          "Workloads without any protection are one incident away from permanent loss. Protecting them is the first investment to make.",
      },
      "no-security-policy": {
        title: "No security policy to steer by",
        technical:
          "No documented, approved policy defines control baselines, exceptions, or an accountable owner. Controls that exist were adopted ad hoc, so there's no artifact to audit against and no owner accountable when a control silently lapses.",
        business:
          "Without a written security policy and an owner, controls are ad hoc and nothing is accountable. A policy is what turns scattered effort into a program.",
      },
      "no-security-roles": {
        title: "No one clearly owns security",
        technical:
          "Security duties aren't assigned to named roles — patching, access review, and incident response default to whoever notices. Routine control operations like key rotation and log review have no enforced cadence.",
        business:
          "When security responsibilities aren't assigned, gaps fall between roles. Defined ownership is what makes the program run day to day.",
      },
      "no-third-party-risk": {
        title: "Vendor risk is unmanaged",
        technical:
          "Vendors and integrations with access to your environment aren't assessed for their own security posture. A compromise on their side — leaked credentials, supply-chain injection, over-scoped API access — reaches your environment through the same trusted path with no compensating control.",
        business:
          "Your suppliers' weaknesses become yours. Managing third-party risk is how a breach at a vendor doesn't become a breach at you.",
      },
      "no-asset-inventory": {
        title: "You can't protect what you can't see",
        technical:
          "There is no authoritative, current inventory of systems, endpoints, and data stores. Unlisted assets receive no patches, monitoring, or backup coverage — they're invisible to every other control, including this assessment's own scope.",
        business:
          "Without an asset inventory, unknown systems go unpatched and unmonitored. Knowing what you have is the first step of every other control.",
      },
      "no-risk-assessment": {
        title: "Risks are unmeasured",
        technical:
          "Risk isn't periodically assessed and ranked, so security and DR spend follows whoever raises the loudest concern rather than measured likelihood × impact. There's no baseline to show whether posture is improving or degrading over time.",
        business:
          "Without periodic risk assessment, investment goes to the loudest voice, not the biggest risk. Assessment is what points spend at what matters.",
      },
      "no-data-classification": {
        title: "Sensitive data isn't identified",
        technical:
          "Data isn't tagged by sensitivity at the point of storage. Without classification, encryption, access control, and retention get applied uniformly or not at all — sensitive data ends up with the same protection as public data.",
        business:
          "If you don't know which data is sensitive, you can't protect it proportionately. Classification is what tells you where to concentrate defenses.",
      },
      "no-mfa": {
        title: "Passwords are the only lock",
        technical:
          "Authentication is password-only. Credential theft via phishing, reuse, or credential-stuffing from an unrelated breach is sufficient on its own to obtain a valid session — there's no second factor to stop it.",
        business:
          "Stolen or guessed passwords are the most common way in. Multi-factor authentication is the single highest-value control against account takeover.",
      },
      "no-patching": {
        title: "Known holes stay open",
        technical:
          "There's no enforced patch cadence. Public exploit code for disclosed CVEs typically appears within days, and every day a system stays unpatched past that point is an open, indexed attack path.",
        business:
          "Attackers exploit known, unpatched vulnerabilities within days of disclosure. Timely patching closes the doors before they're used.",
      },
      "no-least-privilege": {
        title: "Everyone can reach everything",
        technical:
          "Access grants aren't scoped to job function — accounts commonly hold broader permissions than their role requires. One compromised credential reaches systems and data far outside what that user needed, expanding blast radius by default.",
        business:
          "Broad access means one compromised account exposes the whole estate. Least privilege limits how far any single breach can reach.",
      },
      "no-encryption": {
        title: "Data is readable if taken",
        technical:
          "Data at rest and/or in transit is stored or transmitted in plaintext. Interception at any point — a lost laptop, an unencrypted backup, a sniffed connection — yields immediately usable data with no extra step for an attacker.",
        business:
          "Unencrypted data is fully exposed the moment a device, backup, or connection is intercepted. Encryption makes stolen data useless.",
      },
      "no-siem": {
        title: "Attacks can go unseen",
        technical:
          "Logs from different systems aren't aggregated or correlated. Attack patterns only visible across multiple sources — a failed login on one host followed by lateral movement on another — go undetected because no single system sees the sequence.",
        business:
          "Without a SIEM correlating logs, an intruder can operate for weeks before anyone notices. Central detection turns a silent breach into an early alert.",
      },
      "no-central-logging": {
        title: "No central record to investigate",
        technical:
          "Logs stay local to each system instead of shipping to a central, tamper-resistant store. An attacker with local access can delete evidence of their own intrusion, and there's no single timeline to reconstruct an incident from.",
        business:
          "When logs live only on each system, there is no single place to see an attack unfold or prove what happened. Centralized logging is the foundation detection and response both build on.",
      },
      "no-endpoint-monitoring": {
        title: "Endpoints aren't watched",
        technical:
          "Endpoints have no EDR or equivalent agent watching process behavior. Malware and living-off-the-land techniques that don't trigger signature-based antivirus run undetected on the host where most intrusions begin.",
        business:
          "Laptops and servers are where most intrusions land first. Endpoint monitoring (EDR) spots malicious activity on the machine before it spreads.",
      },
      "no-alerting": {
        title: "Detection without alerting is just history",
        technical:
          "Even where detection signals exist, no one is automatically paged when they fire. A detected event no one sees in time behaves like an undetected one — response starts whenever someone happens to check.",
        business:
          "Signals no one is paged on get reviewed after the damage is done. Alerting turns a detected event into a timely response.",
      },
      "no-vuln-scanning": {
        title: "Unknown weaknesses stay open",
        technical:
          "There's no recurring scan for exposed services, missing patches, or misconfigurations. Weaknesses introduced by routine changes go unnoticed until an attacker — or an incident — finds them first.",
        business:
          "Unpatched, exposed weaknesses are the doors attackers use. Regular vulnerability scanning is how the business finds and closes them first.",
      },
      "no-ir-plan": {
        title: "No plan when an incident hits",
        technical:
          "There's no documented incident-response plan — no predefined roles, escalation path, or playbook for common scenarios. The first response to a live incident is improvised in real time, which measurably extends containment.",
        business:
          "Improvising during a live incident costs hours the business can't spare. A documented incident-response plan keeps a crisis from becoming chaos.",
      },
      "no-isolation": {
        title: "Nothing to stop the spread",
        technical:
          "The network has no segmentation or containment capability — no way to quarantine a compromised host without taking down adjacent systems. One infected endpoint can move laterally across the full flat network unobstructed.",
        business:
          "Without the ability to isolate a compromised segment, one infected machine can take the whole environment. Network isolation is the control that contains an incident.",
      },
      "no-ir-ownership": {
        title: "No one owns the response",
        technical:
          "No individual or team is named incident commander for a security event. Absent explicit ownership, the first hour of any incident is spent establishing who's in charge before containment can start.",
        business:
          "When no one is clearly on call, the first hour of an incident is lost to 'who handles this?'. Named response ownership starts the clock on containment.",
      },
      "no-breach-notification": {
        title: "No process to notify",
        technical:
          "There's no defined process for legally required breach notification within statutory windows (often 72 hours). Missing the window converts a security incident into a separate compliance violation with its own penalty.",
        business:
          "Regulators and customers expect timely disclosure after a breach; a missed window adds penalties to the damage. A breach-notification process keeps a technical incident from becoming a compliance one.",
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
    totalLoss: "Total business loss at stake",
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
