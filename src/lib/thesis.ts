/**
 * ANSEM Index thesis + how-to guide content.
 * Public hub only — no keys. Paper before machinery.
 */

export const ANSEM_TARGET_PCT = 0.7;
export const BASE_FEE_PCT = 1;
export const NODE_MIN_USD = 1;

export const PRINCIPLES = [
  "Public hub never holds private keys — i-am-aemon / Railway hub are pubkey-only.",
  "Controller wallets are the map (recent TOKEN–ANSEM pools), not our fee treasury.",
  "Our creator-fee treasury starts at $0 until fees exist.",
  "Copy the method, not the wallet — run your own ANSEM node.",
  "Observable or it didn’t happen — reports and on-chain txs only.",
  "Adaptable: fee tier, 70% gate, and seed rules can shift as data arrives.",
] as const;

export const THESIS = {
  why: {
    title: "Why we’re doing this",
    body: "ANSEM is the cultural and liquidity anchor for Solana memecoins. The index is a map of TOKEN–ANSEM markets — not a custodial fund. People run their own ANSEM nodes. The public hub is the shared guide: thesis, controller book, registry. Execution stays with holders.",
  },
  damm: {
    title: "Why DAMM v2",
    body: "Meteora DAMM v2 (CP-AMM) gives position NFTs, claimable fees, Token-2022 support, and cheap pool creation — the same holder-owned LP stack LIFE already proved. Public datapi lets the hub index pools without keys. Private keepers can claim later; the guide never signs.",
  },
  onePct: {
    title: "Why 1%",
    body: `Default TOKEN–ANSEM pairs use a ${BASE_FEE_PCT}% DAMM v2 base fee tier — enough surface for the flywheel, still tradeable. Not dogma: we can shift fee tier, splits, and seed rules as the book teaches us.`,
  },
  adapt: {
    title: "How we shift (adaptable)",
    body: "Pools and fee snapshots are the dataset. Rules (1.0) stay deterministic — especially custody. Later, a “brain” can rank winners and size adds from that data (Software 2.0 style). Keys never move onto the public hub.",
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
      rule: "Claim creator/LP fees → buy constituent tokens and ANSEM → send / dual-sided seed while ANSEM share of the program stack is under 70%.",
    },
    {
      id: "buybacks",
      label: "At ≥ 70% ANSEM",
      rule: "Same fee intake → 100% buybacks. No more mixed send/seed from this leg.",
    },
  ],
  steps: [
    { n: 1, title: "Collect creator fees", body: "Fees accrue on Meteora DAMM v2 TOKEN–ANSEM LP. Claim on your node (W1) — platform never takes a cut." },
    { n: 2, title: "Buy tokens / ANSEM", body: "Sweep to operator (W2). Jupiter-buy the pair tokens and ANSEM. No burn." },
    { n: 3, title: "Send while under 70%", body: "Send / seed dual-sided pools until ANSEM reaches 70% of the measured program stack." },
    { n: 4, title: "Then all buybacks", body: "Once ANSEM ≥ 70%, fee flow flips to all buybacks." },
    { n: 5, title: "Floor then winners", body: `Seed ~$${NODE_MIN_USD} dual-sided per start-list node first; then add more to winners.` },
  ],
} as const;

/** Homepage how-to guide steps */
export const HOW_TO_GUIDE = [
  {
    id: "read-thesis",
    n: 1,
    title: "Read the thesis",
    body: "Why DAMM v2, why 1%, why the 70% ANSEM gate, and how the system stays adaptable.",
    href: "/whitepaper#part-0",
    cta: "Whitepaper",
  },
  {
    id: "fee-chart",
    n: 2,
    title: "Learn the fee chart",
    body: "Creator fees → buy tokens/ANSEM → send until 70% ANSEM → then all buybacks.",
    href: "/whitepaper#fee-chart",
    cta: "Fee chart",
  },
  {
    id: "controller-book",
    n: 3,
    title: "Study the controller book",
    body: "Public read of recent TOKEN–ANSEM pools on the controller wallet(s) — the map, not our treasury.",
    href: "/book",
    cta: "Open book",
  },
  {
    id: "wallets",
    n: 4,
    title: "Wire your wallets (pubkeys)",
    body: "W1 LP · W2 operator · ANSEM dest. Public hub never asks for private keys.",
    href: "/manage",
    cta: "Manage",
  },
  {
    id: "seed-pools",
    n: 5,
    title: "Seed dual-sided pools",
    body: `Add liquidity on app.meteora.ag with your LP wallet — ~$${NODE_MIN_USD} per start-list node, both sides.`,
    href: "/whitepaper#start-list",
    cta: "Start list",
  },
  {
    id: "run-node",
    n: 6,
    title: "Run your own ANSEM node",
    body: "Copy the method, not the wallet. Dry-run first. Keys stay on your machine / private Railway — never on this public hub.",
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
    detail: "Master DB, controller book, start list $1 dual-sided floor, thesis + fee chart live.",
  },
  {
    id: "nodes",
    phase: 2,
    title: "Nodes",
    status: "next" as const,
    detail: "Registry of people’s ANSEM nodes — pubkeys + tick reports. Treasury still $0 until fees.",
  },
  {
    id: "flywheel",
    phase: 3,
    title: "Flywheel",
    status: "planned" as const,
    detail: "Private keepers: claim → buy tokens/ANSEM → send until 70% → all buybacks.",
  },
  {
    id: "brain",
    phase: 4,
    title: "Brain",
    status: "planned" as const,
    detail: "Adaptive winner sizing from pool/fee dataset. Still no keys on the public hub.",
  },
  {
    id: "index-token",
    phase: 5,
    title: "Index token",
    status: "planned" as const,
    detail: "Memecoin that buys the index — after pools + nodes work.",
  },
] as const;
