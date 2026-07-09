"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtMoney, fmtPct, shortCa, solscanAccount } from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
import { PieChart, consolidateSlices, type PieSlice } from "./PieChart";
import { PoolIndexBook } from "./PoolIndexBook";
import type { IndexPayload, TopWalletRow } from "@/lib/types";

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

function rankFromIndex(data: IndexPayload, limit = 10): TopWalletRow[] {
  const rows = [...(data.map_wallets ?? data.creators ?? [])].sort(
    (a, b) => (b.position_usd || 0) - (a.position_usd || 0),
  );
  const total = rows.reduce((s, r) => s + (Number(r.position_usd) || 0), 0);
  return rows.slice(0, limit).map((r, i) => {
    const position_usd = Number(r.position_usd) || 0;
    return {
      rank: i + 1,
      address: r.address,
      label: r.label || `wallet`,
      pools: Number(r.pools) || 0,
      position_usd,
      index_pct: total > 0 ? (position_usd / total) * 100 : 0,
      unclaimed_fees_usd: Number(r.unclaimed_fees_usd) || 0,
      claimed_fees_usd: Number(r.claimed_fees_usd) || 0,
    };
  });
}

/**
 * Wallet page: small top-10 + pie → click drills into that wallet’s Index book.
 * Paste still works as a secondary lookup.
 */
export function WalletLookup() {
  const [wallets, setWallets] = useState<TopWalletRow[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, iRes] = await Promise.all([
        fetch("/api/wallets?limit=10", { cache: "no-store" }),
        fetch("/api/index", { cache: "no-store" }),
      ]);

      if (wRes.ok) {
        const body = await wRes.json();
        setWallets(body.wallets ?? []);
        setTotalUsd(Number(body.total_index_usd) || 0);
      } else if (iRes.ok) {
        const index = (await iRes.json()) as IndexPayload;
        const ranked = rankFromIndex(index, 10);
        setWallets(ranked);
        setTotalUsd(ranked.reduce((s, w) => s + w.position_usd, 0));
      } else {
        const body = await iRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load wallets");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const w = new URLSearchParams(window.location.search).get("wallet")?.trim();
    if (w) setSelected(w);
  }, []);

  const selectedRow = useMemo(
    () =>
      wallets.find(
        (w) => w.address.toLowerCase() === (selected ?? "").toLowerCase(),
      ) ?? null,
    [wallets, selected],
  );

  const pieSlices = useMemo(() => {
    const slices: PieSlice[] = wallets.map((w) => ({
      id: w.address,
      label: w.label || shortCa(w.address, 4, 4),
      value: w.position_usd,
    }));
    return consolidateSlices(slices, { maxSlices: 10, minPct: 0.5 });
  }, [wallets]);

  function openWallet(address: string) {
    setPasteError(null);
    setSelected(address);
    setWalletParam(address);
  }

  function clearSelection() {
    setSelected(null);
    setWalletParam(null);
  }

  function pasteLookup(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setPasteError("Paste a pubkey.");
      return;
    }
    if (looksLikeSecret(trimmed)) {
      setPasteError("Pubkey only — never private keys.");
      return;
    }
    if (!isLikelyPubkey(trimmed)) {
      setPasteError("That doesn’t look like a Solana pubkey.");
      return;
    }
    openWallet(trimmed);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      {/* ——— Compact top: pie + top 10 ——— */}
      <section className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="font-mono text-sm font-semibold text-zinc-100">
              Top 10 wallets
            </h1>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
              Share of Index LP · click a slice or row to drill down
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-600">
              {fmtMoney(totalUsd)} Index
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:border-zinc-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 font-mono text-xs text-rose-400">{error}</p>
        )}
        {loading && wallets.length === 0 && (
          <p className="mt-6 py-8 text-center font-mono text-xs text-zinc-500">
            Loading top wallets…
          </p>
        )}

        {!loading && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <PieChart
              title="Index share"
              slices={pieSlices}
              size={180}
              selectedId={selected}
              onSelect={(s) => {
                if (!s || s.id === "__other") {
                  clearSelection();
                  return;
                }
                openWallet(s.id);
              }}
            />

            <div className="min-w-0">
              <ul className="max-h-[280px] space-y-0.5 overflow-y-auto">
                {wallets.length === 0 ? (
                  <li className="py-8 text-center font-mono text-xs text-zinc-500">
                    No wallets yet — paste a pubkey below, or refresh Index.
                  </li>
                ) : (
                  wallets.map((w) => {
                    const active =
                      selected?.toLowerCase() === w.address.toLowerCase();
                    return (
                      <li key={w.address}>
                        <button
                          type="button"
                          onClick={() =>
                            active ? clearSelection() : openWallet(w.address)
                          }
                          className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left font-mono transition ${
                            active
                              ? "bg-zinc-800 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                          }`}
                        >
                          <span className="w-5 shrink-0 text-[10px] text-zinc-600">
                            {w.rank}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs">
                            {w.label}
                            <span className="ml-1.5 text-[10px] text-zinc-600">
                              {shortCa(w.address, 4, 4)}
                            </span>
                          </span>
                          <span className="shrink-0 tabular-nums text-xs text-emerald-300">
                            {fmtPct(w.index_pct)}
                          </span>
                          <span className="hidden w-20 shrink-0 text-right tabular-nums text-[11px] text-zinc-500 sm:block">
                            {fmtMoney(w.position_usd)}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              <form
                className="mt-3 flex gap-2 border-t border-zinc-800 pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  pasteLookup(input);
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or paste pubkey…"
                  spellCheck={false}
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-zinc-500"
                >
                  Look up
                </button>
              </form>
              {pasteError && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  {pasteError}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ——— Drill-down: selected wallet’s Index book ——— */}
      {selected ? (
        <section className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-zinc-100">
              {selectedRow?.label ?? "Wallet"}
            </span>
            <a
              href={solscanAccount(selected)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-sky-400 hover:underline"
            >
              {shortCa(selected, 6, 6)}
            </a>
            {selectedRow && (
              <span className="font-mono text-[11px] text-emerald-300/90">
                {fmtPct(selectedRow.index_pct)} of Index ·{" "}
                {fmtMoney(selectedRow.position_usd)}
              </span>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <PoolIndexBook
            embedded
            mode="wallet"
            wallet={selected}
            title="Breakdown"
            subtitle="Pool-by-pool: Your % = this wallet’s LP ÷ pool TVL on each Index TOKEN–ANSEM pool."
            refreshLabel="Refresh"
            caption="Selected wallet across the Index pool book."
          />
        </section>
      ) : (
        <p className="py-10 text-center font-mono text-xs text-zinc-600">
          Select a wallet above to open its pool breakdown.
        </p>
      )}
    </div>
  );
}
