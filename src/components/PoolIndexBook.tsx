"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  EnrichedPosition,
  IndexPayload,
  IndexPoolRow,
  PortfolioPayload,
} from "@/lib/types";
import {
  changeTone,
  fmtMoney,
  fmtPct,
  fmtPctShort,
  meteoraPoolUrl,
  shortCa,
  solscanAccount,
  solscanToken,
} from "@/lib/format";
import { REFRESH_INTERVAL_MS } from "@/lib/config";
import { PieChart, consolidateSlices } from "./PieChart";
import { HolderPanel } from "./HolderPanel";

type Horizon = "5m" | "1h" | "6h" | "24h";
type SortKey =
  | "share"
  | "your_pct"
  | "mcap"
  | "amount"
  | "generated"
  | "claimed"
  | "compounded"
  | "unclaimed"
  | Horizon;

const HORIZONS: Horizon[] = ["5m", "1h", "6h", "24h"];

type BookRow = IndexPoolRow & {
  /** This wallet’s % of the pool (LP ÷ TVL). 0 if not in pool. */
  your_pool_pct: number;
  your_lp_usd: number;
};

function changeFor(p: IndexPoolRow, h: Horizon): number | null {
  switch (h) {
    case "5m":
      return p.price_change_5m;
    case "1h":
      return p.price_change_1h;
    case "6h":
      return p.price_change_6h;
    case "24h":
      return p.price_change_24h;
  }
}

function mergeWalletOntoIndex(
  index: IndexPayload,
  portfolio: PortfolioPayload | null,
): BookRow[] {
  const byPool = new Map<string, EnrichedPosition>();
  for (const p of portfolio?.positions ?? []) {
    byPool.set(p.pool_address.toLowerCase(), p);
  }
  return index.pools.map((row) => {
    const mine = byPool.get(row.pool_address.toLowerCase());
    return {
      ...row,
      your_pool_pct: mine?.share_of_pool_pct ?? 0,
      your_lp_usd: mine?.position_value_usd ?? 0,
    };
  });
}

export type PoolIndexBookProps = {
  embedded?: boolean;
  /**
   * index = full pool book (default).
   * wallet = same book, with this pubkey’s pool % overlaid.
   */
  mode?: "index" | "wallet";
  /** Pubkey whose Index pool % to show (Creator / Wallet tabs). */
  wallet?: string | null;
  title?: string;
  subtitle?: string;
  refreshLabel?: string;
  lead?: ReactNode;
  caption?: string;
};

/**
 * The pool book. Index / Creator / Wallet all render this — same board.
 * Wallet mode adds Your % (LP ÷ pool TVL) on every Index pool row.
 */
export function PoolIndexBook({
  embedded = false,
  mode = "index",
  wallet = null,
  title,
  subtitle,
  refreshLabel,
  lead,
  caption,
}: PoolIndexBookProps) {
  const isWalletMode = mode === "wallet";
  const [data, setData] = useState<IndexPayload | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IndexPoolRow | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(
    isWalletMode ? "your_pct" : "24h",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(
    async (refresh = false) => {
      try {
        const url = refresh ? "/api/index?refresh=1" : "/api/index";
        const indexPromise = fetch(url, { cache: "no-store" });
        const portfolioPromise =
          isWalletMode && wallet
            ? fetch(`/api/portfolio?wallet=${encodeURIComponent(wallet)}`, {
                cache: "no-store",
              })
            : Promise.resolve(null);

        const [indexRes, portRes] = await Promise.all([
          indexPromise,
          portfolioPromise,
        ]);

        if (!indexRes.ok) {
          const body = await indexRes.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${indexRes.status}`);
        }
        setData((await indexRes.json()) as IndexPayload);

        if (portRes) {
          if (!portRes.ok) {
            const body = await portRes.json().catch(() => ({}));
            throw new Error(body.error || "Wallet pool % lookup failed");
          }
          setPortfolio((await portRes.json()) as PortfolioPayload);
        } else {
          setPortfolio(null);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [isWalletMode, wallet],
  );

  useEffect(() => {
    setLoading(true);
    load(true);
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      load(ticks % 4 === 0);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const pool = new URLSearchParams(window.location.search).get("pool");
    if (!pool) return;
    const row = data.pools.find((p) => p.pool_address === pool);
    if (row) setSelected(row);
  }, [data]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const bookRows = useMemo(() => {
    if (!data) return [];
    return isWalletMode ? mergeWalletOntoIndex(data, portfolio) : data.pools.map((p) => ({
      ...p,
      your_pool_pct: 0,
      your_lp_usd: 0,
    }));
  }, [data, portfolio, isWalletMode]);

  const pools = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = bookRows;
    if (q) {
      rows = rows.filter(
        (p) =>
          p.token_symbol.toLowerCase().includes(q) ||
          (p.pool_name ?? "").toLowerCase().includes(q) ||
          p.pool_address.toLowerCase().includes(q) ||
          p.token_mint.toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...rows];
    sorted.sort((a, b) => {
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
        case "share":
          return dir * ((a.share_pct ?? 0) - (b.share_pct ?? 0));
        case "your_pct":
          return dir * (a.your_pool_pct - b.your_pool_pct);
        case "mcap":
          return cmpNullable(a.market_cap_usd, b.market_cap_usd);
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
    return sorted;
  }, [bookRows, query, sortKey, sortDir]);

  const composition = useMemo(() => {
    if (!data) return [];
    return consolidateSlices(
      data.pools.map((p) => ({
        id: p.pool_address,
        label: p.token_symbol,
        value: Number(p.position_value_usd) || 0,
      })),
      { maxSlices: 10, minPct: 1.2 },
    );
  }, [data]);

  const feePie = useMemo(() => {
    if (!data) return [];
    return consolidateSlices(
      data.pools.map((p) => ({
        id: `fee-${p.pool_address}`,
        label: p.token_symbol,
        value: Number(p.fees_generated_usd) || 0,
      })),
      { maxSlices: 10, minPct: 1.2 },
    );
  }, [data]);

  const yourPctPie = useMemo(() => {
    if (!isWalletMode) return [];
    return consolidateSlices(
      bookRows.map((p) => ({
        id: p.pool_address,
        label: p.token_symbol,
        value: Math.max(0, p.your_pool_pct),
      })),
      { maxSlices: 10, minPct: 1.2 },
    );
  }, [bookRows, isWalletMode]);

  const mapLabel = (addr: string) =>
    data?.map_wallets?.find(
      (m) => m.address.toLowerCase() === addr.toLowerCase(),
    )?.label ?? shortCa(addr, 4, 4);

  const poolsWithShare = bookRows.filter((p) => p.your_pool_pct > 0).length;
  const avgYourPct =
    poolsWithShare > 0
      ? bookRows
          .filter((p) => p.your_pool_pct > 0)
          .reduce((s, p) => s + p.your_pool_pct, 0) / poolsWithShare
      : 0;

  const heading = title ?? (isWalletMode ? "Wallet" : "Index");
  const sub =
    subtitle ??
    (isWalletMode
      ? "Same Index pool book. Your % = this pubkey’s LP ÷ pool TVL on each TOKEN–ANSEM pool."
      : "DAMM v2 TOKEN–ANSEM pools. Share % weights the book. $ANSEMLP creator fees buy ANSEM ($0 until live). Map wallets auto-ingest.");
  const refreshText = refreshLabel ?? (isWalletMode ? "Refresh" : "Refresh index");
  const footNote =
    caption ??
    (isWalletMode
      ? "Exact same pool book as Index — Your % is this wallet’s share of each pool."
      : "$ANSEMLP creator fees buy ANSEM toward the 70% gate. Fees are $0 until live.");

  return (
    <div
      className={`mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 ${
        embedded ? "" : "min-h-screen"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            {heading}
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            {sub}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load(true);
          }}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500"
        >
          {refreshText}
        </button>
      </div>

      {lead}

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="py-20 text-center font-mono text-sm text-zinc-500">
          Loading pools…
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Index amount"
              value={fmtMoney(data.total_position_usd)}
            />
            {isWalletMode ? (
              <>
                <Stat
                  label="Your pools"
                  value={String(poolsWithShare)}
                  sub="share > 0%"
                />
                <Stat
                  label="Avg your %"
                  value={fmtPct(avgYourPct)}
                  valueClass="text-emerald-300"
                  sub="LP ÷ pool TVL"
                />
              </>
            ) : (
              <>
                <Stat
                  label="All-time generated"
                  value={fmtMoney(data.total_fees_generated_usd)}
                  valueClass="text-emerald-300"
                  sub="90% compound / 10% claim"
                />
                <Stat
                  label="All-time claimed"
                  value={fmtMoney(data.total_claimed_fees_usd)}
                  sub="10% quote"
                />
              </>
            )}
            <Stat
              label="Compounded"
              value={fmtMoney(data.total_compounded_fees_usd)}
              sub="90% into LP"
            />
            <Stat label="Unclaimed" value={fmtMoney(data.total_fees_usd)} />
          </section>

          <section className="grid gap-4 rounded border border-zinc-800 bg-zinc-900/30 p-4 lg:grid-cols-2">
            <PieChart
              title={isWalletMode ? "Your % by pool" : "Index weights"}
              slices={isWalletMode ? yourPctPie : composition}
              size={180}
              formatValue={isWalletMode ? (n) => fmtPct(n) : undefined}
              emptyLabel={isWalletMode ? "0% everywhere" : "No data"}
              selectedId={selected?.pool_address ?? null}
              onSelect={(s) => {
                if (!s || s.id === "__other") {
                  setSelected(null);
                  return;
                }
                setSelected(
                  data.pools.find((p) => p.pool_address === s.id) ?? null,
                );
              }}
            />
            <PieChart
              title="Fees by pool"
              slices={feePie}
              size={180}
              onSelect={(s) => {
                if (!s || s.id === "__other") return;
                const addr = s.id.replace(/^fee-/, "");
                setSelected(
                  data.pools.find((p) => p.pool_address === addr) ?? null,
                );
              }}
            />
          </section>
          <p className="font-mono text-[10px] text-zinc-600">{footNote}</p>

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
                  {isWalletMode && (
                    <th className="px-3 py-2 text-right">
                      <SortBtn
                        label="Your %"
                        active={sortKey === "your_pct"}
                        dir={sortDir}
                        onClick={() => toggleSort("your_pct")}
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 text-right">
                    <SortBtn
                      label="Share"
                      active={sortKey === "share"}
                      dir={sortDir}
                      onClick={() => toggleSort("share")}
                    />
                  </th>
                  <th className="px-3 py-2 text-right">
                    <SortBtn
                      label="Mcap"
                      active={sortKey === "mcap"}
                      dir={sortDir}
                      onClick={() => toggleSort("mcap")}
                    />
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
                    Map
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                    Links
                  </th>
                </tr>
              </thead>
              <tbody>
                {pools.map((p, i) => {
                  const sel = selected?.pool_address === p.pool_address;
                  return (
                    <tr
                      key={p.pool_address}
                      onClick={() => setSelected(sel ? null : p)}
                      className={`cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-900/70 ${
                        sel ? "bg-zinc-900" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-sm text-zinc-100">
                          {p.token_symbol}
                          <span className="text-zinc-500">–ANSEM</span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-600">
                          {shortCa(p.pool_address)}
                        </div>
                      </td>
                      {isWalletMode && (
                        <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-emerald-300/90">
                          {fmtPct(p.your_pool_pct)}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-emerald-200/90">
                        {(p.share_pct ?? 0).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-200">
                        {fmtMoney(p.market_cap_usd)}
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
                      <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-500">
                        {(p.map_wallets ?? []).map(mapLabel).join(" · ") || "—"}
                      </td>
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-2 font-mono text-[10px]">
                          <a
                            href={solscanToken(p.token_mint)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:underline"
                          >
                            Token
                          </a>
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
                })}
              </tbody>
            </table>
          </div>

          {selected && (
            <div id="pool-drill" className="scroll-mt-4">
              <HolderPanel
                pool={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}

          <footer className="border-t border-zinc-800 pt-4 font-mono text-[10px] text-zinc-600">
            {isWalletMode && wallet ? (
              <>
                Wallet{" "}
                <a
                  href={solscanAccount(wallet)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-sky-400"
                >
                  {shortCa(wallet, 6, 6)}
                </a>{" "}
                · same Index pool book · Your % = LP ÷ TVL
              </>
            ) : (
              <>
                Mapped from{" "}
                {(data.map_wallets ?? data.wallets).map((m, i) => (
                  <span key={m.address}>
                    {i > 0 ? " + " : ""}
                    <a
                      href={solscanAccount(m.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-sky-400"
                    >
                      {m.label}
                    </a>
                  </span>
                ))}{" "}
                · discovery only · pubkeys · synced{" "}
                {data.ingested_at
                  ? new Date(data.ingested_at).toLocaleString()
                  : "—"}
              </>
            )}
          </footer>
        </>
      )}
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
