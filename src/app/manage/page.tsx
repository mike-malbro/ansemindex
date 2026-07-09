"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { OperatorBotReport } from "@/components/OperatorBotReport";
import { ANSEM_TARGET_PCT } from "@/lib/thesis";
import { NODE_MIN_USD, START_LIST, startListFloorUsd } from "@/lib/whitepaper";

type KeeperState = {
  source?: string;
  config?: {
    lpWallet?: string;
    operatorWallet?: string | null;
    ansemDestWallet?: string | null;
    ansemMint?: string;
    dryRun?: boolean;
    live?: boolean;
    feeSplit?: { ansemSend?: number; reserve?: number; reinvest?: number };
    note?: string;
  };
  lastTick?: Record<string, unknown> | null;
  keys?: { ok?: boolean; errors?: string[] };
  error?: string;
};

export default function ManagePage() {
  const [state, setState] = useState<KeeperState | null>(null);
  const [tickOut, setTickOut] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/keeper", { cache: "no-store" });
      const j = await res.json();
      setState(j);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runTick() {
    setBusy(true);
    setTickOut(null);
    try {
      const res = await fetch("/api/keeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tick" }),
      });
      const j = await res.json();
      setTickOut(j);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "tick failed");
    } finally {
      setBusy(false);
    }
  }

  const c = state?.config;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      <SiteNav />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Operator desk · not public marketing
        </p>
        <h1 className="mt-1 text-xl font-semibold">Management</h1>
        <p className="mt-1 text-[11px] text-zinc-500">
          Pubkeys only. $ANSEMLP creator fees → buy ANSEM until{" "}
          {(ANSEM_TARGET_PCT * 100).toFixed(0)}% → buybacks · $
          {NODE_MIN_USD}/node floor. Fees $0 until live.
        </p>
      </div>

      <OperatorBotReport />

      {err && (
        <div className="mb-4 rounded border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
          {err}
        </div>
      )}

      <section className="mb-6 space-y-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Wallet structure</h2>
        <WalletRow label="W1 LP (claims)" value={c?.lpWallet} />
        <WalletRow label="W2 Operator (buy/send)" value={c?.operatorWallet} />
        <WalletRow label="ANSEM dest (creator fee)" value={c?.ansemDestWallet} />
        <div className="pt-2 text-[11px] text-zinc-500">
          Mode:{" "}
          <span className={c?.live ? "text-emerald-400" : "text-emerald-300"}>
            {c?.live ? "LIVE" : "DRY RUN"}
          </span>
          {c?.note && <span className="ml-2">· {c.note}</span>}
        </div>
        {c?.feeSplit && (
          <div className="text-[11px] text-zinc-400">
            Split: {(Number(c.feeSplit.ansemSend) * 100).toFixed(0)}% buy+send
            ANSEM · {(Number(c.feeSplit.reserve) * 100).toFixed(0)}% reserve
          </div>
        )}
      </section>

      <section className="mb-6 space-y-3 rounded border border-dashed border-zinc-700 bg-zinc-900/20 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">
          Add to pools (Part 1)
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-xs text-zinc-400">
          <li>
            Claim creator/LP fees → buy ANSEM → send to creator fee wallet.
          </li>
          <li>
            Fund <strong className="text-zinc-200">dual-sided</strong> TOKEN–ANSEM
            pools on{" "}
            <a
              className="text-sky-400 hover:underline"
              href="https://app.meteora.ag"
              target="_blank"
              rel="noreferrer"
            >
              app.meteora.ag
            </a>{" "}
            with <strong className="text-zinc-200">W1</strong>.
          </li>
          <li>
            Seed the start list: ~${NODE_MIN_USD} per node until every node has
            the floor (≈ ${startListFloorUsd()} across {START_LIST.length}{" "}
            nodes).
          </li>
          <li>Then add more to winners — leave the rest at minimum.</li>
        </ol>
        <p className="text-[11px] text-zinc-500">
          Full write-up:{" "}
          <Link href="/whitepaper#part-1" className="text-sky-400 hover:underline">
            Whitepaper Part 1
          </Link>
          . Edit list in{" "}
          <code className="text-zinc-400">src/lib/whitepaper.ts</code>.
        </p>
      </section>

      <section className="mb-6 space-y-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Launch checklist</h2>
        <Checklist
          items={[
            ["W1 LP wallet set", Boolean(c?.lpWallet)],
            ["W2 operator wallet set", Boolean(c?.operatorWallet)],
            ["ANSEM dest wallet set", Boolean(c?.ansemDestWallet)],
            [
              "Keys on keeper (Railway secrets)",
              Boolean(state?.keys?.ok) || state?.source === "hub",
            ],
            ["Dry ticks OK before go-live", !c?.live],
          ]}
        />
        <p className="text-[11px] text-zinc-500">
          Go live on the keeper service:{" "}
          <code className="text-zinc-400">DRY_RUN=false SIMULATION_MODE=false</code>{" "}
          after wiring keys. Hub never holds private keys.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={runTick}
          className="rounded border border-emerald-700/60 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
        >
          {busy ? "Running…" : "Run dry tick"}
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded border border-zinc-700 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
        >
          Refresh state
        </button>
      </div>

      {tickOut != null && (
        <pre className="mt-4 max-h-96 overflow-auto rounded border border-zinc-800 bg-black/40 p-3 text-[10px] text-zinc-400">
          {JSON.stringify(tickOut, null, 2)}
        </pre>
      )}

      {state?.lastTick != null && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
            Last tick
          </h3>
          <pre className="max-h-64 overflow-auto rounded border border-zinc-800 bg-black/40 p-3 text-[10px] text-zinc-400">
            {JSON.stringify(state.lastTick, null, 2)}
          </pre>
        </div>
      )}
      </div>
      <SiteFooter />
    </div>
  );
}

function WalletRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="break-all text-zinc-200">
        {value || <span className="text-rose-400">unset</span>}
      </span>
    </div>
  );
}

function Checklist({ items }: { items: [string, boolean][] }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {items.map(([label, ok]) => (
        <li key={label} className="flex items-center gap-2">
          <span className={ok ? "text-emerald-400" : "text-zinc-600"}>
            {ok ? "✓" : "○"}
          </span>
          <span className={ok ? "text-zinc-300" : "text-zinc-500"}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
