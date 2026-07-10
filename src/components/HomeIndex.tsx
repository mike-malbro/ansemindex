"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IndexPayload } from "@/lib/types";
import {
  fmtMoney,
  shortCa,
  solscanAccount,
  meteoraPoolUrl,
  dexTokenUrl,
} from "@/lib/format";
import { REFRESH_INTERVAL_MS } from "@/lib/config";
import { downloadIndexExcel, downloadIndexPdf } from "@/lib/export-index";
import { PieChart, consolidateSlices } from "./PieChart";

/** Homepage: scientific pool list — full width, black, exportable. */
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
    <section id="index" className="mt-12 w-full">
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {!data && !error && (
        <p className="text-xs text-zinc-500">Loading pools…</p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-white/10 pb-4">
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat label="Index" value={fmtMoney(data.total_position_usd)} />
            <Stat
              label="Fees"
              value={fmtMoney(data.total_fees_generated_usd)}
              valueClass="text-emerald-400"
            />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadIndexExcel(data)}
                className="border border-white/15 px-3 py-1.5 text-[11px] text-zinc-300 transition hover:border-white/40 hover:text-white"
              >
                Excel
              </button>
              <button
                type="button"
                onClick={() => downloadIndexPdf(data)}
                className="border border-white/15 px-3 py-1.5 text-[11px] text-zinc-300 transition hover:border-white/40 hover:text-white"
              >
                PDF
              </button>
              <a
                href="/api/public?format=csv"
                className="border border-white/15 px-3 py-1.5 text-[11px] text-zinc-300 transition hover:border-white/40 hover:text-white"
              >
                API CSV
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr] lg:items-start">
            <div>
              <PieChart
                title="Weights"
                slices={composition}
                size={160}
                onSelect={(s) => {
                  if (s && s.id !== "__other") {
                    window.location.href = `/book?pool=${encodeURIComponent(s.id)}`;
                  }
                }}
              />
            </div>

            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-2 pr-4 text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Pool
                    </th>
                    <th className="pb-2 px-3 text-right text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Share
                    </th>
                    <th className="pb-2 px-3 text-right text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Mcap
                    </th>
                    <th className="pb-2 px-3 text-right text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Amount
                    </th>
                    <th className="pb-2 px-3 text-right text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Fees
                    </th>
                    <th className="pb-2 pl-3 text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                      Invest
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.pools.map((p) => (
                    <tr
                      key={p.pool_address}
                      className="border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/book?pool=${encodeURIComponent(p.pool_address)}`}
                          className="text-sm text-white hover:underline"
                        >
                          {p.token_symbol}
                          <span className="text-zinc-500">–ANSEM</span>
                        </Link>
                        <div className="text-[10px] text-zinc-600">
                          {shortCa(p.pool_address)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-emerald-400/90">
                        {(p.share_pct ?? 0).toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-zinc-300">
                        {fmtMoney(p.market_cap_usd)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-white">
                        {fmtMoney(p.position_value_usd)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-emerald-400/80">
                        {fmtMoney(p.fees_generated_usd)}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex gap-2 text-[10px]">
                          <a
                            href={meteoraPoolUrl(p.pool_address)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-500 hover:text-white"
                          >
                            Meteora
                          </a>
                          <a
                            href={dexTokenUrl(p.token_mint)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-500 hover:text-white"
                          >
                            Dex
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-4 text-[11px] text-zinc-500">
            <p>
              Public API (CORS open):{" "}
              <code className="text-zinc-400">GET /api/public</code>
              {" · "}
              <code className="text-zinc-400">GET /api/public?format=csv</code>
            </p>
            <p className="mt-2 text-[10px] text-zinc-600">
              Mapped from{" "}
              {(data.map_wallets ?? []).map((m, i) => (
                <span key={m.address}>
                  {i > 0 ? " · " : ""}
                  <a
                    href={solscanAccount(m.address)}
                    className="text-zinc-500 hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {m.label}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xl font-semibold tabular-nums ${valueClass ?? "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
