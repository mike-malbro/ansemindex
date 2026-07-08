"use client";

import type { EnrichedPosition } from "@/lib/types";
import {
  dexTokenUrl,
  fmtMoney,
  fmtPct,
  meteoraPoolUrl,
  pnlClass,
  shortCa,
  solscanAccount,
  solscanToken,
} from "@/lib/format";

type SortKey =
  | "value"
  | "fees"
  | "pnl"
  | "volume"
  | "ticker"
  | "change24h";

type Props = {
  positions: EnrichedPosition[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onSelect: (p: EnrichedPosition) => void;
  selected?: string;
};

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
      } ${align === "right" ? "justify-end w-full" : ""}`}
    >
      {label}
      {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

export function PositionsTable({
  positions,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  selected,
}: Props) {
  return (
    <div className="overflow-x-auto rounded border border-zinc-800">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-zinc-900/80">
          <tr className="border-b border-zinc-800">
            <th className="px-3 py-2">
              <SortBtn
                label="Ticker"
                active={sortKey === "ticker"}
                dir={sortDir}
                onClick={() => onSort("ticker")}
                align="left"
              />
            </th>
            <th className="px-3 py-2 text-right">
              <SortBtn
                label="Value"
                active={sortKey === "value"}
                dir={sortDir}
                onClick={() => onSort("value")}
              />
            </th>
            <th className="px-3 py-2 text-right">
              <SortBtn
                label="Fees"
                active={sortKey === "fees"}
                dir={sortDir}
                onClick={() => onSort("fees")}
              />
            </th>
            <th className="px-3 py-2 text-right">
              <SortBtn
                label="24h"
                active={sortKey === "change24h"}
                dir={sortDir}
                onClick={() => onSort("change24h")}
              />
            </th>
            <th className="px-3 py-2 text-right">
              <SortBtn
                label="Vol 24h"
                active={sortKey === "volume"}
                dir={sortDir}
                onClick={() => onSort("volume")}
              />
            </th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Fee %
            </th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              MC
            </th>
            <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Links
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const isSel = selected === p.position_address;
            return (
              <tr
                key={p.position_address}
                onClick={() => onSelect(p)}
                className={`cursor-pointer border-b border-zinc-800/80 transition hover:bg-zinc-900/70 ${
                  isSel ? "bg-zinc-900" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-7 w-7 rounded-full bg-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] text-zinc-400">
                        {p.ticker.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="font-mono text-sm font-medium text-zinc-100">
                        {p.ticker}
                        <span className="text-zinc-500">-ANSEM</span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-600">
                        {shortCa(p.pool_address)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-100">
                  {fmtMoney(p.position_value_usd)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-amber-300/90">
                  {fmtMoney(p.unclaimed_fees_usd)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-mono text-sm tabular-nums ${pnlClass(p.price_change_24h)}`}
                >
                  {fmtPct(p.price_change_24h)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-zinc-300">
                  {fmtMoney(p.volume_24h)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-400">
                  {p.pool_config?.base_fee_pct != null
                    ? `${p.pool_config.base_fee_pct}%`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-400">
                  {fmtMoney(p.market_cap)}
                </td>
                <td
                  className="px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-2 font-mono text-[10px]">
                    <a
                      href={solscanToken(p.constituent_token.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      Token
                    </a>
                    <a
                      href={solscanAccount(p.pool_address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      Pool
                    </a>
                    <a
                      href={meteoraPoolUrl(p.pool_address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      Meteora
                    </a>
                    <a
                      href={dexTokenUrl(p.constituent_token.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      Dex
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
          {positions.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-10 text-center font-mono text-sm text-zinc-500"
              >
                No positions match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
