// DR Drill wordmark's icon — the Incident Timeline reduced to its essence:
// a recovery axis (data-loss ruler on the left, forward arrow on the right)
// struck at t=0 by the amber incident marker. currentColor drives the axis so
// it inherits ink; the marker is always the signal amber. Scales crisp from the
// 16px favicon up. aria-hidden — the wordmark text carries the name.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {/* recovery axis + forward arrowhead (RTO ►) */}
      <path
        d="M3.5 16 H27 M23 12 L27.5 16 L23 20"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* data-loss ruler ticks, left of the incident */}
      <path
        d="M8 12.75 V19.25 M11.5 14.25 V17.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* t=0 incident marker */}
      <path d="M16 4.5 V27.5" stroke="var(--color-event)" strokeWidth="2.6" strokeLinecap="round" />
      <rect
        x="12.6"
        y="12.6"
        width="6.8"
        height="6.8"
        rx="1.4"
        transform="rotate(45 16 16)"
        fill="var(--color-event)"
      />
    </svg>
  );
}
