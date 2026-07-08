import { ANSEM_MINT, DEXSCREENER_BASE } from "./config";
import { cacheGet, cacheSet } from "./cache";
import type { EnrichedPosition, OpenPosition, TokenInfo } from "./types";
import { positionValueUsd, unclaimedFeesUsd } from "./meteora";

type DexPair = {
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  info?: { imageUrl?: string };
};

type Enrichment = {
  image_url?: string;
  market_cap?: number;
  price_usd?: number;
  volume_24h?: number;
  price_change_5m?: number;
  price_change_1h?: number;
  price_change_6h?: number;
  price_change_24h?: number;
};

function chunks<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

async function fetchDexBatch(cas: string[]): Promise<Map<string, Enrichment>> {
  const map = new Map<string, Enrichment>();
  if (cas.length === 0) return map;

  const cacheKey = `dex:${cas.slice().sort().join(",")}`;
  const cached = cacheGet<Map<string, Enrichment>>(cacheKey);
  if (cached) return cached;

  for (const batch of chunks(cas, 30)) {
    const url = `${DEXSCREENER_BASE}/tokens/v1/solana/${batch.join(",")}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "ansem-index/1.0" },
      });
      if (!res.ok) continue;
      const payload = await res.json();
      const pairs: DexPair[] = Array.isArray(payload)
        ? payload
        : (payload?.pairs ?? []);

      for (const pair of pairs) {
        if (!pair || typeof pair !== "object") continue;
        const liq = pair.liquidity?.usd ?? -1;
        for (const token of [pair.baseToken, pair.quoteToken]) {
          const ca = token?.address;
          if (!ca || !batch.includes(ca)) continue;
          const prev = map.get(ca);
          const prevLiq = (prev as Enrichment & { _liq?: number })?._liq ?? -1;
          if (prev && prevLiq >= liq) continue;

          map.set(ca, {
            image_url: pair.info?.imageUrl,
            market_cap: pair.marketCap ?? pair.fdv,
            price_usd: pair.priceUsd ? Number(pair.priceUsd) : undefined,
            volume_24h: pair.volume?.h24,
            price_change_5m: pair.priceChange?.m5,
            price_change_1h: pair.priceChange?.h1,
            price_change_6h: pair.priceChange?.h6,
            price_change_24h: pair.priceChange?.h24,
            _liq: liq,
          } as Enrichment & { _liq: number });
        }
      }
    } catch {
      // enrichment is best-effort
    }
  }

  // strip internal _liq before caching
  const clean = new Map<string, Enrichment>();
  for (const [k, v] of map) {
    const { _liq: _, ...rest } = v as Enrichment & { _liq?: number };
    clean.set(k, rest);
  }
  cacheSet(cacheKey, clean, 60_000);
  return clean;
}

function pickConstituent(
  p: OpenPosition,
  ansemMint: string,
): { constituent: TokenInfo; ansem: TokenInfo } {
  if (p.token_y.address === ansemMint) {
    return { constituent: p.token_x, ansem: p.token_y };
  }
  if (p.token_x.address === ansemMint) {
    return { constituent: p.token_y, ansem: p.token_x };
  }
  // fallback: treat non-ANSEM as constituent (prefer token_x)
  return { constituent: p.token_x, ansem: p.token_y };
}

export async function enrichPositions(
  positions: OpenPosition[],
  ansemMint = ANSEM_MINT,
): Promise<EnrichedPosition[]> {
  const cas = [
    ...new Set(
      positions.map((p) => pickConstituent(p, ansemMint).constituent.address),
    ),
  ];
  const dex = await fetchDexBatch(cas);

  return positions.map((p) => {
    const { constituent, ansem } = pickConstituent(p, ansemMint);
    const e = dex.get(constituent.address) ?? {};
    return {
      ...p,
      position_value_usd: positionValueUsd(p),
      unclaimed_fees_usd: unclaimedFeesUsd(p),
      constituent_token: constituent,
      ansem_token: ansem,
      ticker: constituent.symbol || p.pool_name?.split("-")[0] || "?",
      ...e,
    };
  });
}
