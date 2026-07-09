"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fmtMoney, shortCa, solscanAccount } from "@/lib/format";
import { ANSEM_TARGET_PCT } from "@/lib/thesis";
import { PoolIndexBook } from "./PoolIndexBook";

type KeeperState = {
  config?: {
    ansemDestWallet?: string | null;
    lpWallet?: string;
  };
};

type FeeDash = {
  target_pct: number;
  latest: {
    ansem_pct: number;
    total_ansem_usd: number;
    total_position_usd: number;
    gate_phase: string;
  } | null;
  cumulative_creator_sends_usd: number;
  recent_sends: {
    id: string;
    usd: number;
    dry_run: boolean;
    status: string;
    sent_at: string;
  }[];
  recent_events: {
    id: string;
    event_type: string;
    status: string;
    usd: number | null;
  }[];
  recent_ticks: number;
};

/**
 * Creator = exact same Index pool book, with fee-wallet Your % overlaid.
 */
export function CreatorFeePanel() {
  const [feeWallet, setFeeWallet] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState("");
  const [fees, setFees] = useState<FeeDash | null>(null);
  const [ready, setReady] = useState(false);

  const loadMeta = useCallback(async () => {
    try {
      const [kRes, fRes] = await Promise.all([
        fetch("/api/keeper", { cache: "no-store" }),
        fetch("/api/fees", { cache: "no-store" }),
      ]);
      const k = (await kRes.json()) as KeeperState;
      if (fRes.ok) setFees((await fRes.json()) as FeeDash);

      const dest = (k.config?.ansemDestWallet ?? "").trim() || null;
      setFeeWallet(dest);
      setSourceNote(
        dest
          ? "$AI creator-fee destination — Your % on the Index pool book."
          : "ANSEM_DEST_WALLET unset — showing Index book with 0% Your % until set.",
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const targetPct = Math.round((fees?.target_pct ?? ANSEM_TARGET_PCT) * 100);
  const ansemPct = fees?.latest?.ansem_pct ?? 0;
  const ansemPctDisplay = Math.min(100, Math.max(0, ansemPct * 100));
  const progressToGate = Math.min(100, (ansemPct / ANSEM_TARGET_PCT) * 100);
  const atGate =
    fees?.latest?.gate_phase === "buybacks" || ansemPct >= ANSEM_TARGET_PCT;

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-20 text-center font-mono text-sm text-zinc-500 sm:px-6">
        Loading…
      </div>
    );
  }

  return (
    <>
      <PoolIndexBook
        embedded
        mode="wallet"
        wallet={feeWallet}
        title="Creator fees"
        subtitle="Exact same Index pool book. Your % = fee wallet LP ÷ pool TVL on each TOKEN–ANSEM pool."
        refreshLabel="Refresh"
        caption="Same pool book as Index — only Your % is this fee wallet’s share of each pool."
        lead={
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
                  {sourceNote}
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
                    : ""}
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
                {fmtMoney(fees?.cumulative_creator_sends_usd ?? 0)} sends ·{" "}
                <Link
                  href="/whitepaper#flywheel"
                  className="text-sky-400 hover:underline"
                >
                  Fee chart →
                </Link>
              </p>
            </div>
          </section>
        }
      />

      <div className="mx-auto w-full max-w-[1400px] space-y-3 px-4 pb-8 sm:px-6">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Fee ledger
        </h2>
        {(fees?.recent_sends?.length ?? 0) === 0 &&
        (fees?.recent_events?.length ?? 0) === 0 ? (
          <p className="font-mono text-xs text-zinc-600">
            No fee events yet.{" "}
            <Link href="/manage" className="text-sky-400 hover:underline">
              Manage
            </Link>
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
