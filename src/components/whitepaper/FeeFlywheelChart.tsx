import { ANSEM_TARGET_PCT } from "@/lib/thesis";

/** Simple SVG: fee flywheel to 70% then buybacks */
export function FeeFlywheelChart({ className = "" }: { className?: string }) {
  const pct = Math.round(ANSEM_TARGET_PCT * 100);
  return (
    <svg
      viewBox="0 0 520 160"
      className={`w-full max-w-2xl ${className}`}
      role="img"
      aria-label={`Fee flywheel: creator fees buy tokens until ${pct}% ANSEM then all buybacks`}
    >
      <rect width="520" height="160" fill="#09090b" rx="8" />
      {[
        { x: 16, label: "Creator\nfees", sub: "" },
        { x: 130, label: "Buy tokens\n/ ANSEM", sub: "" },
        { x: 260, label: `< ${pct}%`, sub: "send / seed" },
        { x: 390, label: `≥ ${pct}%`, sub: "all buybacks" },
      ].map((box, i) => (
        <g key={box.label}>
          <rect
            x={box.x}
            y="36"
            width="100"
            height="56"
            rx="8"
            fill={i === 3 ? "#1c1917" : "#18181b"}
            stroke={i === 3 ? "#f59e0b" : "#3f3f46"}
            strokeWidth="1.5"
          />
          {box.label.split("\n").map((line, li) => (
            <text
              key={line}
              x={box.x + 50}
              y={58 + li * 14}
              textAnchor="middle"
              fill="#e4e4e7"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {line}
            </text>
          ))}
          {box.sub ? (
            <text
              x={box.x + 50}
              y="102"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
            >
              {box.sub}
            </text>
          ) : null}
          {i < 3 ? (
            <text
              x={box.x + 110}
              y="68"
              fill="#52525b"
              fontSize="14"
              fontFamily="ui-monospace, monospace"
            >
              →
            </text>
          ) : null}
        </g>
      ))}
      <text
        x="260"
        y="140"
        textAnchor="middle"
        fill="#71717a"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        Build ANSEM share to {pct}%, then flip to buybacks
      </text>
    </svg>
  );
}
