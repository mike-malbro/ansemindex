"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EnrichedPosition, PortfolioPayload } from "@/lib/types";
import {
  fmtMoney,
  meteoraPoolUrl,
  shortCa,
  solscanAccount,
} from "@/lib/format";
import { ANSEM_TARGET_PCT } from "@/lib/thesis";
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
};

type KeeperState = {
  config?: {
    ansemDestWallet?: string | null;
    lpWallet?: string;
    note?: string;
  };
};

type FeeDash = {
  target_pct: number;
  latest: {
    ansem_pct: number;
    total_ansem_usd: number;
    total_position_usd: number;
    gate_phase: string;
    pool_count: number;
    snapshot_at: string;
  } | null;
  cumulative_creator_sends_usd: number;
  recent_sends: {
    id: string;
    recipient: string;
    usd: number;
    dry_run: boolean;
    status: string;
    sent_at: string;
    transfer_tx: string | null;
  }[];
  recent_events: {
    id: string;
    event_type: string;
    status: string;
    usd: number | null;
    tx_signature: string | null;
    occurred_at: string;
  }[];
  recent_ticks: number;
};

/**
 * Creator tab — fee wallet + ANSEM 0→70% goal + fee ledger.
 */
export function CreatorFeePanel() {
  const [feeWallet, setFeeWallet] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string>("");
  const [holder, setHolder] = useState<HolderPayload | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [fees, setFees] = useState<FeeDash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kRes, fRes] = await Promise.all([
        fetch("/api/keeper", { cache: "no-store" }),
        fetch("/api/fees", { cache: "no-store" }),
      ]);
      const k = (await kRes.json()) as KeeperState;
      const fBody = await fRes.json().catch(() => null);
      if (fRes.ok) setFees(fBody as FeeDash);
      else setFees(null);

      const dest = k.config?.ansemDestWallet?.trim() || null;
      const lp = k.config?.lpWallet?.trim() || null;
      const wallet = dest || lp;
      if (!wallet) {
        setFeeWallet(null);
        setSourceNote("Set ANSEM_DEST_WALLET (creator fee destination).");
        setHolder(null);
        setPortfolio(null);
        return;
      }
      setFeeWallet(wallet);
      setSourceNote(
        dest
          ? "$AI creator-fee destination — bought ANSEM lands here toward the 70% gate."
          : "ANSEM_DEST_WALLET unset — showing LP wallet until the $AI fee dest is configured.",
      );

      const [hRes, pRes] = await Promise.all([
        fetch(`/api/holder/${encodeURIComponent(wallet)}`, {
          cache: "no-store",
        }),
        fetch(`/api/portfolio?wallet=${encodeURIComponent(wallet)}`, {
          cache: "no-store",
        }),
      ]);
      const hBody = await hRes.json().catch(() => ({}));
      const pBody = await pRes.json().catch(() => ({}));
      if (!hRes.ok) throw new Error(hBody.error || "Holder load failed");
      if (!pRes.ok) throw new Error(pBody.error || "Portfolio load failed");
      setHolder(hBody as HolderPayload);
      setPortfolio(pBody as PortfolioPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setHolder(null);
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const targetPct = Math.round((fees?.target_pct ?? ANSEM_TARGET_PCT) * 100);
  const ansemPct = fees?.latest?.ansem_pct ?? 0;
  const ansemPctDisplay = Math.min(100, Math.max(0, ansemPct * 100));
  const progressToGate = Math.min(100, (ansemPct / ANSEM_TARGET_PCT) * 100);
  const phase = fees?.latest?.gate_phase ?? "build";
  const atGate = phase === "buybacks" || ansemPct >= ANSEM_TARGET_PCT;

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
            Creator fees
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-zinc-500">
            $AI (ANSEM Index) creator fees buy ANSEM toward the {targetPct}%
            goal. Fees are <span className="text-zinc-300">$0</span> until
            live. Under {targetPct}%: send / seed. At {targetPct}%+: buybacks.
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

      {/* 0 → 70% ANSEM goal — primary creator-fee story */}
      <section className="rounded border border-emerald-900/40 bg-emerald-950/15 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-sm font-semibold text-emerald-100/90">
            $AI fees → ANSEM · 0 → {targetPct}%
          </h2>
          <span
            className={`font-mono text-[10px] uppercase tracking-wider ${
              atGate ? "text-emerald-400" : "text-emerald-200/80"
            }`}
          >
            {atGate ? "Buybacks" : "Build · fees $0"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-zinc-400">
          When live, $AI creator fees buy ANSEM until the index stack hits{" "}
          {targetPct}% ANSEM — then buybacks. Today creator fees are{" "}
          <span className="text-zinc-200">$0</span>.{" "}
          <Link
            href="/whitepaper#flywheel"
            className="text-emerald-400 hover:underline"
          >
            Fee chart →
          </Link>
        </p>

        <div className="mt-5">
          <div className="mb-1.5 flex justify-between font-mono text-[10px] text-zinc-500">
            <span>0%</span>
            <span className="text-zinc-300">
              {ansemPctDisplay.toFixed(1)}% ANSEM
              {fees?.latest
                ? ` · ${fmtMoney(fees.latest.total_ansem_usd)} / ${fmtMoney(fees.latest.total_position_usd)}`
                : " · awaiting snapshot"}
            </span>
            <span>{targetPct}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/80 transition-all"
              style={{ width: `${progressToGate}%` }}
            />
            <div
              className="absolute inset-y-0 w-px bg-zinc-100/40"
              style={{ left: "100%" }}
              aria-hidden
            />
          </div>
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            Progress bar = share of the way to the {targetPct}% gate (not raw
            ANSEM %). Ledger: {fees?.recent_ticks ?? 0} ticks ·{" "}
            {fmtMoney(fees?.cumulative_creator_sends_usd ?? 0)} creator sends
            (incl. dry).
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <p className="py-12 text-center font-mono text-sm text-zinc-500">
          Loading creator fee wallet…
        </p>
      )}

      {!loading && !feeWallet && (
        <p className="rounded border border-emerald-900/40 bg-emerald-950/15 px-4 py-4 font-mono text-xs text-zinc-400">
          {sourceNote || "Creator fee wallet not configured."}
        </p>
      )}

      {!loading && feeWallet && (
        <>
          <div className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Creator fee wallet
            </div>
            <a
              href={solscanAccount(feeWallet)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-all font-mono text-sm text-sky-400 hover:underline"
            >
              {feeWallet}
            </a>
            <p className="mt-2 font-mono text-[11px] text-zinc-500">
              {sourceNote}
            </p>
            <p className="mt-1 font-mono text-[10px] text-zinc-600">
              {shortCa(feeWallet, 6, 6)}
            </p>
          </div>

          {holder && portfolio && (
            <>
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Index tokens" value={String(holdings.length)} />
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
                <PieChart title="Index allocation" slices={pie} size={180} />
                <div className="overflow-x-auto">
                  <h2 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Holdings
                  </h2>
                  {holdings.length === 0 ? (
                    <p className="font-mono text-xs text-zinc-500">
                      No index-token balances yet.
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
                        {holdings.slice(0, 25).map((h) => (
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
                    No open Meteora DAMM positions on the creator fee wallet.
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
        </>
      )}

      {/* Fee ledger from Postgres */}
      <section className="space-y-3 border-t border-zinc-800 pt-6">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Fee ledger
        </h2>
        <p className="font-mono text-[11px] text-zinc-500">
          Every keeper tick and creator-fee send is stored in Postgres (pubkeys
          + amounts + sigs — never keys).
        </p>

        {(fees?.recent_sends?.length ?? 0) === 0 &&
        (fees?.recent_events?.length ?? 0) === 0 ? (
          <p className="font-mono text-xs text-zinc-600">
            No fee events yet. Run a dry tick from{" "}
            <Link href="/manage" className="text-sky-400 hover:underline">
              Manage
            </Link>{" "}
            or wait for the next index refresh to write an ANSEM % snapshot.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto rounded border border-zinc-800">
              <h3 className="border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                Creator sends
              </h3>
              <table className="w-full border-collapse text-left">
                <tbody>
                  {(fees?.recent_sends ?? []).slice(0, 12).map((s) => (
                    <tr key={s.id} className="border-b border-zinc-800/60">
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-400">
                        {new Date(s.sent_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-emerald-200/90">
                        {fmtMoney(s.usd)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[10px] text-zinc-500">
                        {s.dry_run ? "dry" : s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded border border-zinc-800">
              <h3 className="border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">
                Recent events
              </h3>
              <table className="w-full border-collapse text-left">
                <tbody>
                  {(fees?.recent_events ?? []).slice(0, 12).map((e) => (
                    <tr key={e.id} className="border-b border-zinc-800/60">
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-300">
                        {e.event_type}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-zinc-400">
                        {e.usd != null ? fmtMoney(e.usd) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[10px] text-zinc-500">
                        {e.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
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
