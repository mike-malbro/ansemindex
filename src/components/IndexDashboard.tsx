"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IndexPayload, IndexPoolRow } from "@/lib/types";
import {
  fmtMoney,
  fmtPct,
  meteoraPoolUrl,
  pnlClass,
  shortCa,
  solscanAccount,
  solscanToken,
} from "@/lib/format";
import { REFRESH_INTERVAL_MS } from "@/lib/config";

type HoldersPayload = {
  mint: string;
  token_symbol: string | null;
  note: string;
  holders: {
    rank: number;
    owner: string;
    amountUi: number;
    pctOfTop: number;
    isController: boolean;
  }[];
};

export function IndexDashboard() {
  const [data, setData] = useState<IndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IndexPoolRow | null>(null);
  const [holders, setHolders] = useState<HoldersPayload | null>(null);
  const [holdersErr, setHoldersErr] = useState<string | null>(null);
  const [holdersLoading, setHoldersLoading] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? "/api/index?refresh=1" : "/api/index";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as IndexPayload;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      // Re-ingest from wallet every ~2 min; otherwise read DB
      const refresh = ticks % 4 === 0;
      load(refresh);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setHolders(null);
      return;
    }
    let cancelled = false;
    setHoldersLoading(true);
    setHoldersErr(null);
    fetch(
      `/api/pool/${selected.pool_address}/holders?mint=${encodeURIComponent(selected.token_mint)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}));
          throw new Error(b.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setHolders(j as HoldersPayload);
      })
      .catch((e) => {
        if (!cancelled)
          setHoldersErr(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setHoldersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const pools = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.pools;
    return data.pools.filter(
      (p) =>
        p.token_symbol.toLowerCase().includes(q) ||
        (p.pool_name ?? "").toLowerCase().includes(q) ||
        p.pool_address.toLowerCase().includes(q) ||
        p.token_mint.toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Index
          </h1>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">
            Controller wallet(0) open TOKEN–ANSEM pools — the map, not our
            treasury.
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
          Refresh index
        </button>
      </div>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="py-20 text-center font-mono text-sm text-zinc-500">
          Loading index…
        </div>
      )}

      {data && (
        <>
          {/* Wallet(0) + totals */}
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded border border-amber-900/40 bg-amber-950/15 px-3 py-3 sm:col-span-2 lg:col-span-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-200/70">
                wallet(0)
              </div>
              <a
                href={solscanAccount(data.wallet0)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block font-mono text-sm text-zinc-100 hover:text-sky-400"
                title={data.wallet0}
              >
                {shortCa(data.wallet0, 6, 6)}
              </a>
              <div className="mt-1 font-mono text-[10px] text-zinc-500">
                source · {data.source}
              </div>
            </div>
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Pool amount"
              value={fmtMoney(data.total_position_usd)}
              sub="controller LP value"
            />
            <Stat
              label="Fees earned"
              value={fmtMoney(data.total_fees_earned_usd)}
              sub={`${fmtMoney(data.total_claimed_fees_usd)} claimed`}
              valueClass="text-amber-300"
            />
            <Stat
              label="Unclaimed"
              value={fmtMoney(data.total_fees_usd)}
              valueClass="text-amber-200/90"
            />
            <Stat
              label="Our treasury"
              value={fmtMoney(data.treasury_usd)}
              sub="$0 until creator fees"
            />
          </section>

          <p className="font-mono text-[10px] text-zinc-600">
            Last ingest{" "}
            {data.ingested_at
              ? new Date(data.ingested_at).toLocaleString()
              : "—"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter ticker / pool…"
              className="w-full max-w-sm rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <span className="font-mono text-[11px] text-zinc-500">
              {pools.length} pools
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Pool
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Unclaimed
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Claimed
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    24h
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Fee %
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
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
                      onClick={() => setSelected(p)}
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
                      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-100">
                        {fmtMoney(p.position_value_usd)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-amber-300/90">
                        {fmtMoney(p.unclaimed_fees_usd)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-300">
                        {fmtMoney(p.claimed_fees_usd)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-sm tabular-nums ${pnlClass(p.price_change_24h)}`}
                      >
                        {fmtPct(p.price_change_24h)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-zinc-400">
                        {p.base_fee_pct != null ? `${p.base_fee_pct}%` : "—"}
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
                {pools.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center font-mono text-sm text-zinc-500"
                    >
                      No pools in index yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Holder ranks panel */}
          {selected && (
            <section className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-mono text-sm font-semibold text-zinc-100">
                  Holders · {selected.token_symbol}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Close
                </button>
              </div>
              <p className="mt-1 font-mono text-[10px] text-zinc-500">
                Top SPL holders of the pool token. Not LP NFT owners (Meteora
                does not publish that list).
              </p>
              {holdersLoading && (
                <p className="mt-4 font-mono text-xs text-zinc-500">
                  Loading holders…
                </p>
              )}
              {holdersErr && (
                <p className="mt-4 font-mono text-xs text-rose-400">
                  {holdersErr}
                </p>
              )}
              {holders && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="py-2 font-mono text-[10px] uppercase text-zinc-500">
                          Rank
                        </th>
                        <th className="py-2 font-mono text-[10px] uppercase text-zinc-500">
                          Owner
                        </th>
                        <th className="py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Amount
                        </th>
                        <th className="py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          % of top
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.holders.map((h) => (
                        <tr
                          key={`${h.rank}-${h.owner}`}
                          className="border-b border-zinc-800/60"
                        >
                          <td className="py-2 font-mono text-xs text-zinc-500">
                            {h.rank}
                          </td>
                          <td className="py-2 font-mono text-xs">
                            <a
                              href={solscanAccount(h.owner)}
                              target="_blank"
                              rel="noreferrer"
                              className={
                                h.isController
                                  ? "text-amber-300 hover:underline"
                                  : "text-zinc-300 hover:text-sky-400"
                              }
                            >
                              {shortCa(h.owner, 4, 4)}
                              {h.isController ? " · wallet(0)" : ""}
                            </a>
                          </td>
                          <td className="py-2 text-right font-mono text-xs tabular-nums text-zinc-300">
                            {h.amountUi.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 text-right font-mono text-xs tabular-nums text-zinc-500">
                            {h.pctOfTop.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
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
