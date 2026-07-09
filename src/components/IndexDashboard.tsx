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
import { IndexCharts } from "./IndexCharts";
import { HolderPanel } from "./HolderPanel";

export function IndexDashboard() {
  const [data, setData] = useState<IndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IndexPoolRow | null>(null);

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
      load(ticks % 4 === 0);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Deep-link: /book?pool=<address>
  useEffect(() => {
    if (!data) return;
    const pool = new URLSearchParams(window.location.search).get("pool");
    if (!pool) return;
    const row = data.pools.find((p) => p.pool_address === pool);
    if (row) setSelected(row);
  }, [data]);

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

  function selectPool(address: string | null) {
    if (!data || !address) {
      setSelected(null);
      return;
    }
    const row = data.pools.find((p) => p.pool_address === address) ?? null;
    setSelected(row);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Index
          </h1>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">
            wallet(0) pools · interactive pies · top 10 holders
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
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded border border-emerald-900/40 bg-emerald-950/15 px-3 py-3 sm:col-span-2 lg:col-span-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-200/70">
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
            </div>
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Pool amount"
              value={fmtMoney(data.total_position_usd)}
            />
            <Stat
              label="Fees earned"
              value={fmtMoney(data.total_fees_earned_usd)}
              sub={`${fmtMoney(data.total_claimed_fees_usd)} claimed`}
              valueClass="text-emerald-300"
            />
            <Stat
              label="Unclaimed"
              value={fmtMoney(data.total_fees_usd)}
              valueClass="text-emerald-200/90"
            />
            <Stat
              label="Our treasury"
              value={fmtMoney(data.treasury_usd)}
              sub="$0 until creator fees"
            />
          </section>

          <IndexCharts
            data={data}
            selectedPoolId={selected?.pool_address ?? null}
            onPoolSelect={selectPool}
          />

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
                      onClick={() =>
                        setSelected(sel ? null : p)
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
              </tbody>
            </table>
          </div>

          {selected && (
            <HolderPanel pool={selected} onClose={() => setSelected(null)} />
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
