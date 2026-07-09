"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtMoney, fmtPct, shortCa, solscanAccount } from "@/lib/format";
import { looksLikeSecret, isLikelyPubkey } from "@/lib/security";
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
 * Wallet page:
 * 1) Top wallets by Index %
 * 2) Click one → pool breakdown (Your % on each Index pool)
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
      // Prefer dedicated top-wallets API; fall back to Index map wallets.
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

  function openWallet(address: string) {
    setPasteError(null);
    setSelected(address);
    setWalletParam(address);
  }

  function backToList() {
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

  // ——— Drill-down: pool breakdown for selected wallet ———
  if (selected) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
          <button
            type="button"
            onClick={backToList}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500"
          >
            ← Top wallets
          </button>
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
        </div>
        <PoolIndexBook
          embedded
          mode="wallet"
          wallet={selected}
          title="Breakdown"
          subtitle="Pool-by-pool: Your % = this wallet’s LP ÷ pool TVL on each Index TOKEN–ANSEM pool."
          refreshLabel="Refresh"
          caption="Breakdown of the selected wallet across the Index pool book."
        />
      </div>
    );
  }

  // ——— List: top wallets by % ———
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">
            Wallet
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            Top wallets by Index %. Click one for the pool breakdown.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-zinc-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && wallets.length === 0 && (
        <p className="py-16 text-center font-mono text-sm text-zinc-500">
          Loading top wallets…
        </p>
      )}

      {!loading && (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Top wallets" value={String(wallets.length)} />
            <Stat label="Index amount" value={fmtMoney(totalUsd)} />
            <Stat
              label="#1 share"
              value={wallets[0] ? fmtPct(wallets[0].index_pct) : "—"}
              valueClass="text-emerald-300"
              sub={wallets[0]?.label}
            />
          </section>

          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead className="bg-zinc-900/80">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                    #
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                    Wallet
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    %
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase text-zinc-500">
                    Pools
                  </th>
                </tr>
              </thead>
              <tbody>
                {wallets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center font-mono text-xs text-zinc-500"
                    >
                      No wallets yet — refresh Index to ingest map wallets.
                    </td>
                  </tr>
                ) : (
                  wallets.map((w) => (
                    <tr
                      key={w.address}
                      onClick={() => openWallet(w.address)}
                      className="cursor-pointer border-b border-zinc-800/80 transition hover:bg-zinc-900/70"
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
                      <td className="px-3 py-3 text-right font-mono text-base tabular-nums text-emerald-300">
                        {fmtPct(w.index_pct)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-100">
                        {fmtMoney(w.position_usd)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-zinc-500">
                        {w.pools}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="font-mono text-[10px] text-zinc-600">
            % = wallet LP ÷ Index LP. Click a row → pool breakdown.
          </p>

          <form
            className="flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              pasteLookup(input);
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              Or paste
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pubkey…"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 hover:border-zinc-500"
            >
              Open
            </button>
          </form>
          {pasteError && (
            <p className="font-mono text-xs text-rose-400">{pasteError}</p>
          )}
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
