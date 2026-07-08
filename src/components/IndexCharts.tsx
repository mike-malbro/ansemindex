"use client";

import { useMemo, useState } from "react";
import type { IndexPayload } from "@/lib/types";
import { PieChart, consolidateSlices, type PieSlice } from "./PieChart";

type Props = {
  data: IndexPayload;
  /** When a pool slice is clicked */
  onPoolSelect?: (poolAddress: string | null) => void;
  selectedPoolId?: string | null;
  compact?: boolean;
};

export function IndexCharts({
  data,
  onPoolSelect,
  selectedPoolId,
  compact = false,
}: Props) {
  const [feeFocus, setFeeFocus] = useState<string | null>(null);

  const composition = useMemo(() => {
    const slices: PieSlice[] = data.pools.map((p) => ({
      id: p.pool_address,
      label: p.token_symbol,
      value: Number(p.position_value_usd) || 0,
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 1.2 });
  }, [data.pools]);

  const fees = useMemo(() => {
    const slices: PieSlice[] = data.pools.map((p) => ({
      id: `fee-${p.pool_address}`,
      label: p.token_symbol,
      value:
        (Number(p.unclaimed_fees_usd) || 0) +
        (Number(p.claimed_fees_usd) || 0),
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 1.2 });
  }, [data.pools]);

  const size = compact ? 160 : 200;

  return (
    <section
      className={`grid gap-6 rounded border border-zinc-800 bg-zinc-900/30 p-4 ${
        compact ? "sm:grid-cols-2" : "lg:grid-cols-2"
      }`}
    >
      <PieChart
        title="Index composition"
        slices={composition}
        size={size}
        selectedId={selectedPoolId}
        onSelect={(s) => {
          if (!onPoolSelect) return;
          if (!s || s.id === "__other") {
            onPoolSelect(null);
            return;
          }
          onPoolSelect(s.id);
        }}
      />
      <PieChart
        title="Fees by pool"
        slices={fees}
        size={size}
        selectedId={feeFocus}
        onSelect={(s) => {
          setFeeFocus(s?.id ?? null);
          if (onPoolSelect && s && s.id !== "__other") {
            onPoolSelect(s.id.replace(/^fee-/, ""));
          }
        }}
      />
    </section>
  );
}
