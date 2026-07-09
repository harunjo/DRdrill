import type { Dictionary } from "@/lib/i18n";
import { radarSpokes, type PostureScores } from "@/lib/posture";

// Radius of the value area; the viewBox leaves room for labels beyond it.
const R = 76;

function toneFor(score: number): string {
  if (score >= 70) return "var(--color-ok)";
  if (score >= 40) return "var(--color-warn)";
  return "var(--color-crit)";
}

/** Per-function CSF posture as a spider chart. Assessed functions draw a colored
 *  bar to their score; not-assessed ones show a dashed axis and "not yet
 *  assessed" — never a zero (R2, R3). No blended overall number. */
export function PostureRadar({ t, scores }: { t: Dictionary; scores: PostureScores }) {
  const csf = t.report.csf;
  const spokes = radarSpokes(scores, R);
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="panel mt-4 p-5 sm:p-6">
      <div className="text-[13px] font-semibold">{csf.title}</div>
      <p className="mt-0.5 text-[12px] text-faint">{csf.subtitle}</p>
      <div className="mt-3 flex justify-center">
        <svg
          viewBox="-130 -116 260 244"
          className="w-full max-w-[360px]"
          role="img"
          aria-label={csf.title}
        >
          {rings.map((f) => (
            <circle
              key={f}
              cx={0}
              cy={0}
              r={R * f}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={0.5}
            />
          ))}
          {spokes.map((s) => {
            const assessed = s.score != null;
            const anchor = Math.abs(s.axis.x) < 1 ? "middle" : s.axis.x > 0 ? "start" : "end";
            const lx = s.axis.x * 1.16;
            const ly = s.axis.y * 1.16;
            const tone = assessed ? toneFor(s.score as number) : "var(--color-faint)";
            return (
              <g key={s.fn}>
                <line
                  x1={0}
                  y1={0}
                  x2={s.axis.x}
                  y2={s.axis.y}
                  stroke="var(--color-line)"
                  strokeWidth={0.5}
                  strokeDasharray={assessed ? undefined : "3 3"}
                />
                {assessed && (
                  <>
                    <line
                      x1={0}
                      y1={0}
                      x2={s.point.x}
                      y2={s.point.y}
                      stroke={tone}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <circle cx={s.point.x} cy={s.point.y} r={3} fill={tone} />
                  </>
                )}
                <text
                  x={lx}
                  y={ly - 3}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fontSize={8.5}
                  fontWeight={assessed ? 600 : 400}
                  fill="var(--color-muted)"
                >
                  {csf.functions[s.fn]}
                </text>
                <text
                  x={lx}
                  y={ly + 7}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fontSize={7.5}
                  fill={tone}
                >
                  {assessed ? String(s.score) : csf.notAssessed}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
