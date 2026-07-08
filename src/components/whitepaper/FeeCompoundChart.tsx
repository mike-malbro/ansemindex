/** Simple SVG: 1% fee → claim → reinvest compound loop */
export function FeeCompoundChart({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 200"
      className={`w-full max-w-lg ${className}`}
      role="img"
      aria-label="1% swap fee accrues to LPs, then claim and reinvest to compound"
    >
      <rect width="480" height="200" fill="#09090b" rx="8" />
      {/* Volume bar */}
      <rect x="40" y="40" width="100" height="44" rx="6" fill="#18181b" stroke="#3f3f46" />
      <text
        x="90"
        y="58"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        Swap volume
      </text>
      <text
        x="90"
        y="72"
        textAnchor="middle"
        fill="#fbbf24"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        1% fee
      </text>
      <path d="M150 62 H190" stroke="#52525b" strokeWidth="1.5" />
      {/* LP earns */}
      <rect x="190" y="40" width="100" height="44" rx="6" fill="#18181b" stroke="#3f3f46" />
      <text
        x="240"
        y="58"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        LP earns
      </text>
      <text
        x="240"
        y="72"
        textAnchor="middle"
        fill="#86efac"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        claim fees
      </text>
      <path d="M300 62 H340" stroke="#52525b" strokeWidth="1.5" />
      {/* Reinvest */}
      <rect x="340" y="40" width="100" height="44" rx="6" fill="#18181b" stroke="#f59e0b" />
      <text
        x="390"
        y="58"
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        Buy + seed
      </text>
      <text
        x="390"
        y="72"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        compound
      </text>
      {/* Loop arrow back */}
      <path
        d="M390 90 V130 H90 V90"
        fill="none"
        stroke="#3f3f46"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text
        x="240"
        y="148"
        textAnchor="middle"
        fill="#71717a"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        reinvest loop (no burn)
      </text>
      <text
        x="240"
        y="180"
        textAnchor="middle"
        fill="#52525b"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
      >
        Fee goes to LPs — not to this website
      </text>
    </svg>
  );
}
