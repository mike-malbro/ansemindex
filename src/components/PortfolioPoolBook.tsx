"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { EnrichedPosition } from "@/lib/types";
import {
  changeTone,
  fmtMoney,
  fmtPctShort,
  meteoraPoolUrl,
  shortCa,
  solscanToken,
} from "@/lib/format";
import { PieChart, consolidateSlices } from "./PieChart";

type Horizon = "5m" | "1h" | "6h" | "24h";
type SortKey =
  | "amount"
  | "generated"
  | "claimed"
  | "compounded"
  | "unclaimed"
  | Horizon;

const HORIZONS: Horizon[] = ["5m", "1h", "6h", "24h"];

function changeFor(p: EnrichedPosition, h: Horizon): number | null {
  switch (h) {
    case "5m":
      return p.price_change_5m ?? null;
    case "1h":
      return p.price_change_1h ?? null;
    case "6h":
      return p.price_change_6h ?? null;
    case "24h":
      return p.price_change_24h ?? null;
  }
}

export type BookFeeTotals = {
  unclaimed_usd: number;
  claimed_usd: number;
  compounded_usd: number;
  generated_usd: number;
  compound_pct?: number;
  claim_pct?: number;
};

type Props = {
  title: string;
  subtitle: string;
  refreshLabel?: string;
  onRefresh: () => void;
  refreshing?: boolean;
  /** Optional strip above stats (e.g. pubkey, gate bar). */
  lead?: ReactNode;
  caption?: string;
  amountLabel?: string;
  amountUsd: number;
  poolCount: number;
  fees: BookFeeTotals;
  positions: EnrichedPosition[];
  emptyMessage?: string;
};

/**
 * Same board as Index: stats → dual pies → filter/horizons → pool table.
 * Used by Creator fees + Wallet so all three tabs match.
 */
export function PortfolioPoolBook({
  title,
  subtitle,
  refreshLabel = "Refresh",
  onRefresh,
  refreshing,
  lead,
  caption,
  amountLabel = "Amount",
  amountUsd,
  poolCount,
  fees,
  positions,
  emptyMessage = "No open TOKEN–ANSEM pools.",
}: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("24h");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string | null>(null);

  const compoundPct = fees.compound_pct ?? 90;
  const claimPct = fees.claim_pct ?? 10;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const pools = useMemo(() => {
    let rows = [...(positions ?? [])];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          (p.ticker ?? "").toLowerCase().includes(q) ||
          (p.pool_name ?? "").toLowerCase().includes(q) ||
          (p.pool_address ?? "").toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const cmpNullable = (
        av: number | null | undefined,
        bv: number | null | undefined,
      ) => {
        const aMissing = av == null || Number.isNaN(av);
        const bMissing = bv == null || Number.isNaN(bv);
        if (aMissing && bMissing) return 0;
        if (aMissing) return 1;
        if (bMissing) return -1;
        return dir * (av! - bv!);
      };
      switch (sortKey) {
        case "amount":
          return dir * (a.position_value_usd - b.position_value_usd);
        case "generated":
          return dir * (a.fees_generated_usd - b.fees_generated_usd);
        case "claimed":
          return dir * (a.claimed_fees_usd - b.claimed_fees_usd);
        case "compounded":
          return dir * (a.compounded_fees_usd - b.compounded_fees_usd);
        case "unclaimed":
          return dir * (a.unclaimed_fees_usd - b.unclaimed_fees_usd);
        case "5m":
        case "1h":
        case "6h":
        case "24h":
          return cmpNullable(changeFor(a, sortKey), changeFor(b, sortKey));
        default:
          return 0;
      }
    });
    return rows;
  }, [positions, query, sortKey, sortDir]);

  const composition = useMemo(
    () =>
      consolidateSlices(
        (positions ?? []).map((p) => ({
          id: p.pool_address,
          label: p.ticker || "?",
          value: Number(p.position_value_usd) || 0,
        })),
        { maxSlices: 10, minPct: 1.2 },
      ),
    [positions],
  );

  const feePie = useMemo(
    () =>
      consolidateSlices(
        (positions ?? []).map((p) => ({
          id: `fee-${p.pool_address}`,
          label: p.ticker || "?",
          value: Number(p.fees_generated_usd) || 0,
        })),
        { maxSlices: 10, minPct: 1.2 },
      ),
    [positions],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            {title}
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : refreshLabel}
        </button>
      </div>

      {lead}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Pools" value={String(poolCount)} />
        <Stat label={amountLabel} value={fmtMoney(amountUsd)} />
        <Stat
          label="All-time generated"
          value={fmtMoney(fees.generated_usd)}
          valueClass="text-emerald-300"
          sub={`${compoundPct}% compound / ${claimPct}% claim`}
        />
        <Stat
          label="All-time claimed"
          value={fmtMoney(fees.claimed_usd)}
          sub={`${claimPct}% quote`}
        />
        <Stat
          label="Compounded"
          value={fmtMoney(fees.compounded_usd)}
          sub={`${compoundPct}% into LP`}
        />
        <Stat label="Unclaimed" value={fmtMoney(fees.unclaimed_usd)} />
      </section>

      <section className="grid gap-4 rounded border border-zinc-800 bg-zinc-900/30 p-4 lg:grid-cols-2">
        <PieChart
          title="Weights"
          slices={composition}
          size={180}
          selectedId={selected}
          onSelect={(s) => {
            if (!s || s.id === "__other") {
              setSelected(null);
              return;
            }
            setSelected(s.id);
          }}
        />
        <PieChart
          title="Fees by pool"
          slices={feePie}
          size={180}
          onSelect={(s) => {
            if (!s || s.id === "__other") return;
            setSelected(s.id.replace(/^fee-/, ""));
          }}
        />
      </section>
      {caption && (
        <p className="font-mono text-[10px] text-zinc-600">{caption}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter ticker / pool…"
          className="w-full max-w-sm rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <div
          className="inline-flex items-center gap-0.5 rounded border border-zinc-800/80 bg-zinc-950/40 p-0.5"
          role="group"
          aria-label="Sort by price change"
        >
          {HORIZONS.map((h) => {
            const active = sortKey === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => toggleSort(h)}
                className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                  active
                    ? "bg-zinc-800/90 text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {h}
                {active && (
                  <span className="ml-1 text-zinc-500">
                    {sortDir === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[11px] text-zinc-500">
          {pools.length} pools
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-zinc-800">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="bg-zinc-900/80">
            <tr className="border-b border-zinc-800">
              <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                #
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                Pool
              </th>
              <th className="px-3 py-2 text-right">
                <SortBtn
                  label="Amount"
                  active={sortKey === "amount"}
                  dir={sortDir}
                  onClick={() => toggleSort("amount")}
                />
              </th>
              <th className="px-3 py-2 text-right">
                <SortBtn
                  label="Generated"
                  active={sortKey === "generated"}
                  dir={sortDir}
                  onClick={() => toggleSort("generated")}
                />
              </th>
              <th className="px-3 py-2 text-right">
                <SortBtn
                  label="Claimed"
                  active={sortKey === "claimed"}
                  dir={sortDir}
                  onClick={() => toggleSort("claimed")}
                />
              </th>
              <th className="px-3 py-2 text-right">
                <SortBtn
                  label="Compounded"
                  active={sortKey === "compounded"}
                  dir={sortDir}
                  onClick={() => toggleSort("compounded")}
                />
              </th>
              <th className="px-3 py-2 text-right">
                <SortBtn
                  label="Unclaimed"
                  active={sortKey === "unclaimed"}
                  dir={sortDir}
                  onClick={() => toggleSort("unclaimed")}
                />
              </th>
              {HORIZONS.map((h) => (
                <th key={h} className="px-2 py-2 text-right">
                  <SortBtn
                    label={h}
                    active={sortKey === h}
                    dir={sortDir}
                    onClick={() => toggleSort(h)}
                  />
                </th>
              ))}
              <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {pools.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-3 py-10 text-center font-mono text-xs text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pools.map((p, i) => {
                const sel = selected === p.pool_address;
                const tokenCa = p.constituent_token?.address;
                return (
                  <tr
                    key={p.position_address || `${p.pool_address}-${i}`}
                    onClick={() =>
                      setSelected(sel ? null : p.pool_address)
                    }
                    className={`cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-900/70 ${
                      sel ? "bg-zinc-900" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-sm text-zinc-100">
                        {p.ticker || p.pool_name}
                        <span className="text-zinc-500">–ANSEM</span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-600">
                        {shortCa(p.pool_address)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-100">
                      {fmtMoney(p.position_value_usd)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-emerald-300/90">
                      {fmtMoney(p.fees_generated_usd)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-300">
                      {fmtMoney(p.claimed_fees_usd)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-400">
                      {fmtMoney(p.compounded_fees_usd)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-300">
                      {fmtMoney(p.unclaimed_fees_usd)}
                    </td>
                    {HORIZONS.map((h) => {
                      const v = changeFor(p, h);
                      const focus = sortKey === h;
                      return (
                        <td
                          key={h}
                          className={`px-2 py-2.5 text-right font-mono text-[11px] tabular-nums tracking-tight ${changeTone(v)} ${
                            focus ? "opacity-100" : "opacity-50"
                          }`}
                        >
                          {fmtPctShort(v)}
                        </td>
                      );
                    })}
                    <td
                      className="px-3 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2 font-mono text-[10px]">
                        {tokenCa && (
                          <a
                            href={solscanToken(tokenCa)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:underline"
                          >
                            Token
                          </a>
                        )}
                        <a
                          href={meteoraPoolUrl(p.pool_address)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:underline"
                        >
                          Meteora
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortBtn({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-end gap-1 font-mono text-[10px] uppercase tracking-wider transition hover:text-zinc-200 ${
        active ? "text-zinc-200" : "text-zinc-500"
      }`}
    >
      {label}
      {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/60 px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${valueClass ?? "text-zinc-100"}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10px] text-zinc-500">{sub}</div>
      )}
    </div>
  );
}
