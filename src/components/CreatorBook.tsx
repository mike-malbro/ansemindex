"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreatorWalletRow, IndexPayload, IndexPoolRow } from "@/lib/types";
import {
  fmtMoney,
  fmtPct,
  meteoraPoolUrl,
  pnlClass,
  shortCa,
  solscanAccount,
  solscanToken,
} from "@/lib/format";
import { INDEX_TOKEN_SYMBOL, REFRESH_INTERVAL_MS } from "@/lib/config";
import { PieChart, consolidateSlices, type PieSlice } from "./PieChart";
import { HolderPanel } from "./HolderPanel";

/**
 * $ANSEMINDEX creators — map wallets that seed the pool book.
 * Click a creator → drill-down (pools, pies, holders). Not the index itself.
 */
export function CreatorBook({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<IndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<IndexPoolRow | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? "/api/index?refresh=1" : "/api/index";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData((await res.json()) as IndexPayload);
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
      load(ticks % 4 === 0);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Deep-link ?creator= / ?pool=
  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get("creator");
    const p = params.get("pool");
    const creators = data.map_wallets?.length
      ? data.map_wallets
      : data.creators;
    if (c) setSelectedCreator(c);
    else if (creators[0]) setSelectedCreator(creators[0].address);
    if (p) {
      const row = data.pools.find((x) => x.pool_address === p);
      if (row) {
        setSelectedPool(row);
        const fromMap = row.map_wallets?.[0];
        setSelectedCreator(fromMap || row.controller_wallet || data.wallet0);
      }
    }
  }, [data]);

  const creatorList = useMemo((): CreatorWalletRow[] => {
    if (!data) return [];
    return data.map_wallets?.length ? data.map_wallets : data.creators;
  }, [data]);

  const creator: CreatorWalletRow | null = useMemo(() => {
    if (!selectedCreator) return null;
    return (
      creatorList.find(
        (c) => c.address.toLowerCase() === selectedCreator.toLowerCase(),
      ) ?? null
    );
  }, [creatorList, selectedCreator]);

  const creatorPools = useMemo(() => {
    if (!data || !selectedCreator) return [];
    const sel = selectedCreator.toLowerCase();
    return data.pools.filter((p) => {
      const maps = p.map_wallets?.length
        ? p.map_wallets
        : [p.controller_wallet || data.wallet0];
      return maps.some((a) => a.toLowerCase() === sel);
    });
  }, [data, selectedCreator]);

  const composition = useMemo(() => {
    const slices: PieSlice[] = creatorPools.map((p) => ({
      id: p.pool_address,
      label: p.token_symbol,
      value: Number(p.position_value_usd) || 0,
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 1.2 });
  }, [creatorPools]);

  const feePie = useMemo(() => {
    const slices: PieSlice[] = creatorPools.map((p) => ({
      id: `fee-${p.pool_address}`,
      label: p.token_symbol,
      value: Number(p.fees_generated_usd) || 0,
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 1.2 });
  }, [creatorPools]);

  const token = data?.index_token || INDEX_TOKEN_SYMBOL;

  return (
    <div
      className={`mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 ${
        embedded ? "" : "min-h-screen"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-200/80">
            ${token}
          </p>
          <h1 className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            $ANSEMINDEX creators
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Map wallets that seed TOKEN–ANSEM pools into the index. Click a
            creator to drill down — pools, fees, holders. Pubkeys only.
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
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="py-20 text-center font-mono text-sm text-zinc-500">
          Loading creators…
        </div>
      )}

      {data && (
        <>
          {/* Totals */}
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Creators" value={String(creatorList.length)} />
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Pool amount"
              value={fmtMoney(data.total_position_usd)}
            />
            <Stat
              label="All-time generated"
              value={fmtMoney(data.total_fees_generated_usd)}
              valueClass="text-emerald-300"
              sub={`${fmtMoney(data.total_claimed_fees_usd)} claimed · ${fmtMoney(data.total_compounded_fees_usd)} compounded`}
            />
            <Stat
              label={`$${token} treasury`}
              value={fmtMoney(data.treasury_usd)}
              sub="creator fees — $0 until live"
            />
          </section>

          {/* Creator list — primary */}
          <section className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Creator
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Address
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Pools
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Generated
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Unclaimed
                  </th>
                </tr>
              </thead>
              <tbody>
                {creatorList.map((c) => {
                  const sel =
                    selectedCreator?.toLowerCase() === c.address.toLowerCase();
                  return (
                    <tr
                      key={c.address}
                      onClick={() => {
                        setSelectedCreator(c.address);
                        setSelectedPool(null);
                        // scroll drill-down into view
                        requestAnimationFrame(() => {
                          document
                            .getElementById("creator-drill")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                      }}
                      className={`cursor-pointer border-b border-zinc-800/80 transition hover:bg-zinc-900/70 ${
                        sel ? "bg-emerald-950/20" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-mono text-sm text-emerald-100/90">
                        {c.label}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                        {shortCa(c.address, 6, 6)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-200">
                        {c.pools}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-100">
                        {fmtMoney(c.position_usd)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-emerald-300/90">
                        {fmtMoney(c.fees_earned_usd)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-400">
                        {fmtMoney(c.unclaimed_fees_usd)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Drill-down — bottom */}
          <section
            id="creator-drill"
            className="scroll-mt-4 space-y-4 border-t border-zinc-800 pt-6"
          >
            {!creator ? (
              <p className="font-mono text-xs text-zinc-600">
                Select a creator wallet above.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Drill-down
                    </p>
                    <h2 className="mt-1 font-mono text-base font-semibold text-zinc-100">
                      {creator.label}
                    </h2>
                    <a
                      href={solscanAccount(creator.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-mono text-xs text-sky-400 hover:underline"
                    >
                      {shortCa(creator.address, 8, 8)} ↗
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-right">
                    <MiniStat label="Pools" value={String(creator.pools)} />
                    <MiniStat
                      label="Amount"
                      value={fmtMoney(creator.position_usd)}
                    />
                    <MiniStat
                      label="Fees"
                      value={fmtMoney(creator.fees_earned_usd)}
                      accent
                    />
                  </div>
                </div>

                <div className="grid gap-4 rounded border border-zinc-800 bg-zinc-900/30 p-4 lg:grid-cols-2">
                  <PieChart
                    title={`${creator.label} · pools`}
                    slices={composition}
                    size={180}
                    selectedId={selectedPool?.pool_address ?? null}
                    onSelect={(s) => {
                      if (!s || s.id === "__other") {
                        setSelectedPool(null);
                        return;
                      }
                      const row =
                        creatorPools.find((p) => p.pool_address === s.id) ??
                        null;
                      setSelectedPool(row);
                    }}
                  />
                  <PieChart
                    title={`${creator.label} · fees`}
                    slices={feePie}
                    size={180}
                    onSelect={(s) => {
                      if (!s || s.id === "__other") return;
                      const addr = s.id.replace(/^fee-/, "");
                      const row =
                        creatorPools.find((p) => p.pool_address === addr) ??
                        null;
                      setSelectedPool(row);
                    }}
                  />
                </div>

                <div className="overflow-x-auto rounded border border-zinc-800">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="bg-zinc-900/80">
                      <tr className="border-b border-zinc-800">
                        <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                          #
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                          Pool
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Generated
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Claimed
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Compounded
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          Unclaimed
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                          24h
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                          Links
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {creatorPools.map((p, i) => {
                        const sel =
                          selectedPool?.pool_address === p.pool_address;
                        return (
                          <tr
                            key={p.pool_address}
                            onClick={() =>
                              setSelectedPool(sel ? null : p)
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
                            <td
                              className={`px-3 py-2.5 text-right font-mono text-sm tabular-nums ${pnlClass(p.price_change_24h)}`}
                            >
                              {fmtPct(p.price_change_24h)}
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
                      {creatorPools.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-8 text-center font-mono text-sm text-zinc-500"
                          >
                            No open pools for this creator.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedPool && (
                  <HolderPanel
                    pool={selectedPool}
                    onClose={() => setSelectedPool(null)}
                  />
                )}
              </>
            )}
          </section>
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

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
        {label}
      </div>
      <div
        className={`font-mono text-sm tabular-nums ${
          accent ? "text-emerald-300" : "text-zinc-200"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
