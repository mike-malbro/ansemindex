"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { IndexPayload } from "@/lib/types";
import {
  fmtMoney,
  fmtPct,
  pnlClass,
  shortCa,
  solscanAccount,
} from "@/lib/format";
import { REFRESH_INTERVAL_MS } from "@/lib/config";
import { IndexCharts } from "./IndexCharts";

export function HomeIndex() {
  const [data, setData] = useState<IndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(e instanceof Error ? e.message : "Failed to load index");
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

  return (
    <section id="index" className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">The index</h2>
        <Link
          href="/book"
          className="text-[11px] text-sky-400 hover:underline"
        >
          Full index →
        </Link>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        wallet(0) open TOKEN–ANSEM pools. Fees below are real LP fees from
        Meteora — our creator-fee treasury is still $0.
      </p>

      {error && (
        <p className="mt-3 text-xs text-rose-400">{error}</p>
      )}

      {!data && !error && (
        <p className="mt-6 text-xs text-zinc-500">Loading index…</p>
      )}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded border border-amber-900/40 bg-amber-950/15 px-3 py-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase tracking-wider text-amber-200/70">
                wallet(0)
              </div>
              <a
                href={solscanAccount(data.wallet0)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm text-zinc-100 hover:text-sky-400"
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
              sub={`${fmtMoney(data.total_claimed_fees_usd)} claimed · ${fmtMoney(data.total_fees_usd)} open`}
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
              sub="creator fees — still $0"
            />
          </div>

          <div className="mt-4">
            <IndexCharts
              data={data}
              compact
              onPoolSelect={(addr) => {
                if (addr) {
                  window.location.href = `/book?pool=${encodeURIComponent(addr)}`;
                }
              }}
            />
          </div>
          <p className="mt-2 text-[10px] text-zinc-600">
            Click a slice → open that pool on Index for top 10 holders + their
            pie.
          </p>

          <div className="mt-4 overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    Pool
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Unclaimed
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Claimed
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    24h
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.pools.map((p, i) => (
                  <tr
                    key={p.pool_address}
                    className="border-b border-zinc-800/80"
                  >
                    <td className="px-3 py-2 text-xs text-zinc-600">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-zinc-100">
                        {p.token_symbol}
                        <span className="text-zinc-500">–ANSEM</span>
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {shortCa(p.pool_address)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-zinc-100">
                      {fmtMoney(p.position_value_usd)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-amber-300/90">
                      {fmtMoney(p.unclaimed_fees_usd)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-zinc-300">
                      {fmtMoney(p.claimed_fees_usd)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right text-sm tabular-nums ${pnlClass(p.price_change_24h)}`}
                    >
                      {fmtPct(p.price_change_24h)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[10px] text-zinc-600">
            Synced{" "}
            {data.ingested_at
              ? new Date(data.ingested_at).toLocaleString()
              : "—"}{" "}
            ·{" "}
            <Link href="/book" className="text-sky-400 hover:underline">
              holders + detail
            </Link>
          </p>
        </>
      )}
    </section>
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
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${valueClass ?? "text-zinc-100"}`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}
