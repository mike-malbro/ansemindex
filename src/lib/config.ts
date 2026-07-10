/** Defaults are safe for client + server. Server routes may override via env. */
export const ANSEM_MINT =
  process.env.NEXT_PUBLIC_ANSEM_MINT ??
  process.env.ANSEM_MINT ??
  "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

/** Map wallets = pubkeys we auto-read to discover open TOKEN–ANSEM pools. */
const walletsRaw =
  process.env.NEXT_PUBLIC_TRACKED_WALLETS ??
  process.env.TRACKED_WALLETS ??
  [
    "HpJbzERP44V21mKGRDDUArb9JJaL9NdPSgXzZ9uyieVB",
    "C6mTXJ3rxCSpZxGZPVgaV3PqgVoXpZ8zhk8yXz3hbkSY",
  ].join(",");

export const TRACKED_WALLETS = walletsRaw
  .split(",")
  .map((w) => w.trim())
  .filter(Boolean);

export const PRIMARY_WALLET = TRACKED_WALLETS[0]!;

/** Human labels for map wallets (index by sort order). */
const labelsRaw =
  process.env.NEXT_PUBLIC_MAP_WALLET_LABELS ??
  process.env.MAP_WALLET_LABELS ??
  "map(0),map(1)·Joe";

export const MAP_WALLET_LABELS = labelsRaw.split(",").map((s) => s.trim());

export function mapWalletLabel(index: number, address?: string): string {
  return MAP_WALLET_LABELS[index] ?? `map(${index})`;
}

export const REFRESH_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS ??
    process.env.REFRESH_INTERVAL_MS ??
    30_000,
);

export const METEORA_DAMM_V2_BASE =
  process.env.METEORA_DAMM_V2_BASE ?? "https://damm-v2.datapi.meteora.ag";

/**
 * Index pools are set up as DAMM v2 compounding fee mode:
 * 90% auto-compounds into LP, 10% claimable in quote (ANSEM).
 * Meteora only reports the claimable slice — we back out generated/compounded.
 */
export const COMPOUNDING_FEE_BPS = Number(
  process.env.NEXT_PUBLIC_COMPOUNDING_FEE_BPS ??
    process.env.COMPOUNDING_FEE_BPS ??
    9000,
);
export const CLAIM_FEE_BPS = 10_000 - COMPOUNDING_FEE_BPS;

export const DEXSCREENER_BASE =
  process.env.DEXSCREENER_BASE ?? "https://api.dexscreener.com";

/** Product name (words). Ticker is $ANSEMLP — not the ANSEM pool quote mint. */
export const INDEX_NAME = "ANSEM LP INDEX";
export const INDEX_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_INDEX_TOKEN_SYMBOL ?? "ANSEMLP";
/** Display ticker with $. */
export const INDEX_TICKER = `$${INDEX_TOKEN_SYMBOL}`;
export const INDEX_TOKEN_MINT =
  process.env.NEXT_PUBLIC_INDEX_TOKEN_MINT ??
  process.env.INDEX_TOKEN_MINT ??
  "";

/**
 * The index’s own market: $ANSEMLP–ANSEM DAMM v2 pool.
 * Set when the pair is live — then DexScreener, join, and public API point here.
 */
export const INDEX_POOL_ADDRESS =
  process.env.NEXT_PUBLIC_INDEX_POOL_ADDRESS ??
  process.env.INDEX_POOL_ADDRESS ??
  "";

/** True once mint + pool are configured (token live). */
export const INDEX_POOL_LIVE = Boolean(
  INDEX_TOKEN_MINT && INDEX_POOL_ADDRESS,
);

export const INDEX_POOL_PAIR = `${INDEX_TOKEN_SYMBOL}–ANSEM`;

export const INDEX_POOL_METEORA_URL = INDEX_POOL_ADDRESS
  ? `https://app.meteora.ag/pools/${INDEX_POOL_ADDRESS}`
  : "";

/**
 * DexScreener for $ANSEMLP — prefer the ANSEMLP–ANSEM pool when live.
 * Override with NEXT_PUBLIC_DEXSCREENER_URL.
 */
export const DEXSCREENER_INDEX_URL =
  process.env.NEXT_PUBLIC_DEXSCREENER_URL ??
  (INDEX_POOL_ADDRESS
    ? `https://dexscreener.com/solana/${INDEX_POOL_ADDRESS}`
    : INDEX_TOKEN_MINT
      ? `https://dexscreener.com/solana/${INDEX_TOKEN_MINT}`
      : "https://dexscreener.com/solana/9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump");
