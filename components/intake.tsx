"use client";

import { useState } from "react";
import { fmt, type Dictionary } from "@/lib/i18n";
import {
  MAX_NAME_LENGTH,
  MAX_WORKLOADS,
  type DeploymentModel,
  type Environment,
  type Placement,
  type Protection,
  type Tier,
  type Workload,
  type WorkloadType,
} from "@/lib/engine";

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

const MODELS: DeploymentModel[] = ["onprem", "cloud", "hybrid", "private"];
const TYPES: WorkloadType[] = ["database", "vm", "files", "saas"];
const selectCls = "field px-2.5 py-2 text-sm";

// Localized step titles carry a "1. " prefix; the stepper renders its own
// numeral, so strip the leading number from the heading.
const stripNum = (s: string) => s.replace(/^\s*\d+\.\s*/, "");

export function Intake({
  t,
  env,
  onChange,
  onRun,
}: {
  t: Dictionary;
  env: Environment;
  onChange: (env: Environment) => void;
  onRun: () => void;
}) {
  const TOTAL = 3;
  const [step, setStep] = useState(0);

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

  const toggle = (checked: boolean, label: string, onToggle: (v: boolean) => void) => (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
        checked
          ? "border-signal bg-signal-soft text-signal"
          : "border-line text-muted hover:border-faint hover:text-text"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span>{label}</span>
    </label>
  );

  const titles = [t.intake.stepModel, t.intake.stepWorkloads, t.intake.stepProtection];
  const hints = [undefined, t.intake.workloadsHint, undefined];
  // Only the workloads step gates advancing; model always has a value and
  // protection is optional.
  const canAdvance = step === 1 ? canRun : true;

  return (
    <div className="mt-12">
      <section className="panel p-5 sm:p-7">
        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-signal" : "bg-line"}`}
            />
          ))}
        </div>
        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          {fmt(t.intake.stepCounter, { n: step + 1, total: TOTAL })}
        </div>

        {/* Step title */}
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal-soft text-[13px] font-bold text-signal-ink">
            {step + 1}
          </span>
          <div className="min-w-0">
            <h2 className="text-[19px] font-semibold tracking-tight">
              {stripNum(titles[step])}
            </h2>
            {hints[step] && <p className="mt-0.5 text-[13px] text-muted">{hints[step]}</p>}
          </div>
        </div>
        <div className="mt-4 rule" />

        {/* Step body */}
        <div className="mt-6 min-h-[9rem]">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODELS.map((m) => {
                const active = env.model === m;
                return (
                  <button
                    key={m}
                    onClick={() => onChange({ ...env, model: m })}
                    aria-pressed={active}
                    className={`rounded-lg border px-3 py-3 text-[13px] transition-colors ${
                      active
                        ? "border-signal bg-signal-soft font-semibold text-signal"
                        : "border-line text-muted hover:border-faint hover:text-text"
                    }`}
                  >
                    {t.intake.models[m]}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <>
              {env.workloads.map((w) => {
                const nameMissing = w.name.trim().length === 0;
                const sizeInvalid = !Number.isFinite(w.sizeGB) || w.sizeGB <= 0;
                return (
                  <div key={w.id} className="mt-3 rounded-xl border border-line bg-well p-4 first:mt-0">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="col-span-2">
                        <input
                          className="field w-full px-3 py-2 text-sm"
                          placeholder={t.intake.workloadName}
                          maxLength={MAX_NAME_LENGTH}
                          value={w.name}
                          onChange={(e) => updateWorkload(w.id, { name: e.target.value })}
                        />
                        <div className="mt-1 flex justify-between font-mono text-[11px] text-faint">
                          <span className="text-crit">
                            {nameMissing ? t.intake.errors.nameRequired : ""}
                          </span>
                          <span>
                            {w.name.length >= MAX_NAME_LENGTH - 10
                              ? t.intake.nameCounter.replace("{n}", String(w.name.length))
                              : ""}
                          </span>
                        </div>
                      </div>
                      <select
                        className={selectCls}
                        value={w.type}
                        onChange={(e) => updateWorkload(w.id, { type: e.target.value as WorkloadType })}
                      >
                        {TYPES.map((ty) => (
                          <option key={ty} value={ty}>
                            {t.intake.types[ty]}
                          </option>
                        ))}
                      </select>
                      <div>
                        <input
                          type="number"
                          min={1}
                          className="field w-full px-3 py-2 text-sm"
                          title={t.intake.sizeLabel}
                          value={Number.isFinite(w.sizeGB) ? w.sizeGB : ""}
                          onChange={(e) => updateWorkload(w.id, { sizeGB: Number(e.target.value) })}
                        />
                        {sizeInvalid && (
                          <div className="mt-1 font-mono text-[11px] text-crit">
                            {t.intake.errors.sizeInvalid}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        className={selectCls}
                        value={w.tier}
                        onChange={(e) => updateWorkload(w.id, { tier: Number(e.target.value) as Tier })}
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
                      <button
                        className="ml-auto font-mono text-xs text-faint transition-colors hover:text-crit"
                        onClick={() =>
                          onChange({ ...env, workloads: env.workloads.filter((x) => x.id !== w.id) })
                        }
                      >
                        {t.intake.remove}
                      </button>
                    </div>
                  </div>
                );
              })}
              {env.workloads.length < MAX_WORKLOADS ? (
                <button
                  className="mt-3 w-full rounded-lg border border-dashed border-line py-2.5 text-[13px] text-muted transition-colors hover:border-faint hover:text-text"
                  onClick={() => onChange({ ...env, workloads: [...env.workloads, emptyWorkload()] })}
                >
                  {t.intake.addWorkload}
                </button>
              ) : (
                <p className="mt-3 text-[13px] text-muted">{t.intake.errors.maxWorkloads}</p>
              )}
            </>
          )}

          {step === 2 &&
            groups.map((g) => {
              const p = env.protection[g] ?? emptyProtection;
              return (
                <div key={g} className="mt-3 rounded-xl border border-line bg-well p-4 first:mt-0">
                  {groups.length > 1 && (
                    <div className="mb-3 text-[13px] font-medium text-text">
                      {t.intake.protectionGroups[g]}
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted">
                      <span className="flex-1">{t.intake.freqLabel[g]}</span>
                      <input
                        type="number"
                        min={0}
                        className="field w-20 px-2 py-1 text-sm"
                        value={p.frequencyHours}
                        onChange={(e) => updateProtection(g, { frequencyHours: Number(e.target.value) })}
                      />
                    </label>
                    {toggle(p.replication, t.intake.replication, (v) =>
                      updateProtection(g, { replication: v }),
                    )}
                    {p.replication && (
                      <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted">
                        <span className="flex-1">{t.intake.replicationLag}</span>
                        <input
                          type="number"
                          min={0}
                          className="field w-20 px-2 py-1 text-sm"
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
        </div>

        {/* Navigation */}
        <div className="mt-7 rule" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:text-text disabled:pointer-events-none disabled:opacity-0"
          >
            ← {t.intake.back}
          </button>
          {step < TOTAL - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
              disabled={!canAdvance}
              className="btn-primary px-5 py-2 text-sm"
            >
              {t.intake.next} →
            </button>
          ) : (
            <button onClick={onRun} disabled={!canRun} className="btn-primary px-5 py-2 text-sm">
              {t.intake.run}
            </button>
          )}
        </div>
        {step === 1 && !canRun && (
          <p className="mt-3 text-right text-[13px] text-muted">{t.intake.zeroWorkloads}</p>
        )}
      </section>
    </div>
  );
}
