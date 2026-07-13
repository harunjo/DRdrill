"use client";

import { Fragment, useState, type ComponentType } from "react";
import {
  Server,
  Cloud,
  Split,
  Lock,
  Boxes,
  Plus,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Download,
  Upload,
  type LucideProps,
} from "lucide-react";
import { fmt, type Dictionary } from "@/lib/i18n";
import {
  MAX_NAME_LENGTH,
  MAX_WORKLOADS,
  isEnvironment,
  type DeploymentModel,
  type Environment,
  type Placement,
  type Protection,
  type Tier,
  type Workload,
  type WorkloadType,
} from "@/lib/engine";
import { SECURITY_CONTROLS } from "@/lib/calibration";
import { applyByTier, applyToAll, estimateDowntimeCost } from "@/lib/costfill";
import { formatMoney } from "@/lib/exposure";

export const emptyProtection: Protection = {
  frequencyHours: 24,
  replication: false,
  replicationLagMin: 15,
  offsiteCopy: false,
  immutableCopy: false,
  secondSite: false,
};

export const emptyWorkload = (): Workload => ({
  id: crypto.randomUUID(),
  name: "",
  type: "vm",
  sizeGB: 500,
  tier: 2,
  placement: "onprem",
});

export function workloadValid(w: Workload): boolean {
  return w.name.trim().length > 0 && Number.isFinite(w.sizeGB) && w.sizeGB > 0;
}

const MODELS: { key: DeploymentModel; icon: ComponentType<LucideProps> }[] = [
  { key: "onprem", icon: Server },
  { key: "cloud", icon: Cloud },
  { key: "hybrid", icon: Split },
  { key: "private", icon: Lock },
];
const TYPES: WorkloadType[] = ["database", "vm", "files", "saas"];
const selectCls = "field px-2.5 text-sm";

// Localized step titles carry a "1. " prefix; the stepper renders its own
// numeral, so strip the leading number from the heading.
const stripNum = (s: string) => s.replace(/^\s*\d+\.\s*/, "");

export function Intake({
  t,
  env,
  onChange,
  onRun,
  initialStep = 0,
}: {
  t: Dictionary;
  env: Environment;
  onChange: (env: Environment) => void;
  onRun: () => void;
  /** Open on a specific step — e.g. back to Workloads to fill downtime cost. */
  initialStep?: number;
}) {
  const TOTAL = 4;
  const [step, setStep] = useState(initialStep);
  // Save/load config to local disk (R13: stays a browser-only file, never
  // uploaded anywhere) — lets a user resume a prior intake without retyping.
  const [configError, setConfigError] = useState("");
  const saveConfig = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(env, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "dr-drill-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const loadConfig = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isEnvironment(parsed)) throw new Error("invalid shape");
        onChange(parsed);
        setConfigError("");
        setStep(0);
      } catch {
        setConfigError(t.intake.loadConfigError);
      }
    };
    reader.readAsText(file);
  };
  // Dual depth (R18): generalist by default; advanced reveals the full control
  // set and CSF terminology. Display-only — not persisted to the environment.
  const [advanced, setAdvanced] = useState(false);
  // Per-workload display unit for size; storage stays canonical in GB (R13).
  const [sizeUnit, setSizeUnit] = useState<Record<string, "GB" | "TB">>({});
  // Collapsed-by-default CSF groups so the security step opens tidy (R18/#3).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // Cost-of-downtime quick-fill (U2) — local input state; commits to env on Apply.
  const [fillMode, setFillMode] = useState<"all" | "tier">("all");
  const [fillAll, setFillAll] = useState("");
  const [fillTier, setFillTier] = useState<Record<number, string>>({});
  const tiersPresent = [...new Set(env.workloads.map((w) => w.tier))].sort();
  // Educational estimator (U2) — decompose the number managers can't name into
  // inputs they can. Computes live; "Use" hands off to the same-for-all field.
  const [estOpen, setEstOpen] = useState(false);
  const [est, setEst] = useState({ staff: "", staffCost: "", revenue: "" });
  const estValue = estimateDowntimeCost({
    staffAffected: Number(est.staff),
    monthlySalaryPerStaff: Number(est.staffCost),
    revenuePerHour: Number(est.revenue),
  });

  // Money is stored in IDR (single source of truth), but shown/entered in the
  // display currency (IDR in Bahasa, USD in English). Convert at the input edge:
  // all local input state is in display units; commit to env in IDR.
  const cur = t.currency;
  const toIDR = (x: number) => Math.round(x * cur.rate);
  const toDisplay = (idr: number) => idr / cur.rate;

  const groups: Placement[] =
    env.model === "hybrid" ? ["onprem", "cloud"] : env.model === "cloud" ? ["cloud"] : ["onprem"];

  const validWorkloads = env.workloads.filter(workloadValid);
  const allValid = env.workloads.length > 0 && env.workloads.every(workloadValid);
  const canRun = validWorkloads.length > 0 && allValid;

  const updateWorkload = (id: string, patch: Partial<Workload>) =>
    onChange({
      ...env,
      workloads: env.workloads.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });

  const updateProtection = (g: Placement, patch: Partial<Protection>) =>
    onChange({
      ...env,
      protection: {
        ...env.protection,
        [g]: { ...(env.protection[g] ?? emptyProtection), ...patch },
      },
    });

  // Toggling any control opts the environment into a security assessment (R2):
  // an untouched security step leaves env.security undefined = not assessed.
  const updateSecurity = (key: string, value: boolean) =>
    onChange({ ...env, security: { ...(env.security ?? {}), [key]: value } });

  const bulkSetSecurity = (keys: string[], value: boolean) =>
    onChange({
      ...env,
      security: { ...(env.security ?? {}), ...Object.fromEntries(keys.map((k) => [k, value])) },
    });

  const toggle = (
    checked: boolean,
    label: string,
    onToggle: (v: boolean) => void,
  ) => (
    <label
      className={`keycap flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border bg-panel px-3 py-2.5 text-[13px] transition-colors ${
        checked
          ? "border-signal bg-signal-soft text-signal-ink"
          : "border-line text-muted hover:border-faint hover:text-text"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span>{label}</span>
    </label>
  );

  const titles = [
    t.intake.stepModel,
    t.intake.stepWorkloads,
    t.intake.stepProtection,
    t.intake.stepSecurity,
  ];
  const stepLabels = [
    t.intake.steps.model,
    t.intake.steps.workloads,
    t.intake.steps.protection,
    t.intake.steps.security,
  ];
  const hints = [undefined, t.intake.workloadsHint, undefined, undefined];
  // Only the workloads step gates advancing; model always has a value and
  // protection is optional.
  const canAdvance = step === 1 ? canRun : true;

  return (
    <div className="mt-6">
      <section className="panel overflow-hidden">
        {/* ── Save/load config — resume a prior intake without retyping ── */}
        <div className="flex items-center justify-end gap-1.5 border-b border-line-soft px-5 py-2 sm:px-7">
          <button
            type="button"
            onClick={saveConfig}
            className="btn-ghost h-8 gap-1.5 px-2.5 text-[12px] text-faint hover:text-text"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {t.intake.saveConfig}
          </button>
          <label className="btn-ghost h-8 cursor-pointer gap-1.5 px-2.5 text-[12px] text-faint hover:text-text">
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {t.intake.loadConfig}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadConfig(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {configError && (
          <div className="border-b border-line-soft bg-crit-soft/60 px-5 py-2 text-[12px] font-medium text-crit sm:px-7">
            {configError}
          </div>
        )}
        {/* ── Numbered stepper with filling connectors ── */}
        <div className="border-b border-line bg-well/60 px-5 py-4 sm:px-7">
          <div className="flex items-start">
            {stepLabels.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <div key={label} className="flex min-w-0 flex-1 items-start">
                  <div className="flex min-w-0 flex-col items-center gap-1.5">
                    <div
                      className={`keycap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
                        done || current
                          ? "bg-signal text-white"
                          : "border border-line bg-panel text-faint"
                      } ${current ? "ring-4 ring-signal-soft" : ""}`}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </div>
                    <span
                      className={`max-w-[9ch] truncate text-center text-[11px] font-medium sm:text-[12px] ${
                        done || current ? "text-text" : "text-faint"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < TOTAL - 1 && (
                    <div className="mt-4 h-0.5 flex-1 rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-signal transition-all duration-300"
                        style={{ width: step > i ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step body ── */}
        <div className="px-5 py-6 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[19px] font-semibold tracking-tight">{stripNum(titles[step])}</h2>
            <span className="tag shrink-0 text-[10px]">
              {fmt(t.intake.stepCounter, { n: step + 1, total: TOTAL })}
            </span>
          </div>
          {hints[step] && <p className="mt-1 text-[13px] text-muted">{hints[step]}</p>}
          <div className="mt-5 rule" />

          <div className="mt-6 min-h-[10rem]">
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {MODELS.map(({ key, icon: Icon }) => {
                  const active = env.model === key;
                  return (
                    <button
                      key={key}
                      onClick={() => onChange({ ...env, model: key })}
                      role="radio"
                      aria-checked={active}
                      className={`keycap flex min-h-[92px] flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-signal bg-signal-soft"
                          : "border-line bg-panel hover:border-faint hover:bg-well/50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          active ? "bg-signal text-white" : "bg-well text-muted"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span
                        className={`text-[14px] font-semibold ${active ? "text-signal-ink" : "text-text"}`}
                      >
                        {t.intake.models[key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <>
                {env.workloads.length > 0 && (
                  <div className="mb-3 rounded-lg border border-line bg-panel p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-medium text-muted">
                        {t.intake.cost.quickFill}
                      </span>
                      <div className="flex overflow-hidden rounded-lg border border-line text-xs font-semibold">
                        {(["all", "tier"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setFillMode(m)}
                            aria-pressed={fillMode === m}
                            className={`px-2.5 py-1.5 transition-colors ${
                              fillMode === m ? "bg-signal text-white" : "text-faint hover:text-muted"
                            }`}
                          >
                            {m === "all" ? t.intake.cost.sameForAll : t.intake.cost.byTier}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {fillMode === "all" ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            className="field w-36 px-2 text-sm"
                            placeholder={t.intake.cost.placeholder}
                            value={fillAll}
                            onChange={(e) => setFillAll(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-primary px-4 text-sm"
                            disabled={fillAll === ""}
                            onClick={() =>
                              onChange({
                                ...env,
                                workloads: applyToAll(
                                  env.workloads,
                                  fillAll === "" ? undefined : toIDR(Number(fillAll)),
                                ),
                              })
                            }
                          >
                            {t.intake.cost.apply}
                          </button>
                        </>
                      ) : (
                        <>
                          {tiersPresent.map((tier) => (
                            <label
                              key={tier}
                              className="flex items-center gap-1 text-[12px] text-muted"
                            >
                              {fmt(t.intake.cost.tierShort, { n: tier })}
                              <input
                                type="number"
                                min={0}
                                className="field w-24 px-2 text-sm"
                                value={fillTier[tier] ?? ""}
                                onChange={(e) =>
                                  setFillTier((s) => ({ ...s, [tier]: e.target.value }))
                                }
                              />
                            </label>
                          ))}
                          <button
                            type="button"
                            className="btn-primary px-4 text-sm"
                            onClick={() => {
                              const map: Partial<Record<Tier, number>> = {};
                              for (const tr of tiersPresent) {
                                const v = fillTier[tr];
                                if (v !== undefined && v !== "") map[tr] = toIDR(Number(v));
                              }
                              onChange({ ...env, workloads: applyByTier(env.workloads, map) });
                            }}
                          >
                            {t.intake.cost.apply}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Educational estimator — turns "I don't know" into inputs they do */}
                    <button
                      type="button"
                      onClick={() => setEstOpen((v) => !v)}
                      aria-expanded={estOpen}
                      className="mt-2 text-[12px] font-medium text-signal hover:underline"
                    >
                      {t.intake.cost.estimateCta}
                    </button>
                    {estOpen && (
                      <div className="mt-2 rounded-lg border border-line bg-well/60 p-3">
                        <p className="text-[12px] leading-relaxed text-muted">
                          {t.intake.cost.estimateHow}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {(
                            [
                              ["staff", t.intake.cost.estStaff, t.intake.cost.estStaffPh],
                              ["staffCost", t.intake.cost.estStaffCost, t.intake.cost.estSalaryPh],
                              ["revenue", t.intake.cost.estRevenue, t.intake.cost.estRevenuePh],
                            ] as const
                          ).map(([key, lbl, ph]) => (
                            <label key={key} className="flex flex-col gap-1 text-[11px] text-faint">
                              {lbl}
                              <input
                                type="number"
                                min={0}
                                className="field w-full px-2 py-1.5 text-sm"
                                placeholder={ph}
                                value={est[key]}
                                onChange={(e) => setEst((s) => ({ ...s, [key]: e.target.value }))}
                              />
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[15px] font-semibold text-crit">
                            {fmt(t.intake.cost.estResult, { v: formatMoney(toIDR(estValue), cur) })}
                          </span>
                          <button
                            type="button"
                            className="btn-primary px-4 text-sm"
                            disabled={estValue <= 0}
                            onClick={() => {
                              setFillMode("all");
                              setFillAll(String(estValue));
                              onChange({ ...env, workloads: applyToAll(env.workloads, estValue) });
                              setEstOpen(false);
                            }}
                          >
                            {t.intake.cost.estUse}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {env.workloads.length === 0 ? (
                  /* ── Empty state — line-art, non-scolding ── */
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-well/50 px-6 py-10 text-center">
                    <Boxes className="h-10 w-10 text-faint" strokeWidth={1.5} aria-hidden />
                    <h3 className="mt-3 text-[15px] font-semibold text-text">{t.intake.empty.title}</h3>
                    <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
                      {t.intake.empty.body}
                    </p>
                  </div>
                ) : (
                  env.workloads.map((w, i) => {
                    const nameMissing = w.name.trim().length === 0;
                    const sizeInvalid = !Number.isFinite(w.sizeGB) || w.sizeGB <= 0;
                    return (
                      <div
                        key={w.id}
                        className="mt-3 rounded-xl border border-line bg-well/60 p-4 first:mt-0"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="chip chip-accent font-mono">W{i + 1}</span>
                          <button
                            className="btn-ghost -mr-1 h-9 gap-1 px-2 text-xs text-faint hover:text-crit"
                            onClick={() =>
                              onChange({ ...env, workloads: env.workloads.filter((x) => x.id !== w.id) })
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                            {t.intake.remove}
                          </button>
                        </div>
                        <input
                          className="field w-full px-3 py-2 text-sm"
                          placeholder={t.intake.workloadName}
                          maxLength={MAX_NAME_LENGTH}
                          value={w.name}
                          onChange={(e) => updateWorkload(w.id, { name: e.target.value })}
                        />
                        <div className="mt-1 flex justify-between font-mono text-[11px]">
                          <span className="text-crit">
                            {nameMissing ? t.intake.errors.nameRequired : ""}
                          </span>
                          <span className="text-faint">
                            {w.name.length >= MAX_NAME_LENGTH - 10
                              ? t.intake.nameCounter.replace("{n}", String(w.name.length))
                              : ""}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <select
                            className={selectCls}
                            value={w.type}
                            onChange={(e) =>
                              updateWorkload(w.id, { type: e.target.value as WorkloadType })
                            }
                          >
                            {TYPES.map((ty) => (
                              <option key={ty} value={ty}>
                                {t.intake.types[ty]}
                              </option>
                            ))}
                          </select>
                          <div className="relative">
                            {(() => {
                              const unit = sizeUnit[w.id] ?? "GB";
                              const shown = Number.isFinite(w.sizeGB)
                                ? unit === "TB"
                                  ? w.sizeGB / 1000
                                  : w.sizeGB
                                : "";
                              return (
                                <>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    className="field w-full px-3 py-2 pr-14 text-sm"
                                    title={t.intake.sizeLabel}
                                    placeholder={t.intake.sizeLabel}
                                    value={shown}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      updateWorkload(w.id, {
                                        sizeGB: unit === "TB" ? Math.round(v * 1000) : v,
                                      });
                                    }}
                                  />
                                  {/* Unit selector — never a contextless number. */}
                                  <select
                                    aria-label={t.intake.sizeUnit}
                                    value={unit}
                                    onChange={(e) =>
                                      setSizeUnit((s) => ({
                                        ...s,
                                        [w.id]: e.target.value as "GB" | "TB",
                                      }))
                                    }
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-transparent py-0.5 pl-1 pr-0.5 text-[11px] font-semibold text-faint focus:outline-none"
                                  >
                                    <option value="GB">GB</option>
                                    <option value="TB">TB</option>
                                  </select>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        {sizeInvalid && (
                          <div className="mt-1 font-mono text-[11px] text-crit">
                            {t.intake.errors.sizeInvalid}
                          </div>
                        )}
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <select
                            className={selectCls}
                            value={w.tier}
                            onChange={(e) =>
                              updateWorkload(w.id, { tier: Number(e.target.value) as Tier })
                            }
                          >
                            {([1, 2, 3] as Tier[]).map((tier) => (
                              <option key={tier} value={tier}>
                                {t.intake.tiers[tier]}
                              </option>
                            ))}
                          </select>
                          {env.model === "hybrid" && (
                            <select
                              className={selectCls}
                              value={w.placement ?? "onprem"}
                              onChange={(e) =>
                                updateWorkload(w.id, { placement: e.target.value as Placement })
                              }
                            >
                              <option value="onprem">{t.intake.placement.onprem}</option>
                              <option value="cloud">{t.intake.placement.cloud}</option>
                            </select>
                          )}
                        </div>
                        <label className="mt-2 flex min-h-[44px] items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-muted">
                          <span className="flex-1">{t.intake.cost.label}</span>
                          <span className="tag">{t.intake.cost.unit}</span>
                          <input
                            type="number"
                            min={0}
                            className="field w-28 px-2 text-sm"
                            placeholder={t.intake.cost.placeholder}
                            value={w.costPerHourDowntime != null ? toDisplay(w.costPerHourDowntime) : ""}
                            onChange={(e) =>
                              updateWorkload(w.id, {
                                costPerHourDowntime:
                                  e.target.value === "" ? undefined : toIDR(Number(e.target.value)),
                              })
                            }
                          />
                        </label>
                      </div>
                    );
                  })
                )}

                {env.workloads.length < MAX_WORKLOADS ? (
                  <button
                    className="btn-ghost mt-3 w-full border border-dashed border-line text-[13px] text-muted hover:border-signal hover:text-signal"
                    onClick={() =>
                      onChange({ ...env, workloads: [...env.workloads, emptyWorkload()] })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    {t.intake.addWorkload}
                  </button>
                ) : (
                  <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
                    {t.intake.errors.maxWorkloads}
                  </p>
                )}
              </>
            )}

            {step === 2 &&
              groups.map((g) => {
                const p = env.protection[g] ?? emptyProtection;
                return (
                  <div
                    key={g}
                    className="mt-3 rounded-xl border border-line bg-well/60 p-4 first:mt-0"
                  >
                    {groups.length > 1 && (
                      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text">
                        {g === "cloud" ? (
                          <Cloud className="h-4 w-4 text-signal" strokeWidth={2} />
                        ) : (
                          <Server className="h-4 w-4 text-signal" strokeWidth={2} />
                        )}
                        {t.intake.protectionGroups[g]}
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex min-h-[44px] items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted">
                        <span className="flex-1">{t.intake.freqLabel[g]}</span>
                        <input
                          type="number"
                          min={0}
                          className="field w-20 px-2 text-sm"
                          value={p.frequencyHours}
                          onChange={(e) =>
                            updateProtection(g, { frequencyHours: Number(e.target.value) })
                          }
                        />
                      </label>
                      {toggle(p.replication, t.intake.replication, (v) =>
                        updateProtection(g, { replication: v }),
                      )}
                      {p.replication && (
                        <label className="flex min-h-[44px] items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted">
                          <span className="flex-1">{t.intake.replicationLag}</span>
                          <input
                            type="number"
                            min={0}
                            className="field w-20 px-2 text-sm"
                            value={p.replicationLagMin}
                            onChange={(e) =>
                              updateProtection(g, { replicationLagMin: Number(e.target.value) })
                            }
                          />
                        </label>
                      )}
                      {toggle(p.offsiteCopy, t.intake.offsite[g], (v) =>
                        updateProtection(g, { offsiteCopy: v }),
                      )}
                      {toggle(p.immutableCopy, t.intake.immutable, (v) =>
                        updateProtection(g, { immutableCopy: v }),
                      )}
                      {toggle(p.secondSite, t.intake.secondSite[g], (v) =>
                        updateProtection(g, { secondSite: v }),
                      )}
                    </div>
                  </div>
                );
              })}

            {step === 3 && (
              <div>
                <p className="text-[13px] leading-relaxed text-muted">{t.intake.security.intro}</p>
                <div className="mt-3">
                  {toggle(advanced, t.intake.security.advancedToggle, setAdvanced)}
                </div>
                <div className="mt-3 grid gap-2">
                  {(["govern", "identify", "protect", "detect", "respond"] as const).map((fn) => {
                    const labels = (
                      advanced ? t.intake.security.controlsCsf : t.intake.security.controls
                    ) as Record<string, string>;
                    const controls = SECURITY_CONTROLS.filter(
                      (c) => c.fn === fn && (advanced || c.depth === "core"),
                    );
                    const keys = controls.map((c) => c.key);
                    const setCount = keys.filter((k) => env.security?.[k] === true).length;
                    const open = openGroups[fn] ?? false;
                    return (
                      <div key={fn} className="rounded-xl border border-line bg-well/60">
                        <button
                          type="button"
                          onClick={() => setOpenGroups((s) => ({ ...s, [fn]: !open }))}
                          aria-expanded={open}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-text"
                        >
                          <ShieldCheck className="h-4 w-4 shrink-0 text-signal" strokeWidth={2} />
                          <span className="flex-1">{t.intake.security.groups[fn]}</span>
                          <span
                            className={`chip shrink-0 ${setCount > 0 ? "chip-ok" : "chip-neutral"}`}
                          >
                            {setCount}/{keys.length}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        {open && (
                          <div className="border-t border-line-soft px-4 pb-4 pt-3">
                            <div className="mb-2 flex gap-4 text-[12px]">
                              <button
                                type="button"
                                onClick={() => bulkSetSecurity(keys, true)}
                                className="font-medium text-signal hover:underline"
                              >
                                {t.intake.security.allPresent}
                              </button>
                              <button
                                type="button"
                                onClick={() => bulkSetSecurity(keys, false)}
                                className="font-medium text-faint hover:underline"
                              >
                                {t.intake.security.clearGroup}
                              </button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {controls.map((c) => (
                                <Fragment key={c.key}>
                                  {toggle(env.security?.[c.key] === true, labels[c.key], (v) =>
                                    updateSecurity(c.key, v),
                                  )}
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Sticky action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost px-3 text-[13px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.intake.back}
          </button>
          {step < TOTAL - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
              disabled={!canAdvance}
              className="btn-primary px-6 text-sm"
            >
              {t.intake.next}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={onRun} disabled={!canRun} className="btn-primary px-6 text-sm">
              <Check className="h-4 w-4" />
              {t.intake.run}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
