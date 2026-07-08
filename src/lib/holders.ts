import { cacheGet, cacheSet } from "./cache";

const RPC_CANDIDATES = [
  process.env.SOLANA_RPC_URL,
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
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
        tokenAmount?: { uiAmount?: number; amount?: string };
      };
    };
  };
} | null;

async function rpcOnce<T>(
  endpoint: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
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
 * Rank largest holders of a mint (token accounts → owners).
 * Not LP positions — Meteora datapi has no pool-LP list.
 * Label in UI as "Top token holders".
 */
export async function rankTokenHolders(
  mint: string,
  opts?: { controllerWallets?: string[]; limit?: number },
): Promise<RankedHolder[]> {
  const limit = opts?.limit ?? 20;
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

  const multi = await rpc<{ value: ParsedAccount[] }>("getMultipleAccounts", [
    accounts.map((a) => a.address),
    { encoding: "jsonParsed" },
  ]);
  const infos = multi.value ?? [];

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
