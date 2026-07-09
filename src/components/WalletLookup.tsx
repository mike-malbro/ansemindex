"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrichedPosition, PortfolioPayload } from "@/lib/types";
import {
  fmtMoney,
  fmtPct,
  meteoraPoolUrl,
  pnlClass,
  shortCa,
  solscanAccount,
} from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";

type SortKey = "fees" | "value" | "ticker" | "change24h";

function setWalletParam(wallet: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "wallet");
  if (wallet) url.searchParams.set("wallet", wallet);
  else url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Wallet tab — same simple board + table as Index.
 * Total amount up top; pools broken down; sort by fees.
 */
export function WalletLookup() {
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fees");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const pools = useMemo(() => {
    if (!portfolio) return [];
    let rows = [...portfolio.positions];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.ticker.toLowerCase().includes(q) ||
          p.pool_name.toLowerCase().includes(q) ||
          p.pool_address.toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case "ticker":
          return dir * a.ticker.localeCompare(b.ticker);
        case "value":
          return dir * (a.position_value_usd - b.position_value_usd);
        case "change24h":
          return (
            dir * ((a.price_change_24h ?? 0) - (b.price_change_24h ?? 0))
          );
        case "fees":
        default:
          return dir * (a.unclaimed_fees_usd - b.unclaimed_fees_usd);
      }
    });
    return rows;
  }, [portfolio, query, sortKey, sortDir]);

  const totalValue = portfolio?.totals.balances ?? 0;
  const totalFees = portfolio?.totals.unclaimed_fees ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Wallet
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Paste a pubkey. Total amount, then pools — sort by fees. Same board
            as Index. Pubkeys only.
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

      {loading && !portfolio && (
        <p className="py-16 text-center font-mono text-sm text-zinc-500">
          Loading pools…
        </p>
      )}

      {wallet && portfolio && (
        <>
          <p className="font-mono text-xs text-zinc-500">
            <a
              href={solscanAccount(wallet)}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              {shortCa(wallet, 6, 6)}
            </a>
          </p>

          {/* Simple board — totals first */}
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Total amount" value={fmtMoney(totalValue)} />
            <Stat
              label="Unclaimed fees"
              value={fmtMoney(totalFees)}
              valueClass="text-emerald-300"
            />
            <Stat label="Pools" value={String(portfolio.total_pools)} />
            <Stat
              label="Positions"
              value={String(portfolio.total_positions)}
            />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter ticker / pool…"
              className="w-full max-w-sm rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <span className="font-mono text-[11px] text-zinc-500">
              {pools.length} pools
            </span>
          </div>

          {pools.length === 0 ? (
            <p className="py-8 font-mono text-xs text-zinc-500">
              No open TOKEN–ANSEM pools on this wallet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-zinc-800">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-zinc-900/80">
                  <tr className="border-b border-zinc-800">
                    <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                      #
                    </th>
                    <th className="px-3 py-2">
                      <SortBtn
                        label="Pool"
                        active={sortKey === "ticker"}
                        dir={sortDir}
                        onClick={() => toggleSort("ticker")}
                        align="left"
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortBtn
                        label="Amount"
                        active={sortKey === "value"}
                        dir={sortDir}
                        onClick={() => toggleSort("value")}
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortBtn
                        label="Fees"
                        active={sortKey === "fees"}
                        dir={sortDir}
                        onClick={() => toggleSort("fees")}
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortBtn
                        label="24h"
                        active={sortKey === "change24h"}
                        dir={sortDir}
                        onClick={() => toggleSort("change24h")}
                      />
                    </th>
                    <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                      Links
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((p, i) => (
                    <PoolRow key={p.position_address} p={p} rank={i + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!wallet && !loading && !error && (
        <p className="py-10 text-center font-mono text-xs text-zinc-600">
          Paste a pubkey to see total amount and pools.
        </p>
      )}
    </div>
  );
}

function PoolRow({ p, rank }: { p: EnrichedPosition; rank: number }) {
  return (
    <tr className="border-b border-zinc-800/80 hover:bg-zinc-900/70">
      <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">{rank}</td>
      <td className="px-3 py-2.5">
        <div className="font-mono text-sm text-zinc-100">
          {p.ticker || p.pool_name}
        </div>
        <div className="font-mono text-[10px] text-zinc-600">
          {shortCa(p.pool_address, 4, 4)}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-100">
        {fmtMoney(p.position_value_usd)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-emerald-300/90">
        {fmtMoney(p.unclaimed_fees_usd)}
      </td>
      <td
        className={`px-3 py-2.5 text-right font-mono text-sm tabular-nums ${pnlClass(p.price_change_24h)}`}
      >
        {p.price_change_24h != null ? fmtPct(p.price_change_24h) : "—"}
      </td>
      <td className="px-3 py-2.5 font-mono text-[11px]">
        <a
          href={meteoraPoolUrl(p.pool_address)}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-400 hover:underline"
        >
          Meteora
        </a>
      </td>
    </tr>
  );
}

function SortBtn({
  label,
  active,
  dir,
  onClick,
  align = "right",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition hover:text-zinc-200 ${
        active ? "text-zinc-200" : "text-zinc-500"
      } ${align === "right" ? "w-full justify-end" : ""}`}
    >
      {label}
      {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
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
    <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-sm font-semibold ${valueClass ?? "text-zinc-100"}`}
      >
        {value}
      </div>
    </div>
  );
}
