"use client";

import type { Dictionary } from "@/lib/i18n";
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

  return (
    <div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.intake.stepModel}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODELS.map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...env, model: m })}
              className={`rounded border px-3 py-3 text-sm transition-colors ${
                env.model === m
                  ? "border-blue-600 bg-blue-50 font-medium text-blue-900"
                  : "border-neutral-300 hover:border-blue-400"
              }`}
            >
              {t.intake.models[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.intake.stepWorkloads}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t.intake.workloadsHint}</p>
        {env.workloads.map((w) => {
          const nameMissing = w.name.trim().length === 0;
          const sizeInvalid = !Number.isFinite(w.sizeGB) || w.sizeGB <= 0;
          return (
            <div key={w.id} className="mt-3 rounded border border-neutral-300 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2">
                  <input
                    className="w-full rounded border px-2 py-1.5"
                    placeholder={t.intake.workloadName}
                    maxLength={MAX_NAME_LENGTH}
                    value={w.name}
                    onChange={(e) => updateWorkload(w.id, { name: e.target.value })}
                  />
                  <div className="mt-0.5 flex justify-between text-[11px] text-neutral-400">
                    <span className="text-red-600">
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
                  className="rounded border px-2 py-1.5"
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
                    className="w-full rounded border px-2 py-1.5"
                    title={t.intake.sizeLabel}
                    value={Number.isFinite(w.sizeGB) ? w.sizeGB : ""}
                    onChange={(e) => updateWorkload(w.id, { sizeGB: Number(e.target.value) })}
                  />
                  {sizeInvalid && (
                    <div className="mt-0.5 text-[11px] text-red-600">
                      {t.intake.errors.sizeInvalid}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <select
                  className="rounded border px-2 py-1.5 text-sm"
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
                    className="rounded border px-2 py-1.5 text-sm"
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
                  className="ml-auto text-sm text-red-500 hover:underline"
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
            className="mt-2 text-sm text-blue-600 hover:underline"
            onClick={() => onChange({ ...env, workloads: [...env.workloads, emptyWorkload()] })}
          >
            {t.intake.addWorkload}
          </button>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">{t.intake.errors.maxWorkloads}</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.intake.stepProtection}</h2>
        {groups.map((g) => {
          const p = env.protection[g] ?? emptyProtection;
          return (
            <div key={g} className="mt-3 rounded border border-neutral-300 p-3">
              {groups.length > 1 && (
                <div className="mb-2 text-sm font-medium">{t.intake.protectionGroups[g]}</div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{t.intake.freqLabel[g]}</span>
                  <input
                    type="number"
                    min={0}
                    className="w-20 rounded border px-2 py-1"
                    value={p.frequencyHours}
                    onChange={(e) => updateProtection(g, { frequencyHours: Number(e.target.value) })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.replication}
                    onChange={(e) => updateProtection(g, { replication: e.target.checked })}
                  />
                  {t.intake.replication}
                </label>
                {p.replication && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{t.intake.replicationLag}</span>
                    <input
                      type="number"
                      min={0}
                      className="w-20 rounded border px-2 py-1"
                      value={p.replicationLagMin}
                      onChange={(e) =>
                        updateProtection(g, { replicationLagMin: Number(e.target.value) })
                      }
                    />
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.offsiteCopy}
                    onChange={(e) => updateProtection(g, { offsiteCopy: e.target.checked })}
                  />
                  {t.intake.offsite[g]}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.immutableCopy}
                    onChange={(e) => updateProtection(g, { immutableCopy: e.target.checked })}
                  />
                  {t.intake.immutable}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.secondSite}
                    onChange={(e) => updateProtection(g, { secondSite: e.target.checked })}
                  />
                  {t.intake.secondSite[g]}
                </label>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-8">
        <button
          className="rounded bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          disabled={!canRun}
          onClick={onRun}
        >
          {t.intake.run}
        </button>
        {!canRun && <p className="mt-2 text-sm text-neutral-500">{t.intake.zeroWorkloads}</p>}
      </div>
    </div>
  );
}
