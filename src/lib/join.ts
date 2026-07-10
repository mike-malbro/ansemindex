/** Join / nodes product copy — hub pages + node package. */
import {
  INDEX_TICKER,
  INDEX_NAME,
  INDEX_POOL_PAIR,
  INDEX_POOL_LIVE,
  INDEX_POOL_METEORA_URL,
  INDEX_TOKEN_MINT,
  INDEX_POOL_ADDRESS,
} from "./config";

/** Mike's influence leader LP (map(0)). Not custody for other nodes. */
export const INFLUENCE_LEADER = {
  label: "Mike",
  lp: "HpJbzERP44V21mKGRDDUArb9JJaL9NdPSgXzZ9uyieVB",
  cellId: "ansem-index",
  role: "influence",
} as const;

export const NODE_REPO_HINT =
  process.env.NEXT_PUBLIC_NODE_REPO_URL ??
  "https://github.com/mike-malbro/ansem-node";

export const HUB_PUBLIC_API =
  process.env.NEXT_PUBLIC_HUB_URL != null
    ? `${process.env.NEXT_PUBLIC_HUB_URL.replace(/\/$/, "")}/api/public`
    : "https://hub-production-7867.up.railway.app/api/public";

/** The key market: $ANSEMLP–ANSEM — index token paired with ANSEM. */
export const INDEX_OWN_POOL = {
  pair: INDEX_POOL_PAIR,
  mint: INDEX_TOKEN_MINT,
  pool: INDEX_POOL_ADDRESS,
  live: INDEX_POOL_LIVE,
  meteoraUrl: INDEX_POOL_METEORA_URL,
  note: INDEX_POOL_LIVE
    ? `${INDEX_POOL_PAIR} is live on Meteora — buy ${INDEX_TICKER}, LP the pair, creator fees fund buybacks and growth.`
    : `${INDEX_POOL_PAIR} is the index’s own pool (coming). When live: buy ${INDEX_TICKER} there; creator fees buy ANSEM and grow Index pools.`,
} as const;

export const JOIN_STEPS = [
  {
    n: 1,
    title: `Buy ${INDEX_TICKER} on ${INDEX_POOL_PAIR}`,
    body: INDEX_POOL_LIVE
      ? `The index market is ${INDEX_POOL_PAIR}. Buy ${INDEX_TICKER} (and optionally LP) on Meteora. Creator fees fund buybacks and growth.`
      : `Key market: ${INDEX_POOL_PAIR} DAMM v2. When live, buy ${INDEX_TICKER} there. Creator fees run through the index — buybacks and growth. Fees $0 until live.`,
  },
  {
    n: 2,
    title: "Deposit into Index pools",
    body: `LP any TOKEN–ANSEM pool on the Index list — including ${INDEX_POOL_PAIR} when live. Your wallet, your size. Independent of Mike’s influence node.`,
  },
  {
    n: 3,
    title: "Pull the index",
    body: `Public API (CORS open, no auth): GET /api/public or GET /api/public?format=csv. Nodes use pnpm index.`,
  },
  {
    n: 4,
    title: "Run a node",
    body: "Local: doctor → dry → start. Server / Railway: deploy the ansem-node package. Keys stay in that process only.",
  },
] as const;

export const JOIN_SECURITY = [
  "Public hub never holds private keys — pubkeys and pool data only.",
  "Postgres never stores seeds, mnemonics, or *_PRIVATE_KEY.",
  "APIs reject secret fields (assertNoSecrets).",
  "Mike’s node is influence — reference sizing, not shared custody.",
  "Your node signs only with keys you place in cell_secrets / Railway secrets.",
] as const;

export const EXPLAIN_JOIN = {
  title: `Join ${INDEX_NAME}`,
  body: `${INDEX_TICKER} is the index token. Its home market is ${INDEX_POOL_PAIR}. Buy and LP there when live so creator fees fund buybacks and pool growth. Deposit into other Index pools on your own. Run a node if you want automated fee ticks — optional.`,
} as const;
