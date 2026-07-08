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

export const DEXSCREENER_BASE =
  process.env.DEXSCREENER_BASE ?? "https://api.dexscreener.com";

export const INDEX_NAME = "ANSEM INDEX";
export const INDEX_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_INDEX_TOKEN_SYMBOL ?? "ANSEM";
export const INDEX_TOKEN_MINT =
  process.env.NEXT_PUBLIC_INDEX_TOKEN_MINT ??
  process.env.INDEX_TOKEN_MINT ??
  "";
