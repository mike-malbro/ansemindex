"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtMoney, fmtPct, shortCa, solscanAccount } from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
import { PoolIndexBook } from "./PoolIndexBook";
import type { TopWalletRow, TopWalletsPayload } from "@/lib/types";

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Wallet tab: top 10 Index LPs by % → click drills into the same pool book.
 */
export function WalletLookup() {
  const [top, setTop] = useState<TopWalletsPayload | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const loadTop = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/wallets?limit=10", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setTop(body as TopWalletsPayload);
      setListError(null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load wallets");
      setTop(null);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTop();
  }, [loadTop]);

  useEffect(() => {
    const w = new URLSearchParams(window.location.search).get("wallet")?.trim();
    if (w) {
      setInput(w);
      setSelected(w);
    }
  }, []);

  function selectWallet(address: string) {
    setLookupError(null);
    setSelected(address);
    setInput(address);
    setWalletParam(address);
  }

  function clearSelection() {
    setSelected(null);
    setWalletParam(null);
  }

  function applyPaste(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setLookupError("Paste a Solana wallet address (pubkey).");
      return;
    }
    if (looksLikeSecret(trimmed)) {
      setLookupError("Never paste private keys — pubkey only.");
      return;
    }
    if (!isLikelyPubkey(trimmed)) {
      setLookupError("That doesn’t look like a Solana pubkey.");
      return;
    }
    selectWallet(trimmed);
  }

  // Drill-down: same Index pool book for the selected wallet
  if (selected) {
    const row = top?.wallets.find(
      (w) => w.address.toLowerCase() === selected.toLowerCase(),
    );
    return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
          <button
            type="button"
            onClick={clearSelection}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500"
          >
            ← Top wallets
          </button>
          <a
            href={solscanAccount(selected)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-sky-400 hover:underline"
          >
            {row?.label ? `${row.label} · ` : ""}
            {shortCa(selected, 6, 6)}
          </a>
          {row && (
            <span className="font-mono text-[11px] text-emerald-300/90">
              {fmtPct(row.index_pct)} of Index · {fmtMoney(row.position_usd)}
            </span>
          )}
        </div>
        <PoolIndexBook
          embedded
          mode="wallet"
          wallet={selected}
          title={row?.label ?? "Wallet"}
          subtitle="Same Index pool book. Your % = this wallet’s LP ÷ pool TVL on each TOKEN–ANSEM pool."
          refreshLabel="Refresh"
          caption="Drill-down from top wallets — exact same pool book as Index."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Wallet
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Top Index LPs by %. Select a wallet to open the same pool book with
            their Your % on each pool.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTop()}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500"
        >
          Refresh
        </button>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          applyPaste(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Or paste any pubkey…"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-zinc-200 hover:border-zinc-500"
        >
          Look up
        </button>
      </form>
      {lookupError && (
        <p className="font-mono text-xs text-rose-400">{lookupError}</p>
      )}

      {listError && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {listError}
        </div>
      )}

      {listLoading && !top && (
        <p className="py-16 text-center font-mono text-sm text-zinc-500">
          Loading top wallets…
        </p>
      )}

      {top && (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Wallets" value={String(top.wallets.length)} />
            <Stat
              label="Index amount"
              value={fmtMoney(top.total_index_usd)}
            />
            <Stat
              label="Top share"
              value={
                top.wallets[0] ? fmtPct(top.wallets[0].index_pct) : "—"
              }
              valueClass="text-emerald-300"
              sub={top.wallets[0]?.label}
            />
          </section>

          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                    #
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                    Wallet
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Index %
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Pools
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Fees
                  </th>
                </tr>
              </thead>
              <tbody>
                {top.wallets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center font-mono text-xs text-zinc-500"
                    >
                      No Index LP wallets yet — refresh the Index to ingest.
                    </td>
                  </tr>
                ) : (
                  top.wallets.map((w) => (
                    <tr
                      key={w.address}
                      onClick={() => selectWallet(w.address)}
                      className="cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-900/70"
                    >
                      <td className="px-3 py-3 font-mono text-xs text-zinc-600">
                        {w.rank}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-sm text-zinc-100">
                          {w.label}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-600">
                          {shortCa(w.address, 6, 6)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-emerald-300/90">
                        {fmtPct(w.index_pct)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-100">
                        {fmtMoney(w.position_usd)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-400">
                        {w.pools}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-400">
                        {fmtMoney(
                          w.unclaimed_fees_usd + w.claimed_fees_usd,
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[10px] text-zinc-600">
            Index % = wallet LP ÷ total Index LP. Click a row → pool book with
            Your % on each pool.
          </p>
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
