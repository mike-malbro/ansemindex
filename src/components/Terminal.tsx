"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrichedPosition, PortfolioPayload } from "@/lib/types";
import { PortfolioHeader } from "./PortfolioHeader";
import { PositionsTable } from "./PositionsTable";
import { PositionDetail } from "./PositionDetail";
import { KeeperPreview } from "./KeeperPreview";
import { REFRESH_INTERVAL_MS } from "@/lib/config";

type SortKey =
  | "value"
  | "fees"
  | "pnl"
  | "volume"
  | "ticker"
  | "change24h";

export function Terminal({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EnrichedPosition | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as PortfolioPayload;
      setData(json);
      setLastFetch(new Date().toISOString());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const positions = useMemo(() => {
    if (!data) return [];
    let rows = [...data.positions];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.ticker.toLowerCase().includes(q) ||
          p.pool_name.toLowerCase().includes(q) ||
          p.constituent_token.address.toLowerCase().includes(q) ||
          p.pool_address.toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case "ticker":
          return dir * a.ticker.localeCompare(b.ticker);
        case "fees":
          return dir * (a.unclaimed_fees_usd - b.unclaimed_fees_usd);
        case "pnl":
          return dir * ((a.pnl ?? 0) - (b.pnl ?? 0));
        case "volume":
          return dir * ((a.volume_24h ?? 0) - (b.volume_24h ?? 0));
        case "change24h":
          return dir * ((a.price_change_24h ?? 0) - (b.price_change_24h ?? 0));
        case "value":
        default:
          return dir * (a.position_value_usd - b.position_value_usd);
      }
    });
    return rows;
  }, [data, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!embedded && (
        <header className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <h1 className="font-mono text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
                Controller book
              </h1>
              <p className="font-mono text-[11px] text-zinc-500">
                Meteora DAMM v2 · read-only · not our treasury
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastFetch && (
                <span className="hidden font-mono text-[10px] text-zinc-500 sm:inline">
                  synced {new Date(lastFetch).toLocaleTimeString()}
                </span>
              )}
              <a
                href="/"
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Guide
              </a>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {embedded && (
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-mono text-sm font-semibold text-zinc-200">
              Controller book
            </h1>
            <div className="flex items-center gap-3">
              {lastFetch && (
                <span className="font-mono text-[10px] text-zinc-500">
                  synced {new Date(lastFetch).toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-mono text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex flex-1 items-center justify-center py-24 font-mono text-sm text-zinc-500">
            Loading portfolio…
          </div>
        )}

        {data && (
          <>
            <PortfolioHeader data={data} />

            <div className="flex flex-wrap items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter ticker / pool / CA…"
                className="w-full max-w-sm rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none sm:w-72"
              />
              <span className="font-mono text-[11px] text-zinc-500">
                {positions.length} / {data.total_positions} positions ·{" "}
                {data.total_pools} pools
              </span>
            </div>

            <PositionsTable
              positions={positions}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              onSelect={setSelected}
              selected={selected?.position_address}
            />

            <KeeperPreview positions={data.positions} />
          </>
        )}
      </main>

      {selected && (
        <PositionDetail
          position={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
