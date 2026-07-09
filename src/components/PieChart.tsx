"use client";

import { useMemo, useState } from "react";
import { fmtMoney } from "@/lib/format";

export type PieSlice = {
  id: string;
  label: string;
  value: number;
  color?: string;
};

const PALETTE = [
  "#34d399",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#22d3ee",
  "#c084fc",
  "#4ade80",
  "#e879f9",
  "#fbbf24",
  "#60a5fa",
];

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

/** Collapse tiny slices into "Other" so the pie stays readable. */
export function consolidateSlices(
  slices: PieSlice[],
  opts?: { maxSlices?: number; minPct?: number },
): PieSlice[] {
  const maxSlices = opts?.maxSlices ?? 10;
  const minPct = opts?.minPct ?? 1.5;
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return [];

  const sorted = [...slices]
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const kept: PieSlice[] = [];
  let other = 0;
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]!;
    const pct = (s.value / total) * 100;
    if (kept.length < maxSlices - 1 && pct >= minPct) {
      kept.push(s);
    } else {
      other += s.value;
    }
  }
  if (other > 0) {
    kept.push({ id: "__other", label: "Other", value: other });
  }
  return kept;
}

type Props = {
  slices: PieSlice[];
  title?: string;
  size?: number;
  formatValue?: (n: number) => string;
  onSelect?: (slice: PieSlice | null) => void;
  selectedId?: string | null;
  emptyLabel?: string;
};

export function PieChart({
  slices,
  title,
  size = 200,
  formatValue = fmtMoney,
  onSelect,
  selectedId,
  emptyLabel = "No data",
}: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const prepared = useMemo(() => {
    const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
    if (total <= 0) return { total: 0, arcs: [] as (PieSlice & { start: number; end: number; color: string; pct: number })[] };

    let angle = 0;
    const arcs = slices.map((s, i) => {
      const span = (Math.max(0, s.value) / total) * 360;
      const start = angle;
      const end = angle + Math.max(span, 0.01);
      angle = end;
      return {
        ...s,
        start,
        end,
        color: s.color ?? PALETTE[i % PALETTE.length]!,
        pct: (s.value / total) * 100,
      };
    });
    return { total, arcs };
  }, [slices]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const activeId = hoverId ?? selectedId ?? null;
  const active = prepared.arcs.find((a) => a.id === activeId) ?? null;

  if (prepared.total <= 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        {title && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {title}
          </div>
        )}
        <div
          className="flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 font-mono text-[11px] text-zinc-600"
          style={{ width: size, height: size }}
        >
          {emptyLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-2">
        {title && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {title}
          </div>
        )}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="select-none"
          role="img"
          aria-label={title ?? "Pie chart"}
        >
          {prepared.arcs.map((a) => {
            const isActive = activeId === a.id;
            return (
              <path
                key={a.id}
                d={arcPath(cx, cy, isActive ? r + 2 : r, a.start, a.end)}
                fill={a.color}
                opacity={activeId && !isActive ? 0.35 : 0.95}
                stroke="#09090b"
                strokeWidth={1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoverId(a.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelect?.(selectedId === a.id ? null : a)}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.42} fill="#09090b" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-zinc-100"
            style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
          >
            {active ? active.label.slice(0, 10) : formatValue(prepared.total)}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="fill-zinc-500"
            style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
          >
            {active
              ? `${active.pct.toFixed(1)}% · ${formatValue(active.value)}`
              : "total"}
          </text>
        </svg>
      </div>

      <ul className="max-h-[220px] w-full max-w-[200px] space-y-1 overflow-y-auto font-mono text-[10px]">
        {prepared.arcs.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onMouseEnter={() => setHoverId(a.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect?.(selectedId === a.id ? null : a)}
              className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition ${
                activeId === a.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: a.color }}
              />
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
              <span className="tabular-nums text-zinc-500">
                {a.pct.toFixed(0)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
