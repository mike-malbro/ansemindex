"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrichedPosition, PortfolioPayload } from "@/lib/types";
import {
  fmtMoney,
  meteoraPoolUrl,
  shortCa,
  solscanAccount,
} from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
import { PieChart, consolidateSlices } from "./PieChart";

type HolderPayload = {
  wallet: string;
  holdings: {
    mint: string;
    symbol: string;
    amountUi: number;
    valueUsd: number | null;
    priceUsd: number | null;
  }[];
  pie: { id: string; label: string; value: number }[];
  note?: string;
  fetched_at: string;
};

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

/** Paste a pubkey — see your portfolio against the index. No keys. */
export function WalletLookup() {
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [holder, setHolder] = useState<HolderPayload | null>(null);
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
      setError("Never paste private keys, seeds, or mnemonics here — pubkey only.");
      return;
    }
    if (!isLikelyPubkey(trimmed)) {
      setError("That doesn’t look like a Solana pubkey. Check the address.");
      return;
    }

    setLoading(true);
    setError(null);
    setWallet(trimmed);
    setWalletParam(trimmed);

    try {
      const [hRes, pRes] = await Promise.all([
        fetch(`/api/holder/${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
        }),
        fetch(`/api/portfolio?wallet=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
        }),
      ]);

      const hBody = await hRes.json().catch(() => ({}));
      const pBody = await pRes.json().catch(() => ({}));

      if (!hRes.ok) {
        throw new Error(hBody.error || `Holder lookup failed (${hRes.status})`);
      }
      if (!pRes.ok) {
        throw new Error(
          pBody.error || `Portfolio lookup failed (${pRes.status})`,
        );
      }

      setHolder(hBody as HolderPayload);
      setPortfolio(pBody as PortfolioPayload);
    } catch (e) {
      setHolder(null);
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

  const pie = useMemo(() => {
    if (!holder?.pie?.length) return [];
    return consolidateSlices(
      holder.pie.map((s) => ({
        id: s.id,
        label: s.label,
        value: s.value,
      })),
      { maxSlices: 10, minPct: 1.2 },
    );
  }, [holder]);

  const holdings = useMemo(() => {
    if (!holder) return [];
    return [...holder.holdings]
      .filter((h) => h.amountUi > 0)
      .sort(
        (a, b) =>
          (b.valueUsd ?? 0) - (a.valueUsd ?? 0) || b.amountUi - a.amountUi,
      );
  }, [holder]);

  const positions: EnrichedPosition[] = portfolio?.positions ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Wallet
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Paste a pubkey. See portfolio vs the index — holdings + open
            TOKEN–ANSEM LPs. Pubkeys only — never keys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void lookup(input || wallet || "")}
          disabled={loading || !(input || wallet)}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Refresh"}
        </button>
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
          className="rounded border border-emerald-800/50 bg-emerald-950/30 px-4 py-2.5 font-mono text-sm text-emerald-100/90 transition hover:border-emerald-700/60 disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {wallet && !loading && !error && holder && portfolio && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-xs text-zinc-400">
              <a
                href={solscanAccount(wallet)}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                {shortCa(wallet, 6, 6)}
              </a>
            </p>
            <p className="font-mono text-[10px] text-zinc-600">
              {holder.note}
            </p>
          </div>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label="Index tokens"
              value={String(holdings.length)}
            />
            <Stat
              label="Holdings (est.)"
              value={fmtMoney(
                holdings.reduce((s, h) => s + (h.valueUsd ?? 0), 0),
              )}
            />
            <Stat
              label="Open LPs"
              value={String(portfolio.total_positions)}
            />
            <Stat
              label="LP value"
              value={fmtMoney(portfolio.totals.balances)}
              sub={`${fmtMoney(portfolio.totals.unclaimed_fees)} fees`}
            />
          </section>

          <section className="grid gap-4 rounded border border-zinc-800 bg-zinc-900/30 p-4 lg:grid-cols-2">
            <PieChart
              title="Index allocation"
              slices={pie}
              size={180}
            />
            <div className="overflow-x-auto">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Holdings
              </h2>
              {holdings.length === 0 ? (
                <p className="font-mono text-xs text-zinc-500">
                  No index-token balances found for this wallet.
                </p>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="py-1.5 font-mono text-[10px] uppercase text-zinc-500">
                        Token
                      </th>
                      <th className="py-1.5 text-right font-mono text-[10px] uppercase text-zinc-500">
                        Amount
                      </th>
                      <th className="py-1.5 text-right font-mono text-[10px] uppercase text-zinc-500">
                        Est. USD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr
                        key={h.mint}
                        className="border-b border-zinc-800/60"
                      >
                        <td className="py-1.5 font-mono text-xs text-zinc-200">
                          {h.symbol}
                        </td>
                        <td className="py-1.5 text-right font-mono text-xs text-zinc-400">
                          {h.amountUi.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td className="py-1.5 text-right font-mono text-xs text-zinc-300">
                          {h.valueUsd != null ? fmtMoney(h.valueUsd) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-sm font-semibold text-zinc-200">
              Open DAMM positions
            </h2>
            {positions.length === 0 ? (
              <p className="font-mono text-xs text-zinc-500">
                No open Meteora DAMM positions on this wallet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead className="bg-zinc-900/80">
                    <tr className="border-b border-zinc-800">
                      <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                        Pool
                      </th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                        Value
                      </th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                        Unclaimed
                      </th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                        Link
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr
                        key={p.position_address}
                        className="border-b border-zinc-800/60"
                      >
                        <td className="px-3 py-2 font-mono text-xs text-zinc-200">
                          {p.ticker || p.pool_name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-zinc-300">
                          {fmtMoney(p.position_value_usd)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-emerald-300/90">
                          {fmtMoney(p.unclaimed_fees_usd)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px]">
                          <a
                            href={meteoraPoolUrl(p.pool_address)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:underline"
                          >
                            Meteora
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!wallet && !loading && !error && (
        <p className="py-10 text-center font-mono text-xs text-zinc-600">
          Paste a pubkey above to see the portfolio index.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-zinc-100">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10px] text-zinc-600">{sub}</div>
      )}
    </div>
  );
}
