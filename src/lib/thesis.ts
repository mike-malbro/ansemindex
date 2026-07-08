/**
 * ANSEM Index thesis + how-to guide content.
 * Public hub only — no keys. Paper before machinery.
 */

export const WHITEPAPER_VERSION = "1.0";
export const WHITEPAPER_UPDATED_NOTE =
  "This paper will update as we ship. Check the version badge.";

export const ANSEM_TARGET_PCT = 0.7;
export const BASE_FEE_PCT = 1;
export const NODE_MIN_USD = 1;

export const MISSION =
  "ANSEM Index maps TOKEN–ANSEM markets on Meteora. Creator fees buy tokens and ANSEM until ANSEM is 70% of the program — then all buybacks. You run your own node. This public hub never holds keys.";

export const PRINCIPLES = [
  "Public hub never holds private keys.",
  "Controller wallets are the map — not our fee treasury.",
  "Our creator-fee treasury starts at $0 until fees exist.",
  "Copy the method, not the wallet — run your own ANSEM node.",
  "Observable or it didn’t happen.",
  "Rules can shift as data arrives — this paper will update.",
] as const;

/** Plain-English explainers for whitepaper v1.0 */
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
  body: `Our TOKEN–ANSEM pools default to a ${BASE_FEE_PCT}% base fee on swaps. That fee goes to LPs — not to this website. Compounding means: claim fees → buy more tokens/ANSEM → put them back into pools (or hold) so the next round of fees can be larger. We do not burn fees.`,
  bullets: [
    `${BASE_FEE_PCT}% of swap volume can accrue to LPs`,
    "Claim → buy → reinvest is the compound loop",
    "Fee tier can change later if the book needs it",
  ],
} as const;

export const EXPLAIN_INDEX = {
  title: "The index = wallet(0)",
  body: "wallet(0) is the controller pubkey. Its open TOKEN–ANSEM Meteora positions are the index. We read them from Meteora, store them in Postgres, and show pool amounts on the Index page. This is a map — not our fee treasury (that stays $0 until creator fees exist). Click a pool to see ranked top holders of that token.",
  bullets: [
    "Source: controller wallet open positions",
    "Stored continuously in the database",
    "Dashboard shows wallet(0) + pool amounts + holder ranks",
  ],
} as const;

export const THESIS = {
  why: {
    title: "Why we’re doing this",
    body: "ANSEM is the cultural and liquidity anchor for Solana memecoins. The index is a map of TOKEN–ANSEM markets — not a custodial fund. People run their own ANSEM nodes. The public hub is the shared guide.",
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
    body: "Pools and fees are the dataset. We start simple. Later we add nodes, buybacks, and optional longs. Custody rules stay hard: keys never live on the public hub.",
  },
} as const;

/** Canonical fee chart phases */
export const FEE_CHART = {
  title: "Fee chart — build to 70% ANSEM, then all buybacks",
  targetPct: ANSEM_TARGET_PCT,
  phases: [
    {
      id: "build",
      label: "Build to 70%",
      rule: "Claim fees → buy tokens and ANSEM → send / seed pools while ANSEM is under 70% of the program stack.",
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
      body: "Fees accrue on your Meteora TOKEN–ANSEM LP. You claim them on your node.",
    },
    {
      n: 2,
      title: "Buy tokens / ANSEM",
      body: "Use fees to buy the pair tokens and ANSEM. No burn.",
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
    body: "Learn pools, 1% fees, and the 70% ANSEM gate.",
  },
  {
    n: 2,
    title: "Use pubkeys only here",
    body: "W1 LP · W2 operator · ANSEM dest. Never paste private keys into this hub.",
  },
  {
    n: 3,
    title: "Seed dual-sided pools",
    body: `On app.meteora.ag, add ~$${NODE_MIN_USD} both sides per start-list node.`,
  },
  {
    n: 4,
    title: "Run your own node",
    body: "Copy the method. Dry-run first. Keys stay on your machine or private server.",
  },
] as const;

/** Homepage how-to guide steps */
export const HOW_TO_GUIDE = [
  {
    id: "read-paper",
    n: 1,
    title: "Read whitepaper v1.0",
    body: "Meteora, pools, 1% fees, fee chart, and roadmap — plain English.",
    href: "/whitepaper",
    cta: "Whitepaper v1.0",
  },
  {
    id: "fee-chart",
    n: 2,
    title: "Learn the fee chart",
    body: "Creator fees → buy tokens/ANSEM → send until 70% ANSEM → then all buybacks.",
    href: "/whitepaper#flywheel",
    cta: "Fee chart",
  },
  {
    id: "controller-book",
    n: 3,
    title: "Open the index",
    body: "wallet(0) pools + amounts + holder ranks — the map, not our treasury.",
    href: "/book",
    cta: "Open index",
  },
  {
    id: "wallets",
    n: 4,
    title: "Wire your wallets (pubkeys)",
    body: "W1 LP · W2 operator · ANSEM dest. This hub never asks for private keys.",
    href: "/manage",
    cta: "Manage",
  },
  {
    id: "seed-pools",
    n: 5,
    title: "Seed dual-sided pools",
    body: `Add liquidity on app.meteora.ag — ~$${NODE_MIN_USD} per node, both sides.`,
    href: "/whitepaper#howto",
    cta: "How-to",
  },
  {
    id: "run-node",
    n: 6,
    title: "Run your own ANSEM node",
    body: "Copy the method. Dry-run first. Keys stay private — never on this hub.",
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
    detail: "Controller book, start list, thesis + fee chart. Dual-sided $1 floor.",
  },
  {
    id: "nodes",
    phase: 2,
    title: "Nodes",
    status: "next" as const,
    detail: "Registry of people’s ANSEM nodes — pubkeys + reports. Treasury $0 until fees.",
  },
  {
    id: "flywheel",
    phase: 3,
    title: "Flywheel",
    status: "planned" as const,
    detail: "Private keepers: claim → buy → send until 70% ANSEM → all buybacks.",
  },
  {
    id: "long-sol",
    phase: 4,
    title: "Long SOL",
    status: "planned" as const,
    detail: "Optional SOL long from fee flow after the core flywheel is stable.",
  },
  {
    id: "long-ansem",
    phase: 5,
    title: "Long ANSEM",
    status: "planned" as const,
    detail: "Optional ANSEM long — same custody rule: keys stay off the public hub.",
  },
  {
    id: "brain",
    phase: 6,
    title: "Brain",
    status: "planned" as const,
    detail: "Adaptive winner sizing from pool/fee data. Still no keys on the public hub.",
  },
  {
    id: "index-token",
    phase: 7,
    title: "Index token",
    status: "planned" as const,
    detail: "Memecoin that buys the index — after pools + nodes work.",
  },
] as const;

export const WHITEPAPER_NAV = [
  { id: "cover", label: "Cover" },
  { id: "index", label: "Index" },
  { id: "meteora", label: "Meteora" },
  { id: "pool", label: "Pools" },
  { id: "fees", label: "1% fees" },
  { id: "flywheel", label: "Fee chart" },
  { id: "howto", label: "How-to" },
  { id: "roadmap", label: "Roadmap" },
] as const;
