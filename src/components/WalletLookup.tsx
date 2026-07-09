"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioPayload } from "@/lib/types";
import { shortCa, solscanAccount } from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
import { PortfolioPoolBook } from "./PortfolioPoolBook";

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Wallet tab — same board as Index (stats → pies → table).
 */
export function WalletLookup() {
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (raw: string) => {
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

    setLoading(true);
    setError(null);
    setWallet(trimmed);
    setWalletParam(trimmed);

    try {
      const res = await fetch(
        `/api/portfolio?wallet=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Lookup failed (${res.status})`);
      }
      setPortfolio(body as PortfolioPayload);
    } catch (e) {
      setPortfolio(null);
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get("wallet")?.trim();
    if (w) {
      setInput(w);
      void lookup(w);
    }
  }, [lookup]);

  const fees = portfolio?.fee_totals;
  const compoundPct = fees?.compound_pct ?? 90;
  const claimPct = fees?.claim_pct ?? 10;

  if (wallet && portfolio) {
    return (
      <PortfolioPoolBook
        title="Wallet"
        subtitle={`This pubkey’s open LPs on the Index list (TOKEN–ANSEM DAMM v2 only). Not holdings. ${compoundPct}% compound / ${claimPct}% claim. Pubkeys only.`}
        refreshLabel="Refresh"
        onRefresh={() => void lookup(input || wallet)}
        refreshing={loading}
        amountLabel="Index LP"
        amountUsd={portfolio.totals.balances}
        poolCount={portfolio.total_pools}
        fees={{
          unclaimed_usd: fees?.unclaimed_usd ?? 0,
          claimed_usd: fees?.claimed_usd ?? 0,
          compounded_usd: fees?.compounded_usd ?? 0,
          generated_usd: fees?.generated_usd ?? 0,
          compound_pct: compoundPct,
          claim_pct: claimPct,
        }}
        positions={portfolio.positions}
        caption="Only Index pools — how this pubkey LPs the ANSEM Index. No SPL holdings."
        emptyMessage="0 Index pools — this pubkey has no open TOKEN–ANSEM LPs on the Index list."
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
                void lookup(input);
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
                disabled={loading}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Wallet
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Paste a pubkey → its open LPs on the Index pool list (TOKEN–ANSEM
            DAMM v2). Not token holdings. Pubkeys only.
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(input);
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
          disabled={loading}
          className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <p className="py-16 text-center font-mono text-sm text-zinc-500">
          Loading pools…
        </p>
      )}

      {!loading && !error && (
        <p className="py-10 text-center font-mono text-xs text-zinc-600">
          Paste a pubkey to see Index LP interaction (0 pools if none).
        </p>
      )}
    </div>
  );
}
