"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { IndexPayload } from "@/lib/types";
import { fmtMoney, shortCa, solscanAccount } from "@/lib/format";
import { INDEX_TOKEN_SYMBOL, REFRESH_INTERVAL_MS } from "@/lib/config";

/** Homepage: $ANSEMINDEX creator wallets — click opens drill-down on /book */
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

  const token = data?.index_token || INDEX_TOKEN_SYMBOL;

  return (
    <section id="creators" className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-200/80">
            ${token}
          </p>
          <h2 className="mt-1 text-lg font-semibold">Creator wallets</h2>
        </div>
        <Link href="/book" className="text-[11px] text-sky-400 hover:underline">
          Open book →
        </Link>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        The index is creator wallets. Click one to drill down into that wallet’s
        pools, fees, and holders.
      </p>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {!data && !error && (
        <p className="mt-6 text-xs text-zinc-500">Loading creators…</p>
      )}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Creators" value={String(data.creators.length)} />
            <Stat label="Pools" value={String(data.total_pools)} />
            <Stat
              label="Fees earned"
              value={fmtMoney(data.total_fees_earned_usd)}
              valueClass="text-amber-300"
            />
            <Stat
              label={`$${token} treasury`}
              value={fmtMoney(data.treasury_usd)}
              sub="still $0"
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    Creator
                  </th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    Address
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Pools
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-zinc-500">
                    Fees
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.creators.map((c) => (
                  <tr
                    key={c.address}
                    className="border-b border-zinc-800/80 transition hover:bg-zinc-900/70"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/book?creator=${encodeURIComponent(c.address)}`}
                        className="text-sm text-amber-100/90 hover:underline"
                      >
                        {c.label}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      <a
                        href={solscanAccount(c.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-sky-400"
                      >
                        {shortCa(c.address, 6, 6)}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-zinc-200">
                      {c.pools}
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-zinc-100">
                      {fmtMoney(c.position_usd)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-amber-300/90">
                      {fmtMoney(c.fees_earned_usd)}
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
            · click a creator → bottom drill-down on{" "}
            <Link href="/book" className="text-sky-400 hover:underline">
              /book
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
