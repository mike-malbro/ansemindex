import type { PortfolioPayload } from "@/lib/types";
import { fmtMoney, fmtPct, pnlClass, shortCa } from "@/lib/format";

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

export function PortfolioHeader({ data }: { data: PortfolioPayload }) {
  const t = data.totals;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] text-zinc-500">Tracked wallet</p>
          <p className="font-mono text-xs text-zinc-300" title={data.wallet}>
            {shortCa(data.wallet, 6, 6)}
          </p>
        </div>
        <p className="font-mono text-[10px] text-zinc-600">
          SOL ${data.sol_price?.toFixed(2)} · fetched{" "}
          {new Date(data.fetched_at).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Balances" value={fmtMoney(t.balances)} sub={`${t.balances_sol?.toFixed(2)} SOL`} />
        <Stat
          label="Unclaimed fees"
          value={fmtMoney(t.unclaimed_fees)}
          sub={`${t.unclaimed_fees_sol?.toFixed(4)} SOL`}
          valueClass="text-emerald-300"
        />
        <Stat
          label="Total deposits"
          value={fmtMoney(t.total_deposits)}
          sub={`${t.total_deposits_sol?.toFixed(2)} SOL`}
        />
        <Stat
          label="PnL"
          value={fmtMoney(t.pnl)}
          sub={fmtPct(t.pnl_pct_change)}
          valueClass={pnlClass(t.pnl)}
        />
        <Stat label="Positions" value={String(data.total_positions)} />
        <Stat label="Pools" value={String(data.total_pools)} />
      </div>
    </section>
  );
}
