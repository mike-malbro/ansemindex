/**
 * ANSEM Index thesis + how-to guide content.
 * Public hub only — no keys. Paper before machinery.
 */

export const WHITEPAPER_VERSION = "1.1";
export const WHITEPAPER_UPDATED_NOTE =
  "This paper will update as we ship. Check the version badge.";

export const ANSEM_TARGET_PCT = 0.7;
export const BASE_FEE_PCT = 1;
export const NODE_MIN_USD = 1;

export const MISSION =
  "The ANSEM Index is the list of Meteora DAMM v2 TOKEN–ANSEM pools. ANSEM creator fees buy those tokens by proportional share. Anyone can run an ANSEM node and invest at their own will. A launchpad will mint new tokens into the index. This public hub never holds keys.";

export const PRINCIPLES = [
  "Public hub never holds private keys — Postgres stores pubkeys and pool data only.",
  "The index is the DAMM v2 pool list — not a wallet list.",
  "ANSEM creator fees buy index tokens by proportional share.",
  "Map wallets are how we discover pools — they are not the index.",
  "ANSEM nodes invest at their own will — copy the method, not the keys.",
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
  body: `TOKEN–ANSEM pools default to a ${BASE_FEE_PCT}% base fee on swaps. That fee goes to LPs. Separately, ANSEM creator fees buy the tokens in the index by share. We do not burn fees.`,
  bullets: [
    `${BASE_FEE_PCT}% of swap volume can accrue to LPs`,
    "ANSEM creator fees buy the index basket",
    "Fee tier can change later if the book needs it",
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
  body: "Each pool’s weight is its share of total index LP value: share_pct = pool_value / sum(pool_values). When ANSEM creator fees buy the index, buys split by those weights so larger pools get a larger slice of the fee flow.",
  bullets: [
    "Weight = pool amount ÷ total index amount",
    "Shown as Share % and the Index weights pie",
    "Fee buys follow the same weights",
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
  title: "Fee chart — ANSEM creator fees buy the index",
  targetPct: ANSEM_TARGET_PCT,
  phases: [
    {
      id: "build",
      label: "Build to 70%",
      rule: "Claim fees → buy index tokens (and ANSEM) by share → seed while ANSEM is under 70% of the program stack.",
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
      title: "Collect creator fees",
      body: "ANSEM creator fees (and LP fees on your node) accrue on-chain. You claim on your node — not on this hub.",
    },
    {
      n: 2,
      title: "Buy by proportional share",
      body: "Spend fees across index tokens weighted by each pool’s share of the index.",
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
    title: "Read whitepaper v1.1",
    body: "Pool index, proportional shares, fee flywheel, launchpad, nodes.",
    href: "/whitepaper",
    cta: "Whitepaper v1.1",
  },
  {
    id: "fee-chart",
    n: 2,
    title: "Learn the fee chart",
    body: "ANSEM creator fees → buy index by share → 70% gate → buybacks.",
    href: "/whitepaper#flywheel",
    cta: "Fee chart",
  },
  {
    id: "open-index",
    n: 3,
    title: "Open the pool index",
    body: "Live DAMM v2 TOKEN–ANSEM pools, share %, pies, holders.",
    href: "/book",
    cta: "Index",
  },
  {
    id: "launchpad",
    n: 4,
    title: "Launchpad (coming)",
    body: "Mint into TOKEN–ANSEM so new coins join the index.",
    href: "/launchpad",
    cta: "Launchpad",
  },
  {
    id: "wallets",
    n: 5,
    title: "Wire your wallets (pubkeys)",
    body: "W1 LP · W2 operator · ANSEM dest. This hub never asks for private keys.",
    href: "/manage",
    cta: "Manage",
  },
  {
    id: "run-node",
    n: 6,
    title: "Run your own ANSEM node",
    body: "Optional. Copy the method. Keys stay private — never on this hub.",
    href: "/roadmap",
    cta: "Roadmap",
  },
] as const;

export const ROADMAP_PHASES = [
  {
    id: "pools",
    phase: 1,
    title: "Pools",
    status: "now" as const,
    detail: "Live DAMM v2 TOKEN–ANSEM index, share weights, multi map-wallet ingest.",
  },
  {
    id: "launchpad",
    phase: 2,
    title: "Launchpad",
    status: "next" as const,
    detail: "ANSEM-based launch into TOKEN–ANSEM pools — Perpad-shaped, no keys on hub.",
  },
  {
    id: "nodes",
    phase: 3,
    title: "Nodes",
    status: "planned" as const,
    detail: "Registry of people’s ANSEM nodes — pubkeys + reports. Invest at will.",
  },
  {
    id: "flywheel",
    phase: 4,
    title: "Flywheel",
    status: "planned" as const,
    detail: "Private keepers: claim → buy index by share → 70% ANSEM → buybacks.",
  },
  {
    id: "long-sol",
    phase: 5,
    title: "Long SOL",
    status: "planned" as const,
    detail: "Optional SOL long after the core flywheel is stable.",
  },
  {
    id: "long-ansem",
    phase: 6,
    title: "Long ANSEM",
    status: "planned" as const,
    detail: "Optional ANSEM long — keys stay off the public hub.",
  },
  {
    id: "brain",
    phase: 7,
    title: "Brain",
    status: "planned" as const,
    detail: "Adaptive winner sizing from pool/fee data.",
  },
] as const;

export const WHITEPAPER_NAV = [
  { id: "cover", label: "Cover" },
  { id: "index", label: "Index" },
  { id: "shares", label: "Shares" },
  { id: "meteora", label: "Meteora" },
  { id: "pool", label: "Pools" },
  { id: "flywheel", label: "Fee chart" },
  { id: "launchpad", label: "Launchpad" },
  { id: "nodes", label: "Nodes" },
  { id: "howto", label: "How-to" },
  { id: "roadmap", label: "Roadmap" },
] as const;
