"use client";

import { useEffect, useMemo, useState } from "react";
import type { IndexPoolRow } from "@/lib/types";
import { shortCa, solscanAccount } from "@/lib/format";
import { PieChart, consolidateSlices, type PieSlice } from "./PieChart";

type Holder = {
  rank: number;
  owner: string;
  amountUi: number;
  pctOfTop: number;
  isController: boolean;
};

type HolderPiePayload = {
  wallet: string;
  pie: PieSlice[];
  note: string;
  holdings: {
    mint: string;
    symbol: string;
    amountUi: number;
    valueUsd: number | null;
  }[];
};

type Props = {
  pool: IndexPoolRow;
  onClose: () => void;
};

export function HolderPanel({ pool, onClose }: Props) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [holderPie, setHolderPie] = useState<HolderPiePayload | null>(null);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieErr, setPieErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedOwner(null);
    setHolderPie(null);
    fetch(
      `/api/pool/${pool.pool_address}/holders?mint=${encodeURIComponent(pool.token_mint)}&limit=10`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}));
          throw new Error(b.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setHolders((j.holders as Holder[]) ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pool.pool_address, pool.token_mint]);

  useEffect(() => {
    if (!selectedOwner) {
      setHolderPie(null);
      return;
    }
    let cancelled = false;
    setPieLoading(true);
    setPieErr(null);
    fetch(`/api/holder/${selectedOwner}`)
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}));
          throw new Error(b.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setHolderPie(j as HolderPiePayload);
      })
      .catch((e) => {
        if (!cancelled) setPieErr(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setPieLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOwner]);

  const holderSlices = useMemo(() => {
    const slices: PieSlice[] = holders.map((h) => ({
      id: h.owner,
      label: h.isController ? "map wallet" : shortCa(h.owner, 4, 4),
      value: h.amountUi,
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 0.5 });
  }, [holders]);

  const drillSlices = useMemo(() => {
    if (!holderPie?.pie?.length) return [];
    return consolidateSlices(
      holderPie.pie.map((s) => ({
        id: s.id,
        label: s.label,
        value: s.value,
      })),
      { maxSlices: 10, minPct: 1 },
    );
  }, [holderPie]);

  return (
    <section className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-sm font-semibold text-zinc-100">
          Top 10 holders · {pool.token_symbol}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          Close
        </button>
      </div>
      <p className="mt-1 font-mono text-[10px] text-zinc-500">
        Click a holder to load their index allocation pie. SPL token holders —
        not LP NFT owners.
      </p>

      {loading && (
        <p className="mt-4 font-mono text-xs text-zinc-500">Loading holders…</p>
      )}
      {error && (
        <p className="mt-4 font-mono text-xs text-rose-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <PieChart
              title="Share of top 10"
              slices={holderSlices}
              size={180}
              formatValue={(n) =>
                n.toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
              selectedId={selectedOwner}
              onSelect={(s) => {
                if (!s || s.id === "__other") {
                  setSelectedOwner(null);
                  return;
                }
                setSelectedOwner(s.id);
              }}
            />
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
              {holders.map((h) => (
                <li key={`${h.rank}-${h.owner}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOwner(
                        selectedOwner === h.owner ? null : h.owner,
                      )
                    }
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 font-mono text-[11px] transition ${
                      selectedOwner === h.owner
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <span className="w-5 text-zinc-600">{h.rank}</span>
                    <span
                      className={
                        h.isController ? "text-emerald-300" : "text-zinc-300"
                      }
                    >
                      {shortCa(h.owner, 4, 4)}
                      {h.isController ? " · map" : ""}
                    </span>
                    <span className="ml-auto tabular-nums text-zinc-500">
                      {h.pctOfTop.toFixed(1)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {!selectedOwner && (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded border border-dashed border-zinc-800 font-mono text-[11px] text-zinc-600">
                Select a holder → load their pie
              </div>
            )}
            {selectedOwner && (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Holder allocation
                  </div>
                  <a
                    href={solscanAccount(selectedOwner)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] text-sky-400 hover:underline"
                  >
                    {shortCa(selectedOwner, 6, 6)} ↗
                  </a>
                </div>
                {pieLoading && (
                  <p className="font-mono text-xs text-zinc-500">
                    Loading wallet tokens…
                  </p>
                )}
                {pieErr && (
                  <p className="font-mono text-xs text-rose-400">{pieErr}</p>
                )}
                {holderPie && !pieLoading && (
                  <>
                    <PieChart
                      title="Their index tokens"
                      slices={drillSlices}
                      size={180}
                    />
                    <p className="mt-2 font-mono text-[10px] text-zinc-600">
                      {holderPie.note}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
