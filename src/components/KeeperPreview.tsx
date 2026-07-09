"use client";

import { useMemo } from "react";
import type { EnrichedPosition } from "@/lib/types";
import { planFeeClaims } from "@/lib/keeper";
import { fmtMoney } from "@/lib/format";

export function KeeperPreview({
  positions,
}: {
  positions: EnrichedPosition[];
}) {
  const plan = useMemo(
    () =>
      planFeeClaims(
        positions.map((p) => ({
          position_address: p.position_address,
          pool_address: p.pool_address,
          unclaimed_fees_usd: p.unclaimed_fees_usd,
        })),
      ),
    [positions],
  );

  const totalFees = plan.actions.reduce(
    (s, a) => (a.type === "claim_fees" ? s + a.fees_usd : s),
    0,
  );

  return (
    <section className="rounded border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Management (preview)
        </h2>
        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
          {plan.dry_run ? "DRY RUN" : "LIVE"} ·{" "}
          {plan.has_key ? "key present" : "no key"}
        </span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-zinc-500">
        Fee flow (LIFE-style): claim → sweep → buy ANSEM → send to creator
        wallet (not burn). Open{" "}
        <a href="/manage" className="text-sky-400 hover:underline">
          Manage
        </a>{" "}
        to run dry ticks and wire wallets.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div className="font-mono text-[10px] text-zinc-500">Claimable actions</div>
          <div className="font-mono text-lg text-zinc-100">{plan.actions.length}</div>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div className="font-mono text-[10px] text-zinc-500">Fees to claim</div>
          <div className="font-mono text-lg text-emerald-300">{fmtMoney(totalFees)}</div>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div className="font-mono text-[10px] text-zinc-500">Status</div>
          <div className="font-mono text-sm text-zinc-300">
            {plan.notes[0] ?? "Ready"}
          </div>
        </div>
      </div>

      {plan.actions.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[11px] text-zinc-400 hover:text-zinc-200">
            Show planned claim list
          </summary>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-zinc-500">
            {plan.actions.slice(0, 50).map((a) =>
              a.type === "claim_fees" ? (
                <li key={a.position}>
                  claim {fmtMoney(a.fees_usd)} · pos {a.position.slice(0, 8)}… ·
                  pool {a.pool.slice(0, 8)}…
                </li>
              ) : null,
            )}
            {plan.actions.length > 50 && (
              <li>…and {plan.actions.length - 50} more</li>
            )}
          </ul>
        </details>
      )}
    </section>
  );
}
