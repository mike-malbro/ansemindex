import { METEORA_DAMM_V2_BASE } from "./config";
import { cacheGet, cacheSet, meteoraLimiter } from "./cache";
import type {
  OhlcvResponse,
  OpenPosition,
  OpenPositionsResponse,
  PoolResponse,
  PositionsByPool,
  VolumeHistoryResponse,
} from "./types";

const DEFAULT_TTL_MS = 20_000;
const POOL_TTL_MS = 30_000;
const CHART_TTL_MS = 60_000;

async function meteoraGet<T>(
  path: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const cacheKey = `meteora:${path}`;
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  await meteoraLimiter.take();

  const url = `${METEORA_DAMM_V2_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ansem-index/1.0" },
    next: { revalidate: Math.floor(ttlMs / 1000) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meteora ${res.status} ${path}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as T;
  cacheSet(cacheKey, data, ttlMs);
  return data;
}

function flattenPositions(
  data: OpenPosition[] | PositionsByPool[],
): OpenPosition[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const first = data[0] as OpenPosition | PositionsByPool;
  if ("positions" in first && Array.isArray(first.positions)) {
    return (data as PositionsByPool[]).flatMap((g) =>
      g.positions.map((p) => ({
        ...p,
        pool_address: p.pool_address || g.pool_address,
        pool_name: p.pool_name || g.pool_name || p.pool_name,
      })),
    );
  }

  return data as OpenPosition[];
}

export async function getOpenPositions(
  wallet: string,
): Promise<OpenPositionsResponse & { positions: OpenPosition[] }> {
  const raw = await meteoraGet<OpenPositionsResponse>(
    `/wallets/${wallet}/open_positions`,
  );
  const positions = flattenPositions(raw.data);
  const totalPools =
    raw.total_pools ??
    new Set(positions.map((p) => p.pool_address)).size;

  return { ...raw, positions, total_pools: totalPools };
}

export async function getClosedPositions(wallet: string) {
  return meteoraGet(`/wallets/${wallet}/closed_positions`);
}

export async function getPool(address: string): Promise<PoolResponse> {
  return meteoraGet<PoolResponse>(`/pools/${address}`, POOL_TTL_MS);
}

export async function getPoolOhlcv(
  address: string,
  params?: { resolution?: string; from?: number; to?: number },
): Promise<OhlcvResponse> {
  const q = new URLSearchParams();
  if (params?.resolution) q.set("resolution", params.resolution);
  if (params?.from != null) q.set("from", String(params.from));
  if (params?.to != null) q.set("to", String(params.to));
  const qs = q.toString();
  return meteoraGet<OhlcvResponse>(
    `/pools/${address}/ohlcv${qs ? `?${qs}` : ""}`,
    CHART_TTL_MS,
  );
}

export async function getPoolVolumeHistory(
  address: string,
): Promise<VolumeHistoryResponse> {
  return meteoraGet<VolumeHistoryResponse>(
    `/pools/${address}/volume/history`,
    CHART_TTL_MS,
  );
}

export async function getProtocolMetrics() {
  return meteoraGet("/stats/protocol_metrics", 60_000);
}

export function positionValueUsd(p: OpenPosition): number {
  const d = p.current_position?.current_deposits;
  if (!d) return 0;
  return (d.amount_x_usd ?? 0) + (d.amount_y_usd ?? 0);
}

export function unclaimedFeesUsd(p: OpenPosition): number {
  const f = p.current_position?.unclaimed_fees;
  if (!f) return 0;
  return (f.amount_x_usd ?? 0) + (f.amount_y_usd ?? 0);
}

export function claimedFeesUsd(p: OpenPosition): number {
  const f = p.total_claimed_fees;
  if (!f) return 0;
  return (f.amount_x_usd ?? 0) + (f.amount_y_usd ?? 0);
}
