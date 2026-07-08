"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IndexPayload } from "@/lib/types";
import { fmtMoney, shortCa, solscanAccount } from "@/lib/format";
import { REFRESH_INTERVAL_MS } from "@/lib/config";
import { PieChart, consolidateSlices } from "./PieChart";

/** Homepage: live pool index + share pie (auto multi-wallet). */
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
      setError(e instanceof Error ? e.message : "Failed to load");
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

  return (
    <section id="index" className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">The index</h2>
          <p className="mt-1 text-xs text-zinc-500">
            DAMM v2 TOKEN–ANSEM pools. ANSEM creator fees buy by Share %.
          </p>
        </div>
        <Link href="/book" className="text-[11px] text-sky-400 hover:underline">
          Full index →
        </Link>
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {!data && !error && (
        <p className="mt-6 text-xs text-zinc-500">Loading pools…</p>
      )}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Index amount"
              value={fmtMoney(data.total_position_usd)}
            />
            <Stat
              label="Fees earned"
              value={fmtMoney(data.total_fees_earned_usd)}
              valueClass="text-amber-300"
            />
            <Stat
              label="Treasury"
              value={fmtMoney(data.treasury_usd)}
              sub="still $0"
            />
          </div>

          <div className="mt-4 rounded border border-zinc-800 bg-zinc-900/30 p-4">
            <PieChart
              title="Index weights"
              slices={composition}
              size={160}
              onSelect={(s) => {
                if (s && s.id !== "__other") {
                  window.location.href = `/book?pool=${encodeURIComponent(s.id)}`;
                }
              }}
            />
            <p className="mt-2 text-[10px] text-zinc-600">
              Click a slice → pool drill-down on Index.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 text-[10px] uppercase text-zinc-500">
                    Pool
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase text-zinc-500">
                    Share
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase text-zinc-500">
                    Fees
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.pools.slice(0, 25).map((p) => (
                  <tr
                    key={p.pool_address}
                    className="border-b border-zinc-800/80 hover:bg-zinc-900/70"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/book?pool=${encodeURIComponent(p.pool_address)}`}
                        className="text-sm text-zinc-100 hover:underline"
                      >
                        {p.token_symbol}
                        <span className="text-zinc-500">–ANSEM</span>
                      </Link>
                      <div className="text-[10px] text-zinc-600">
                        {shortCa(p.pool_address)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm tabular-nums text-amber-200/90">
                      {(p.share_pct ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm tabular-nums text-zinc-100">
                      {fmtMoney(p.position_value_usd)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm tabular-nums text-amber-300/90">
                      {fmtMoney(
                        (p.unclaimed_fees_usd || 0) + (p.claimed_fees_usd || 0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[10px] text-zinc-600">
            Auto-mapped from{" "}
            {(data.map_wallets ?? []).map((m, i) => (
              <span key={m.address}>
                {i > 0 ? " + " : ""}
                <a
                  href={solscanAccount(m.address)}
                  className="text-zinc-400 hover:text-sky-400"
                  target="_blank"
                  rel="noreferrer"
                >
                  {m.label}
                </a>
              </span>
            ))}{" "}
            ·{" "}
            <Link href="/book" className="text-sky-400 hover:underline">
              full book
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
