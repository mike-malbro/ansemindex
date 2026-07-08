/** Simple SVG: two-sided liquidity pool */
export function PoolDiagram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 220"
      className={`w-full max-w-lg ${className}`}
      role="img"
      aria-label="Liquidity pool diagram: traders swap through a pool of TOKEN and ANSEM; LPs deposit both sides"
    >
      <rect width="480" height="220" fill="#09090b" rx="8" />
      {/* Pool jar */}
      <rect
        x="150"
        y="50"
        width="180"
        height="120"
        rx="12"
        fill="#18181b"
        stroke="#3f3f46"
        strokeWidth="2"
      />
      <text
        x="240"
        y="42"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        Liquidity pool
      </text>
      {/* Token A */}
      <circle cx="200" cy="100" r="28" fill="#27272a" stroke="#fbbf24" strokeWidth="1.5" />
      <text
        x="200"
        y="104"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        TOKEN
      </text>
      {/* Token B */}
      <circle cx="280" cy="100" r="28" fill="#27272a" stroke="#38bdf8" strokeWidth="1.5" />
      <text
        x="280"
        y="104"
        textAnchor="middle"
        fill="#7dd3fc"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        ANSEM
      </text>
      <text
        x="240"
        y="150"
        textAnchor="middle"
        fill="#71717a"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        dual-sided
      </text>
      {/* Trader left */}
      <text
        x="50"
        y="95"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        Trader
      </text>
      <path d="M90 100 H140" stroke="#52525b" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M140 115 H90" stroke="#52525b" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x="115" y="92" textAnchor="middle" fill="#71717a" fontSize="8">
        swap
      </text>
      {/* LP right */}
      <text
        x="420"
        y="95"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        LP
      </text>
      <path d="M340 100 H380" stroke="#52525b" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="360" y="92" textAnchor="middle" fill="#71717a" fontSize="8">
        deposit
      </text>
      <text
        x="240"
        y="200"
        textAnchor="middle"
        fill="#52525b"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        Traders swap · LPs earn fees
      </text>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#52525b" />
        </marker>
        <marker id="arrow2" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
          <path d="M6,0 L0,3 L6,6 Z" fill="#52525b" />
        </marker>
      </defs>
    </svg>
  );
}
