"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import type { EnrichedPosition } from "@/lib/types";
import {
  fmtAmount,
  fmtMoney,
  fmtPct,
  meteoraPoolUrl,
  pnlClass,
  shortCa,
  solscanAccount,
  solscanToken,
} from "@/lib/format";

type PoolApi = {
  address: string;
  pool?: Record<string, unknown>;
  ohlcv?: { data?: Candle[]; candles?: Candle[]; error?: string };
  volume?: { data?: VolPoint[]; error?: string };
};

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type VolPoint = { time: number; volume: number; volume_usd?: number };

export function PositionDetail({
  position,
  onClose,
}: {
  position: EnrichedPosition;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PoolApi | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setErr(null);
    fetch(`/api/pool/${position.pool_address}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setDetail(j);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [position.pool_address]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!chartRef.current || !detail) return;

    const candles: Candle[] =
      detail.ohlcv?.candles ?? detail.ohlcv?.data ?? [];

    if (chartApi.current) {
      chartApi.current.remove();
      chartApi.current = null;
    }

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "#09090b" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#18181b" },
        horzLines: { color: "#18181b" },
      },
      width: chartRef.current.clientWidth,
      height: 280,
      timeScale: { borderColor: "#27272a" },
      rightPriceScale: { borderColor: "#27272a" },
    });
    chartApi.current = chart;

    if (candles.length > 0) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#34d399",
        downColor: "#fb7185",
        borderVisible: false,
        wickUpColor: "#34d399",
        wickDownColor: "#fb7185",
      }) as ISeriesApi<"Candlestick">;

      const sorted = [...candles]
        .map((c) => ({
          time: (c.time > 1e12 ? Math.floor(c.time / 1000) : c.time) as number,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
        .sort((a, b) => a.time - b.time);

      // lightweight-charts wants UTCTimestamp
      series.setData(
        sorted.map((c) => ({
          time: c.time as unknown as import("lightweight-charts").UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );

      const vols = sorted
        .map((c, i) => ({
          time: c.time as unknown as import("lightweight-charts").UTCTimestamp,
          value: candles[i]?.volume ?? 0,
          color:
            c.close >= c.open
              ? "rgba(52,211,153,0.35)"
              : "rgba(251,113,133,0.35)",
        }))
        .filter((v) => v.value > 0);

      if (vols.length) {
        const hist = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        hist.setData(vols);
      }

      chart.timeScale().fitContent();
    }

    const onResize = () => {
      if (chartRef.current && chartApi.current) {
        chartApi.current.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartApi.current = null;
    };
  }, [detail]);

  const d = position.current_position?.current_deposits;
  const fees = position.current_position?.unclaimed_fees;
  const locked = position.current_position?.locked_liquidity;
  const ansemIsY =
    position.token_y.address === position.ansem_token.address;
  const yourTokenAmt = ansemIsY ? d?.amount_x : d?.amount_y;
  const yourAnsemAmt = ansemIsY ? d?.amount_y : d?.amount_x;
  const tokenFeeAmt = ansemIsY ? fees?.amount_x : fees?.amount_y;
  const ansemFeeAmt = ansemIsY ? fees?.amount_y : fees?.amount_x;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4">
          <div className="flex items-center gap-3">
            {position.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={position.image_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <div>
              <h2 className="font-mono text-lg font-semibold text-zinc-100">
                {position.ticker}
                <span className="text-zinc-500">-ANSEM</span>
              </h2>
              <p className="font-mono text-[11px] text-zinc-500">
                {shortCa(position.pool_address, 6, 6)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-700 px-2 py-1 font-mono text-xs text-zinc-300 hover:bg-zinc-900"
          >
            Esc
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Position value" value={fmtMoney(position.position_value_usd)} />
            <Metric
              label="Unclaimed fees"
              value={fmtMoney(position.unclaimed_fees_usd)}
              className="text-emerald-300"
            />
            <Metric
              label="Your token"
              value={fmtAmount(yourTokenAmt)}
              sub={position.constituent_token.symbol}
            />
            <Metric
              label="Your ANSEM"
              value={fmtAmount(yourAnsemAmt)}
              sub="ANSEM"
            />
            <Metric label="Token fees" value={fmtAmount(tokenFeeAmt)} />
            <Metric label="ANSEM fees" value={fmtAmount(ansemFeeAmt)} />
            <Metric
              label="24h change"
              value={fmtPct(position.price_change_24h)}
              className={pnlClass(position.price_change_24h)}
            />
            <Metric label="Base fee" value={`${position.pool_config?.base_fee_pct ?? "—"}%`} />
          </div>

          {locked && (
            <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 font-mono text-[11px] text-zinc-400">
              Locked liquidity:{" "}
              {locked.has_locked_liquidity
                ? `${locked.permanent_locked_pct}% permanent · ${locked.vesting_pct}% vesting · ${locked.unlocked_pct}% unlocked`
                : "none (100% unlocked)"}
            </div>
          )}

          <div>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              OHLCV
            </h3>
            {err && (
              <p className="font-mono text-xs text-rose-400">{err}</p>
            )}
            {!detail && !err && (
              <p className="font-mono text-xs text-zinc-600">Loading chart…</p>
            )}
            <div ref={chartRef} className="w-full rounded border border-zinc-800" />
            {detail?.ohlcv &&
              !(detail.ohlcv.candles?.length || detail.ohlcv.data?.length) && (
                <p className="mt-2 font-mono text-[11px] text-zinc-600">
                  No candle data returned for this pool.
                </p>
              )}
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <a
              className="text-sky-400 hover:underline"
              href={solscanToken(position.constituent_token.address)}
              target="_blank"
              rel="noreferrer"
            >
              Solscan token
            </a>
            <a
              className="text-sky-400 hover:underline"
              href={solscanAccount(position.pool_address)}
              target="_blank"
              rel="noreferrer"
            >
              Solscan pool
            </a>
            <a
              className="text-sky-400 hover:underline"
              href={meteoraPoolUrl(position.pool_address)}
              target="_blank"
              rel="noreferrer"
            >
              Meteora
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono text-sm tabular-nums ${className ?? "text-zinc-100"}`}
      >
        {value}
        {sub && <span className="ml-1 text-[10px] text-zinc-500">{sub}</span>}
      </div>
    </div>
  );
}
