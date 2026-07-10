/**
 * Discover LP wallets in DAMM v2 pools via on-chain position accounts.
 * Meteora datapi has no pool→wallets endpoint — we read position PDAs + NFT owners.
 */
import { cacheGet, cacheSet } from "./cache";

const CP_AMM_PROGRAM_ID = "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG";

const RPC_CANDIDATES = [
  process.env.SOLANA_RPC_URL,
  "https://solana.drpc.org",
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

const B58 =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function b58encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;

  const digits = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i]!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j]! << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) {
    out += B58[digits[i]!];
  }
  return out;
}

type RpcEnvelope<T> = { result?: T; error?: { message?: string } };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpcOnce<T>(
  endpoint: string,
  method: string,
  params: unknown[],
  timeoutMs = 25_000,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 429) throw new Error("RPC HTTP 429");
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const text = await res.text();
  if (text.startsWith("<") || text.startsWith("<!")) {
    throw new Error("RPC HTML response");
  }
  let json: RpcEnvelope<T>;
  try {
    json = JSON.parse(text) as RpcEnvelope<T>;
  } catch {
    throw new Error("RPC invalid JSON");
  }
  if (json.error) {
    const msg = json.error.message || "RPC error";
    if (/too many requests|429|rate/i.test(msg)) {
      throw new Error(`RPC 429: ${msg}`);
    }
    throw new Error(msg);
  }
  if (json.result === undefined) throw new Error("RPC empty result");
  return json.result;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const endpoint of RPC_CANDIDATES) {
      try {
        return await rpcOnce<T>(endpoint, method, params);
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (/429/.test(lastErr.message)) {
          await sleep(250 * (attempt + 1) ** 2);
        }
      }
    }
  }
  throw lastErr ?? new Error("All Solana RPCs failed");
}

/** Position account: disc(8) + pool(32) + nftMint(32) … */
function nftMintFromPositionData(dataBase64: string): string | null {
  try {
    const raw = Buffer.from(dataBase64, "base64");
    if (raw.length < 72) return null;
    return b58encode(raw.subarray(40, 72));
  } catch {
    return null;
  }
}

/** NFT mints for open positions in one pool. */
export async function getPositionNftMintsForPool(
  poolAddress: string,
): Promise<string[]> {
  const cacheKey = `pool-pos-nfts:${poolAddress}`;
  const cached = cacheGet<string[]>(cacheKey);
  if (cached) return cached;

  type AccRow = { account: { data: [string, string] } };
  const rows = await rpc<AccRow[]>("getProgramAccounts", [
    CP_AMM_PROGRAM_ID,
    {
      encoding: "base64",
      filters: [{ memcmp: { offset: 8, bytes: poolAddress } }],
      dataSlice: { offset: 0, length: 72 },
    },
  ]);

  const mints: string[] = [];
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    const mint = nftMintFromPositionData(row.account.data[0] ?? "");
    if (!mint || seen.has(mint)) continue;
    seen.add(mint);
    mints.push(mint);
  }

  cacheSet(cacheKey, mints, 30 * 60_000);
  return mints;
}

type Largest = { address: string; amount: string };
type TokenAccParsed = {
  data?: {
    parsed?: {
      info?: { owner?: string };
    };
  };
} | null;

/** Resolve LP wallet owners for position NFT mints. */
export async function resolvePositionNftOwners(
  nftMints: string[],
): Promise<string[]> {
  const unique = [...new Set(nftMints.filter(Boolean))];
  if (unique.length === 0) return [];

  const owners = new Set<string>();
  const tokenAccounts: string[] = [];

  const concurrency = 6;
  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (mint) => {
        try {
          const res = await rpc<{ value: Largest[] }>(
            "getTokenLargestAccounts",
            [mint],
          );
          const top = (res.value ?? []).find((a) => a.amount !== "0");
          return top?.address ?? null;
        } catch {
          return null;
        }
      }),
    );
    for (const addr of results) {
      if (addr) tokenAccounts.push(addr);
    }
  }

  const chunk = 40;
  for (let i = 0; i < tokenAccounts.length; i += chunk) {
    const batch = tokenAccounts.slice(i, i + chunk);
    try {
      const multi = await rpc<{ value: TokenAccParsed[] }>(
        "getMultipleAccounts",
        [batch, { encoding: "jsonParsed" }],
      );
      for (const acc of multi.value ?? []) {
        const owner = acc?.data?.parsed?.info?.owner;
        if (owner) owners.add(owner);
      }
    } catch (e) {
      console.warn(
        "[pool-lps] getMultipleAccounts",
        e instanceof Error ? e.message : e,
      );
    }
  }

  return [...owners];
}

export type DiscoverLpOpts = {
  concurrency?: number;
  /** Cap pools scanned this pass. */
  maxPools?: number;
  /** Soft deadline — return whatever owners we have so far. */
  deadlineMs?: number;
  /**
   * When true (default), rotate through the pool list across refreshes so
   * public RPC rate limits don’t strand discovery on the same top-N forever.
   */
  rolling?: boolean;
  /** Called as each pool’s owners are resolved (for incremental DB writes). */
  onOwners?: (owners: string[], pool: string) => void | Promise<void>;
};

/** In-process cursor so each refresh continues where the last left off. */
let discoverCursor = 0;

/**
 * Discover LP wallets across Index pools.
 * Uses a rolling window — each call advances the cursor so repeated refreshes
 * cover the full book even when public RPC only allows ~15 pools/pass.
 */
export async function discoverLpWalletsForPools(
  poolAddresses: string[],
  opts?: DiscoverLpOpts,
): Promise<string[]> {
  const pools = [...new Set(poolAddresses.filter(Boolean))];
  if (pools.length === 0) return [];

  const maxPools = opts?.maxPools ?? 20;
  const deadlineMs = opts?.deadlineMs ?? 150_000;
  const rolling = opts?.rolling !== false;
  const started = Date.now();

  let limited: string[];
  if (rolling) {
    const start = discoverCursor % pools.length;
    limited = [];
    for (let i = 0; i < Math.min(maxPools, pools.length); i++) {
      limited.push(pools[(start + i) % pools.length]!);
    }
  } else {
    limited = pools.slice(0, maxPools);
  }

  const concurrency = opts?.concurrency ?? 3;
  const owners = new Set<string>();
  let scanned = 0;

  for (let i = 0; i < limited.length; i += concurrency) {
    if (Date.now() - started > deadlineMs) {
      console.warn(
        `[pool-lps] deadline after ${scanned}/${limited.length} pools · ${owners.size} owners`,
      );
      break;
    }

    const batch = limited.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (pool) => {
        try {
          const mints = await getPositionNftMintsForPool(pool);
          const poolOwners = await resolvePositionNftOwners(mints);
          for (const o of poolOwners) owners.add(o);
          if (opts?.onOwners && poolOwners.length > 0) {
            await opts.onOwners(poolOwners, pool);
          }
        } catch (e) {
          console.warn(
            "[pool-lps] positions",
            pool.slice(0, 8),
            e instanceof Error ? e.message : e,
          );
        }
      }),
    );
    scanned += batch.length;
  }

  if (rolling) {
    discoverCursor = (discoverCursor + scanned) % Math.max(pools.length, 1);
  }

  const list = [...owners];
  console.info(
    `[pool-lps] discovered ${list.length} LP wallets · scanned ${scanned}/${pools.length} · cursor=${discoverCursor} · ${Date.now() - started}ms`,
  );
  return list;
}
