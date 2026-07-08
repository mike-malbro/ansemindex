import { cacheGet, cacheSet } from "./cache";

const RPC_CANDIDATES = [
  process.env.SOLANA_RPC_URL,
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

export type RankedHolder = {
  rank: number;
  owner: string;
  tokenAccount: string;
  amount: number;
  amountUi: number;
  pctOfTop: number;
  isController: boolean;
};

type RpcEnvelope<T> = { result?: T; error?: { message?: string } };

type LargestAccount = {
  address: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
};

type ParsedAccount = {
  data?: {
    parsed?: {
      info?: {
        owner?: string;
      };
    };
  };
} | null;

async function rpcOnce<T>(
  endpoint: string,
  method: string,
  params: unknown[],
  timeoutMs = 8_000,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as RpcEnvelope<T>;
  if (json.error) throw new Error(json.error.message || "RPC error");
  if (json.result === undefined) throw new Error("RPC empty result");
  return json.result;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastErr: Error | null = null;
  for (const endpoint of RPC_CANDIDATES) {
    try {
      return await rpcOnce<T>(endpoint, method, params);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("All Solana RPCs failed");
}

/**
 * Rank largest holders of a mint (token accounts → owners when available).
 * Not LP positions — Meteora datapi has no pool-LP list.
 */
export async function rankTokenHolders(
  mint: string,
  opts?: { controllerWallets?: string[]; limit?: number },
): Promise<RankedHolder[]> {
  const limit = opts?.limit ?? 15;
  const controllers = new Set(
    (opts?.controllerWallets ?? []).map((w) => w.toLowerCase()),
  );
  const cacheKey = `holders:${mint}:${limit}`;
  const cached = cacheGet<RankedHolder[]>(cacheKey);
  if (cached) return cached;

  const largest = await rpc<{ value: LargestAccount[] }>(
    "getTokenLargestAccounts",
    [mint],
  );
  const accounts = (largest.value ?? []).slice(0, limit);
  if (accounts.length === 0) return [];

  let infos: ParsedAccount[] = [];
  try {
    const multi = await rpc<{ value: ParsedAccount[] }>("getMultipleAccounts", [
      accounts.map((a) => a.address),
      { encoding: "jsonParsed" },
    ]);
    infos = multi.value ?? [];
  } catch {
    // Owner resolution is best-effort; still rank by token-account size.
    infos = [];
  }

  const topSum = accounts.reduce((s, a) => {
    const ui = a.uiAmount ?? Number(a.amount) / 10 ** a.decimals;
    return s + ui;
  }, 0);

  const rows: RankedHolder[] = accounts.map((a, i) => {
    const owner = infos[i]?.data?.parsed?.info?.owner ?? a.address;
    const amountUi = a.uiAmount ?? Number(a.amount) / 10 ** a.decimals;
    return {
      rank: i + 1,
      owner,
      tokenAccount: a.address,
      amount: Number(a.amount),
      amountUi,
      pctOfTop: topSum > 0 ? (amountUi / topSum) * 100 : 0,
      isController: controllers.has(owner.toLowerCase()),
    };
  });

  cacheSet(cacheKey, rows, 5 * 60_000);
  return rows;
}

export type WalletTokenBalance = {
  mint: string;
  amountUi: number;
  amount: number;
  decimals: number;
};

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

/**
 * Token balances for a wallet, filtered to an optional mint set (index tokens).
 */
export async function getWalletTokenBalances(
  owner: string,
  opts?: { mints?: string[] },
): Promise<WalletTokenBalance[]> {
  const mintSet = opts?.mints?.length
    ? new Set(opts.mints.map((m) => m.toLowerCase()))
    : null;
  const cacheKey = `wallet-bal:${owner}:${mintSet ? [...mintSet].sort().join(",").slice(0, 80) : "all"}`;
  const cached = cacheGet<WalletTokenBalance[]>(cacheKey);
  if (cached) return cached;

  type TokenAcc = {
    pubkey: string;
    account: {
      data: {
        parsed?: {
          info?: {
            mint?: string;
            tokenAmount?: {
              uiAmount?: number | null;
              amount?: string;
              decimals?: number;
            };
          };
        };
      };
    };
  };

  async function fetchProgram(programId: string): Promise<TokenAcc[]> {
    const res = await rpc<{ value: TokenAcc[] }>("getTokenAccountsByOwner", [
      owner,
      { programId },
      { encoding: "jsonParsed" },
    ]);
    return res.value ?? [];
  }

  let accounts: TokenAcc[] = [];
  try {
    accounts = await fetchProgram(TOKEN_PROGRAM);
  } catch {
    accounts = [];
  }
  try {
    const t22 = await fetchProgram(TOKEN_2022_PROGRAM);
    accounts = accounts.concat(t22);
  } catch {
    /* optional */
  }

  const byMint = new Map<string, WalletTokenBalance>();
  for (const acc of accounts) {
    const info = acc.account?.data?.parsed?.info;
    const mint = info?.mint;
    if (!mint) continue;
    if (mintSet && !mintSet.has(mint.toLowerCase())) continue;
    const ta = info.tokenAmount;
    const amountUi = ta?.uiAmount ?? 0;
    if (!amountUi || amountUi <= 0) continue;
    const prev = byMint.get(mint);
    if (prev) {
      prev.amountUi += amountUi;
      prev.amount += Number(ta?.amount ?? 0);
    } else {
      byMint.set(mint, {
        mint,
        amountUi,
        amount: Number(ta?.amount ?? 0),
        decimals: ta?.decimals ?? 0,
      });
    }
  }

  const rows = [...byMint.values()].sort((a, b) => b.amountUi - a.amountUi);
  cacheSet(cacheKey, rows, 2 * 60_000);
  return rows;
}
