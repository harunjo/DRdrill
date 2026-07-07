"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { fmtMinutes, type Assessment } from "@/lib/engine";

// Every card is screenshot-self-contained (R10): its own title, verdict, and
// a caption naming the tool and the "as described" framing.

function Card({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-lg border border-neutral-300 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-[10px] uppercase tracking-wide text-neutral-400">{caption}</span>
      </div>
      {children}
    </section>
  );
}

export function Report({
  t,
  assessment,
  drill,
}: {
  t: Dictionary;
  assessment: Assessment;
  drill: ReactNode;
}) {
  const a = assessment;
  const caption = `${t.appName}`;
  const dur = { unrecoverable: t.report.unrecoverable, ...t.report.units };
  const scoreColor =
    a.score >= 70 ? "text-green-600" : a.score >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="mt-10">
      <Card title={t.report.scoreTitle} caption={caption}>
        <div className={`mt-2 text-5xl font-bold ${scoreColor}`}>
          {a.score}
          <span className="text-2xl font-normal text-neutral-400">{t.report.scoreOutOf}</span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {fmt(t.report.coverage, { n: a.results.length })}
        </p>
        <div className="mt-3 text-sm text-neutral-600">
          {t.report.rule321Title}: {a.rule321.threeCopies ? "✅" : "❌"}{" "}
          {t.report.rule321.threeCopies} · {a.rule321.twoMedia ? "✅" : "❌"}{" "}
          {t.report.rule321.twoMedia} · {a.rule321.oneOffsite ? "✅" : "❌"}{" "}
          {t.report.rule321.oneOffsite}
        </div>
      </Card>

      <Card title={t.report.gapTitle} caption={caption}>
        <div className="mt-3 space-y-3 sm:hidden">
          {a.results.map((r) => (
            <div key={r.workload.id} className="rounded border border-neutral-200 p-2 text-sm">
              <div className="font-medium">{r.workload.name}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                <span className="text-neutral-500">{t.report.target}</span>
                <span className={r.rpoMeets ? "text-green-600" : "text-red-600"}>
                  {t.report.achievableRpo}
                </span>
                <span className={r.rtoMeets ? "text-green-600" : "text-red-600"}>
                  {t.report.achievableRto}
                </span>
                <span className="text-neutral-500">
                  {fmtMinutes(a.findings.workloads.find((w) => w.label === r.label)!.targetRpoMin, dur)}{" "}
                  / {fmtMinutes(a.findings.workloads.find((w) => w.label === r.label)!.targetRtoMin, dur)}
                </span>
                <span className={r.rpoMeets ? "text-green-600" : "text-red-600"}>
                  {fmtMinutes(r.achievableRpoMin, dur)}
                </span>
                <span className={r.rtoMeets ? "text-green-600" : "text-red-600"}>
                  {fmtMinutes(r.achievableRtoMin, dur)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <table className="mt-3 hidden w-full border-collapse text-sm sm:table">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="py-1 pr-2 font-medium">{t.report.workload}</th>
              <th className="py-1 pr-2 font-medium">{t.report.target}</th>
              <th className="py-1 pr-2 font-medium">{t.report.achievableRpo}</th>
              <th className="py-1 font-medium">{t.report.achievableRto}</th>
            </tr>
          </thead>
          <tbody>
            {a.results.map((r) => {
              const f = a.findings.workloads.find((w) => w.label === r.label)!;
              return (
                <tr key={r.workload.id} className="border-b">
                  <td className="py-1.5 pr-2">{r.workload.name}</td>
                  <td className="py-1.5 pr-2 text-neutral-500">
                    {fmtMinutes(f.targetRpoMin, dur)} / {fmtMinutes(f.targetRtoMin, dur)}
                  </td>
                  <td className={`py-1.5 pr-2 ${r.rpoMeets ? "text-green-600" : "text-red-600"}`}>
                    {fmtMinutes(r.achievableRpoMin, dur)}
                  </td>
                  <td className={`py-1.5 ${r.rtoMeets ? "text-green-600" : "text-red-600"}`}>
                    {fmtMinutes(r.achievableRtoMin, dur)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title={t.report.flagsTitle} caption={caption}>
        <div className="mt-3 space-y-3">
          {a.flags.map((f, i) => {
            const copy = t.report.flags[f.code];
            return (
              <div
                key={`${f.code}-${f.scope}-${i}`}
                className={`rounded border p-3 text-sm ${
                  f.severity === "critical"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="font-semibold">{copy.title}</div>
                <div className="mt-1 text-neutral-700">{copy.detail}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={t.drill.title} caption={caption}>
        {drill}
      </Card>
    </div>
  );
}
