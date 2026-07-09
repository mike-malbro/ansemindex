/**
 * ANSEM Index thesis + how-to guide content.
 * Public hub only — no keys. Paper before machinery.
 */

export const WHITEPAPER_VERSION = "1.3";
export const WHITEPAPER_UPDATED_NOTE =
  "This paper will update as we ship. v1.3: ticker $AI · ANSEM Index · $AI creator fees buy ANSEM ($0 until live).";

export const ANSEM_TARGET_PCT = 0.7;
export const BASE_FEE_PCT = 1;
export const NODE_MIN_USD = 1;

export const MISSION =
  "ANSEM Index (ticker $AI) is the list of Meteora DAMM v2 TOKEN–ANSEM pools. $AI creator fees — when live — buy ANSEM toward the 70% gate, then buybacks. Today those fees are $0. Anyone can run a node at their own will. This public hub never holds keys.";

export const PRINCIPLES = [
  "Public hub never holds private keys — Postgres stores pubkeys and pool data only.",
  "The index is the DAMM v2 pool list — not a wallet list.",
  "$AI (ANSEM Index) creator fees buy ANSEM toward 70% — $0 until live.",
  "Map wallets are how we discover pools — they are not the index.",
  "ANSEM nodes invest at their own will — copy the method, not the keys.",
  "Production data is append-only: every fee claim, buy, send, and LP change gets a row.",
  "Rules can shift as data arrives — this paper will update.",
] as const;

export const EXPLAIN_METEORA = {
  title: "What is Meteora?",
  body: "Meteora is a Solana app where people trade tokens and provide liquidity. We use DAMM v2 — a type of pool that holds two tokens, charges a swap fee, and pays that fee to whoever put liquidity in. You can claim fees. You own your position. The public site only reads pool data — it never signs transactions.",
  bullets: [
    "Solana DEX / liquidity protocol",
    "DAMM v2 = constant-product style pools with claimable fees",
    "No keys needed to view pools",
  ],
} as const;

export const EXPLAIN_POOL = {
  title: "How a liquidity pool works",
  body: "A pool is a shared jar of two tokens — for us, usually SOME_TOKEN and ANSEM. Traders swap through the jar. Liquidity providers (LPs) deposit both sides so the jar stays stocked. In return, LPs earn a cut of every swap (the fee).",
  bullets: [
    "Two tokens sit in the pool (dual-sided)",
    "Traders swap; the pool price moves a little",
    "LPs earn fees; they can claim them later",
  ],
} as const;

export const EXPLAIN_FEE_1PCT = {
  title: "1% fees and compounding",
  body: `TOKEN–ANSEM pools default to a ${BASE_FEE_PCT}% base fee on swaps. That fee goes to LPs. Separately, $AI (ANSEM Index) creator fees — when live — buy ANSEM. Today those creator fees are $0. We do not burn fees.`,
  bullets: [
    `${BASE_FEE_PCT}% of swap volume can accrue to LPs`,
    "$AI creator fees buy ANSEM (not the other way around)",
    "Creator fees are $0 until the $AI fee path is live",
  ],
} as const;

export const EXPLAIN_INDEX = {
  title: "The index = the pool list",
  body: "The ANSEM Index is the set of open Meteora DAMM v2 TOKEN–ANSEM pools. We discover them by reading map wallets (pubkeys only) and storing the pool book in Postgres. The homepage and Index page show pools, amounts, and share weights — not a list of people as the index itself.",
  bullets: [
    "Primary object: TOKEN–ANSEM DAMM v2 pools",
    "Map wallets auto-ingest open positions into the book",
    "Click a pool to drill down (holders, detail)",
  ],
} as const;

export const EXPLAIN_PRO_RATA = {
  title: "Proportional shares",
  body: "Each pool’s weight is its share of total index LP value: share_pct = pool_value / sum(pool_values). Share % weights the pool book. When $AI creator fees buy ANSEM, the 70% gate uses index ANSEM share — fees are $0 until live.",
  bullets: [
    "Weight = pool amount ÷ total index amount",
    "Shown as Share % and the Index weights pie",
    "$AI creator fees buy ANSEM toward the gate",
  ],
} as const;

export const EXPLAIN_NODES = {
  title: "ANSEM nodes (optional)",
  body: "Anyone can run an ANSEM node and invest at their own will — seed pools, claim fees, follow the flywheel. The hub never holds your keys. Copy the method, not someone else’s wallet.",
  bullets: [
    "Optional — not required to view the index",
    "Keys stay on your machine or private keeper",
    "Pubkeys + reports only on the public hub",
  ],
} as const;

export const EXPLAIN_LAUNCHPAD = {
  title: "Launchpad (ANSEM-based)",
  body: "Like Perpad’s launch → Meteora → fee flywheel, but ANSEM-quoted: mint a memecoin into a TOKEN–ANSEM DAMM v2 pool so it joins the index. More launches → more tokens in the basket. Live minting comes next; tonight is the product story and security boundary.",
  bullets: [
    "Launch feeds new pools into the index",
    "ANSEM pair — not a SOL-perp treasury copy",
    "No private keys on the public hub",
  ],
} as const;

export const EXPLAIN_DATA = {
  title: "Production databasing & collaboration",
  body: "Tonight’s hub has a minimum viable fee ledger — pool snapshots, index ANSEM %, keeper ticks, fee events, creator sends. That is not production. Production means an append-only event spine: every on-chain claim, swap, send, LP deposit/withdraw, and gate flip is a row with a tx signature (or an explicit dry/error status). Postgres is the system of record for dashboards; RPC is for enrichment and backfill. Keys never enter the DB or the public repo.",
  bullets: [
    "Append-only money events — corrections are new rows, not silent edits",
    "Layers: chain txs → LP/fee events → 70% gate → launchpad/nodes → dash rollups",
    "Hub reads/writes the public ledger; private keeper signs and POSTs ticks",
    "GitHub: PRs for schema, Issues for fee-rule decisions, no keys in git",
  ],
} as const;

export const DATA_LAYERS = [
  {
    id: "now",
    label: "Now (v0)",
    body: "pools, pool_snapshots, index_snapshots, keeper_ticks, fee_events, creator_fee_sends. Enough for Index / Creator / dry ticks — not full tx coverage.",
  },
  {
    id: "spine",
    label: "Event spine",
    body: "chain_transactions + event_tx_links + wallet_balance_snapshots. Answer “every signature” without scraping Solscan by hand.",
  },
  {
    id: "lp",
    label: "LP & shares",
    body: "lp_events (deposit/withdraw/claim) and share % history so composition charts are rebuildable.",
  },
  {
    id: "gate",
    label: "70% gate",
    body: "gate_transitions + treasury_positions on the creator fee wallet. Accrual → claim → buy → send → flip to buybacks.",
  },
  {
    id: "products",
    label: "Launchpad & nodes",
    body: "launches, node_registry, node_reports — pubkeys and public reports only.",
  },
  {
    id: "dash",
    label: "Dashboards",
    body: "Materialized daily/hourly rollups. UI reads the ledger, not ad-hoc RPC on every paint.",
  },
] as const;

export const COLLAB_RULES = [
  {
    title: "Public hub repo",
    body: "mike-malbro/ansemindex — migrations, DATA.md, SECURITY.md, UI. Collaborators welcome. No signing keys in env committed to git.",
  },
  {
    title: "Private keeper",
    body: "Signing material lives only in keeper secrets (Railway/Fly). Keeper POSTs tick summaries to the hub persist API — prefer that over broad DB credentials on the keeper.",
  },
  {
    title: "PRs & migrations",
    body: "Schema changes ship as numbered migrations/*.sql in a PR. Never edit an already-applied migration — add the next file. Review: no keys, assertNoSecrets on new POSTs, IF NOT EXISTS.",
  },
  {
    title: "Decisions",
    body: "Fee-rule and table-shape decisions go in GitHub Issues (labels: data, fee-path, dashboard, security) so the whitepaper and DATA.md can cite them. Chat is fine; the ledger of decisions is Issues.",
  },
] as const;

export const THESIS = {
  why: {
    title: "Why we’re doing this",
    body: "ANSEM anchors Solana memecoin liquidity. The index is a public map of TOKEN–ANSEM markets. Creator fees buy the basket by share. Nodes and launchpad grow participation without custody on the hub.",
  },
  damm: {
    title: "Why DAMM v2",
    body: EXPLAIN_METEORA.body,
  },
  onePct: {
    title: "Why 1%",
    body: EXPLAIN_FEE_1PCT.body,
  },
  adapt: {
    title: "This paper will update",
    body: "Pools and fees are the dataset. Launchpad and nodes come next. Custody stays hard: keys never live on the public hub or in Postgres.",
  },
} as const;

export const FEE_CHART = {
  title: "Fee chart — $AI creator fees buy ANSEM",
  targetPct: ANSEM_TARGET_PCT,
  phases: [
    {
      id: "build",
      label: "Build to 70%",
      rule: "$AI creator fees (when live) → buy ANSEM → seed while ANSEM is under 70% of the program stack. Fees are $0 today.",
    },
    {
      id: "buybacks",
      label: "At ≥ 70% ANSEM",
      rule: "Same fees → 100% buybacks. No more mixed send/seed from this leg.",
    },
  ],
  steps: [
    {
      n: 1,
      title: "Collect $AI creator fees",
      body: "$AI (ANSEM Index) creator fees accrue when live — $0 today. LP fees on your node are separate. Claim on your node — not on this hub.",
    },
    {
      n: 2,
      title: "Buy ANSEM",
      body: "Spend $AI creator fees to buy ANSEM toward the 70% gate (not “buy the index basket with ANSEM fees”).",
    },
    {
      n: 3,
      title: "Send while under 70%",
      body: "Send / seed dual-sided pools until ANSEM reaches 70%.",
    },
    {
      n: 4,
      title: "Then all buybacks",
      body: "Once ANSEM ≥ 70%, fee flow flips to all buybacks.",
    },
    {
      n: 5,
      title: "Floor then winners",
      body: `Seed about $${NODE_MIN_USD} dual-sided per start-list node first; then add more to winners.`,
    },
  ],
} as const;

export const HOW_TO_SHORT = [
  {
    n: 1,
    title: "Read this paper",
    body: "Index = pools. Shares. Fees buy the basket. Nodes optional.",
  },
  {
    n: 2,
    title: "Use pubkeys only here",
    body: "Map wallets and node pubkeys only. Never paste private keys into this hub.",
  },
  {
    n: 3,
    title: "Seed dual-sided pools",
    body: `On app.meteora.ag, add ~$${NODE_MIN_USD} both sides per start-list node.`,
  },
  {
    n: 4,
    title: "Run your own node",
    body: "Invest at your own will. Dry-run first. Keys stay private.",
  },
] as const;

export const HOW_TO_GUIDE = [
  {
    id: "read-paper",
    n: 1,
    title: "Read whitepaper",
    body: "Pool index, $AI fees → ANSEM, launchpad, data.",
    href: "/whitepaper",
    cta: "Whitepaper",
  },
  {
    id: "fee-chart",
    n: 2,
    title: "Learn the fee chart",
    body: "$AI creator fees → buy ANSEM → 70% gate → buybacks ($0 until live).",
    href: "/whitepaper#flywheel",
    cta: "Fee chart",
  },
  {
    id: "open-index",
    n: 3,
    title: "Open the index",
    body: "Pools, Share %, Creator fees, Wallet lookup.",
    href: "/book",
    cta: "Index",
  },
  {
    id: "faq",
    n: 4,
    title: "FAQ",
    body: "Ticker $AI, fees $0 until live, no keys.",
    href: "/faq",
    cta: "FAQ",
  },
] as const;

export const ROADMAP_PHASES = [
  {
    id: "manual",
    phase: 1,
    title: "Manual",
    status: "now" as const,
    outcome: "You steer; the bot follows the book.",
    detail:
      "Live TOKEN–ANSEM index, map-wallet ingest, fee ledger. Keeper mirrors holdings — clear manual control while we learn the loop.",
    ships: ["Pool book + Share %", "Index · Creator · Wallet", "Dry/live tick path"],
    depends: "Postgres + Meteora reads",
  },
  {
    id: "flywheel",
    phase: 2,
    title: "Flywheel",
    status: "next" as const,
    outcome: "$AI creator fees buy ANSEM to 70%, then buybacks.",
    detail:
      "Fees are $0 until live. Then: claim → buy ANSEM → gate → buybacks. Still under manual / holdings control.",
    ships: ["Live keeper", "Creator sends + sigs", "70% gate flip"],
    depends: "ANSEM_DEST_WALLET + fee ledger",
  },
  {
    id: "ml",
    phase: 3,
    title: "ML watch",
    status: "planned" as const,
    outcome: "Load an ML algorithm (see-microtrader) to monitor the DEX.",
    detail:
      "Watch for new entries with fees. Surface candidates into the same process — index, fee path, ledger — so the loop continues without losing manual override.",
    ships: ["DEX fee-entry monitor", "Candidate → index pipeline", "Ops review before size"],
    depends: "Stable manual flywheel + fee history",
  },
  {
    id: "continue",
    phase: 4,
    title: "Continue",
    status: "planned" as const,
    outcome: "Launchpad, nodes, process keeps compounding.",
    detail:
      "Mint into TOKEN–ANSEM. Nodes optional. Manual + ML feed the same flywheel — the process continues.",
    ships: ["Launchpad", "Node registry", "Adaptive sizing from ledger"],
    depends: "ML watch live + flywheel proven",
  },
] as const;

export const WHITEPAPER_NAV = [
  { id: "cover", label: "Cover" },
  { id: "index", label: "Index" },
  { id: "shares", label: "Shares" },
  { id: "meteora", label: "Meteora" },
  { id: "pool", label: "Pools" },
  { id: "flywheel", label: "Fee chart" },
  { id: "data", label: "Data" },
  { id: "launchpad", label: "Launchpad" },
  { id: "nodes", label: "Nodes" },
  { id: "howto", label: "How-to" },
  { id: "roadmap", label: "Roadmap" },
] as const;
