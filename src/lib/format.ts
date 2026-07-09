export function fmtMoney(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  const sign = x < 0 ? "-" : "";
  const a = Math.abs(x);
  if (a >= 1_000_000_000) return `${sign}$${(a / 1_000_000_000).toFixed(2)}B`;
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(2)}K`;
  if (a >= 1) return `${sign}$${a.toFixed(2)}`;
  if (a >= 0.0001) return `${sign}$${a.toFixed(4)}`;
  return `${sign}$${a.toExponential(2)}`;
}

export function fmtPct(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  return `${x >= 0 ? "+" : ""}${x.toFixed(2)}%`;
}

export function fmtAmount(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  const sign = x < 0 ? "-" : "";
  const a = Math.abs(x);
  if (a >= 1_000_000_000) return `${sign}${(a / 1_000_000_000).toFixed(2)}B`;
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}${(a / 1_000).toFixed(2)}K`;
  if (a >= 1) return `${sign}${a.toFixed(2)}`;
  return `${sign}${a.toFixed(4)}`;
}

export function shortCa(x: string, left = 4, right = 4): string {
  if (!x) return "";
  if (x.length <= left + right + 3) return x;
  return `${x.slice(0, left)}…${x.slice(-right)}`;
}

export function solscanToken(ca: string) {
  return `https://solscan.io/token/${ca}`;
}

export function solscanAccount(ca: string) {
  return `https://solscan.io/account/${ca}`;
}

export function meteoraPoolUrl(pool: string) {
  return `https://app.meteora.ag/pools/${pool}`;
}

export function dexTokenUrl(ca: string) {
  return `https://dexscreener.com/solana/${ca}`;
}

export function pnlClass(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x) || x === 0) return "text-zinc-400";
  return x > 0 ? "text-emerald-400" : "text-rose-400";
}

/** Soft green/red for the Index % tree — low-key, not neon. */
export function changeTone(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "text-zinc-600";
  if (x === 0) return "text-zinc-500";
  if (x > 0) return "text-emerald-500/80";
  return "text-rose-400/75";
}

export function fmtPctShort(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "·";
  const a = Math.abs(x);
  const n = a >= 100 ? a.toFixed(0) : a >= 10 ? a.toFixed(1) : a.toFixed(2);
  return `${x >= 0 ? "+" : "-"}${n}%`;
}
