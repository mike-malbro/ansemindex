"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { EnrichedPosition, PortfolioPayload } from "@/lib/types";
import { fmtMoney, shortCa, solscanAccount } from "@/lib/format";
import { ANSEM_TARGET_PCT } from "@/lib/thesis";
import { PortfolioPoolBook } from "./PortfolioPoolBook";

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

const EMPTY_FEES = {
  unclaimed_usd: 0,
  claimed_usd: 0,
  compounded_usd: 0,
  generated_usd: 0,
  compound_pct: 90,
  claim_pct: 10,
};

function normalizePositions(raw: EnrichedPosition[] | undefined): EnrichedPosition[] {
  return (raw ?? []).map((p) => ({
    ...p,
    fees_generated_usd: Number(p.fees_generated_usd) || 0,
    claimed_fees_usd: Number(p.claimed_fees_usd) || 0,
    compounded_fees_usd: Number(p.compounded_fees_usd) || 0,
    unclaimed_fees_usd: Number(p.unclaimed_fees_usd) || 0,
    position_value_usd: Number(p.position_value_usd) || 0,
  }));
}

/**
 * Creator tab — same board as Index (stats → pies → sortable 5m/1h/6h/24h table).
 * Always renders zeros when the fee wallet has no pools — never blank.
 */
export function CreatorFeePanel() {
  const [feeWallet, setFeeWallet] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string>("");
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

      // Creator fee dest only — do not fall back to LP (that duplicates Index).
      const dest = (k.config?.ansemDestWallet ?? "").trim() || null;
      if (!dest) {
        setFeeWallet(null);
        setSourceNote(
          "ANSEM_DEST_WALLET unset — creator fee wallet has $0 / 0 pools until configured.",
        );
        setPortfolio(null);
        return;
      }

      setFeeWallet(dest);
      setSourceNote(
        "$AI creator-fee destination — bought ANSEM lands here toward the 70% gate.",
      );

      const pRes = await fetch(
        `/api/portfolio?wallet=${encodeURIComponent(dest)}`,
        { cache: "no-store" },
      );
      const pBody = await pRes.json().catch(() => ({}));
      if (!pRes.ok) throw new Error(pBody.error || "Portfolio load failed");
      setPortfolio(pBody as PortfolioPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
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

  const feeTotals = portfolio?.fee_totals ?? EMPTY_FEES;
  const positions = normalizePositions(portfolio?.positions);
  const amountUsd = Number(portfolio?.totals?.balances) || 0;
  const poolCount = portfolio?.total_pools ?? positions.length;

  const gateLead = (
    <section className="rounded border border-zinc-800 bg-zinc-900/30 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Fee wallet
          </div>
          {feeWallet ? (
            <a
              href={solscanAccount(feeWallet)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-sm text-sky-400 hover:underline"
            >
              {shortCa(feeWallet, 6, 6)}
            </a>
          ) : (
            <p className="mt-1 font-mono text-sm text-zinc-500">Not set</p>
          )}
          <p className="mt-1 max-w-xl font-mono text-[10px] text-zinc-600">
            {sourceNote ||
              "$AI creator fees buy ANSEM toward the gate. Fees are $0 until live."}
          </p>
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            atGate ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {atGate ? "Buybacks" : "Build · fees $0"}
        </span>
      </div>

      <div className="mt-4">
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
        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70 transition-all"
            style={{ width: `${progressToGate}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-zinc-600">
          0 → {targetPct}% gate · {fees?.recent_ticks ?? 0} ticks ·{" "}
          {fmtMoney(fees?.cumulative_creator_sends_usd ?? 0)} creator sends ·{" "}
          <Link
            href="/whitepaper#flywheel"
            className="text-sky-400 hover:underline"
          >
            Fee chart →
          </Link>
        </p>
      </div>

      {error && (
        <p className="mt-3 font-mono text-xs text-rose-400">{error}</p>
      )}
    </section>
  );

  if (loading && !portfolio && feeWallet === null && !sourceNote) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-20 text-center font-mono text-sm text-zinc-500 sm:px-6">
        Loading creator fee wallet…
      </div>
    );
  }

  return (
    <>
      <PortfolioPoolBook
        title="Creator fees"
        subtitle={`$AI creator fees buy ANSEM toward the ${targetPct}% gate. Same pool book as Index — sort by 5m / 1h / 6h / 24h. Fees are $0 until live.`}
        refreshLabel="Refresh"
        onRefresh={() => void load()}
        refreshing={loading}
        amountLabel="Amount"
        amountUsd={amountUsd}
        poolCount={poolCount}
        fees={{
          unclaimed_usd: Number(feeTotals.unclaimed_usd) || 0,
          claimed_usd: Number(feeTotals.claimed_usd) || 0,
          compounded_usd: Number(feeTotals.compounded_usd) || 0,
          generated_usd: Number(feeTotals.generated_usd) || 0,
          compound_pct: feeTotals.compound_pct ?? 90,
          claim_pct: feeTotals.claim_pct ?? 10,
        }}
        positions={positions}
        caption="$AI creator fees buy ANSEM toward the 70% gate. Fees are $0 until live."
        emptyMessage={
          feeWallet
            ? "0 pools on the creator fee wallet — no open TOKEN–ANSEM LPs yet."
            : "0 pools — set ANSEM_DEST_WALLET to track the creator fee wallet."
        }
        lead={gateLead}
      />

      <div className="mx-auto w-full max-w-[1400px] space-y-3 px-4 pb-8 sm:px-6">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Fee ledger
        </h2>
        <p className="font-mono text-[11px] text-zinc-500">
          Keeper ticks and creator-fee sends in Postgres (pubkeys + amounts +
          sigs — never keys).
        </p>

        {(fees?.recent_sends?.length ?? 0) === 0 &&
        (fees?.recent_events?.length ?? 0) === 0 ? (
          <p className="font-mono text-xs text-zinc-600">
            No fee events yet. Run a dry tick from{" "}
            <Link href="/manage" className="text-sky-400 hover:underline">
              Manage
            </Link>{" "}
            or wait for the next index refresh.
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
      </div>
    </>
  );
}
