"use client";

import { useCallback, useEffect, useState } from "react";
import { shortCa, solscanAccount } from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
import { PoolIndexBook } from "./PoolIndexBook";

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Wallet = exact same Index pool book, with pasted pubkey’s Your % overlaid.
 */
export function WalletLookup() {
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError("Paste a Solana wallet address (pubkey).");
      return;
    }
    if (looksLikeSecret(trimmed)) {
      setError("Never paste private keys — pubkey only.");
      return;
    }
    if (!isLikelyPubkey(trimmed)) {
      setError("That doesn’t look like a Solana pubkey.");
      return;
    }
    setError(null);
    setWallet(trimmed);
    setWalletParam(trimmed);
  }, []);

  useEffect(() => {
    const w = new URLSearchParams(window.location.search).get("wallet")?.trim();
    if (w) {
      setInput(w);
      apply(w);
    }
  }, [apply]);

  if (wallet) {
    return (
      <PoolIndexBook
        embedded
        mode="wallet"
        wallet={wallet}
        title="Wallet"
        subtitle="Exact same Index pool book. Your % = this pubkey’s LP ÷ pool TVL on each TOKEN–ANSEM pool."
        refreshLabel="Refresh"
        caption="Same pool book as Index — only Your % is this wallet’s share of each pool."
        lead={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={solscanAccount(wallet)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-sky-400 hover:underline"
            >
              {shortCa(wallet, 6, 6)}
            </a>
            <form
              className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                apply(input);
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste another pubkey…"
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 hover:border-zinc-500"
              >
                Look up
              </button>
            </form>
            {error && (
              <p className="w-full font-mono text-xs text-rose-400">{error}</p>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">
          Wallet
        </h1>
        <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
          Paste a pubkey → the exact Index pool book with Your % on each pool.
        </p>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          apply(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste Solana pubkey…"
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
      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
