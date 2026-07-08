/**
 * ANSEM Index whitepaper — Part 1 is the fee → pool flywheel.
 * Later parts (token, keeper ops, roadmap) can extend this file.
 */

export const WHITEPAPER_VERSION = "v0.1-launch";
export const WHITEPAPER_TITLE = "ANSEM Index Whitepaper";

/** Minimum USD seeded into each start-list node (dual-sided). */
export const NODE_MIN_USD = 1;

export type FlowStep = {
  id: string;
  n: number;
  title: string;
  body: string;
};

/** Part 1 — the flow (lead the whitepaper with this). */
export const PART1_FLOW: FlowStep[] = [
  {
    id: "creator-fees",
    n: 1,
    title: "Collect creator / LP fees",
    body: "Fees accrue on Meteora DAMM v2 TOKEN–ANSEM positions owned by the LP wallet (W1). The keeper claims them on a schedule — no platform cut.",
  },
  {
    id: "buy-ansem",
    n: 2,
    title: "Buy ANSEM",
    body: "Claimed fees are swept to the operator (W2). A configured share is swapped via Jupiter into $ANSEM. Bought ANSEM is sent to the creator fee destination wallet — not burned.",
  },
  {
    id: "dual-sided",
    n: 3,
    title: "Fund dual-sided pools",
    body: "ANSEM (and paired tokens) seed dual-sided liquidity on Meteora: each start-list node gets both sides of the TOKEN–ANSEM pair so the book stays balanced and tradeable.",
  },
  {
    id: "min-nodes",
    n: 4,
    title: "Minimum in every node",
    body: `Launch seeds the start list evenly — about $${NODE_MIN_USD} here, $${NODE_MIN_USD} there — until every listed node has at least the minimum. Coverage first, size later.`,
  },
  {
    id: "winners",
    n: 5,
    title: "Add more to winners",
    body: "After the floor is in, new fee flow concentrates into nodes that are winning (volume, fees, retention). Losers stay at the minimum; winners get topped up.",
  },
];

export type StartNode = {
  ticker: string;
  mint?: string;
  pool?: string;
  /** Target floor USD for this node at launch */
  minUsd: number;
  /** Optional note / status */
  status?: "queued" | "seeded" | "winner" | "paused";
  note?: string;
};

/**
 * Start list — edit freely.
 * Seeded from the live tracked book; replace/reorder as you lock the launch set.
 * Keeper / manage UI reads this for “nodes to seed” display.
 */
export const START_LIST: StartNode[] = [
  { ticker: "BIF", mint: "62YE1d4sRArBQzR5bdbxsx2k9LV3MdPV4xMC4Di2pump", pool: "74bgudzA62dkB4oGfhR8TUmd9dphVsrqJdFoW4xnWRX2", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "LIFE", mint: "J8cXU1EFi1SCTJ9XYpBnjqQ7nVLETNLFaRaHCP3RLiFE", pool: "B86oFNeAXyt1TKVM9S2qe6JPE9rV7EVD9rqbvMPnZx7Y", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "CASHCAT", mint: "22deNCri9bBae1GWZxdaDxipMWdwAUQ2ddvxdSmgpump", pool: "F4ZAM5zPnJCR994AGSpKe5dxpV87KBfevK2rybA2A9Yq", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "RIF", mint: "G7zeUXZzTUa8iXeUcW5J8oK9zoK4WY75fzmwFMe5pump", pool: "9jnrVQbWac1g7cReQ1B6XzHu37E7bAG8xeu89zndmF4", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "CATWIF", mint: "5pYB12kEhfhSFXJjZ7JtyqDpt6uUqhsF6iu6Ee9spump", pool: "Fw1HfwTsCrsSMZ5rVofC8sZEPw2dJepWvT95FFpkysim", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "ANSUM", mint: "GaZb3DE2U3Jcjx7ddAVwobsBKnCaDoJWLbzTvJYhpump", pool: "4n5vr17BX8f2FvvVfR8yWR8Xwx6yjVykw6kVmyAXm6Yv", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "aemon", mint: "G6ykv1kozjKFjrqs6cAHSmRgeD12EVGRL78AkHsqZTpz", pool: "8zYMVEaZCbHqKvJXZRQ2jXnrQeC6UehDBMde1JhfPD6x", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "manlet", mint: "DdPrHYqM8Ueovnk9kAnAgoGhswkuaTqmxcoZzU3Zpump", pool: "GRvt13cYfQN2yW8MKBDhytwLxY1FvMbCVPsKog3Q6a1D", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "IMG", mint: "znv3FZt2HFAvzYf5LxzVyryh3mBXWuTRRng25gEZAjh", pool: "CPFU1K2Wv6dJ3La7fzn9xHJXyxheneFGM2qoo9jDFSrX", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "BTCBANK", mint: "9s96G11xGsHczudfJqKQzQxzvubQgJXSySJ1wRgxpump", pool: "BCPgWK8diJk1de6DNpLymbFgQfzEq1M1wthQVRJfLEAY", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "world", mint: "FMqh9mqR6drPZqqW6wPqLHxX4rqNDWGhYLaMfoaJpump", pool: "EsbAi8SCHgUEWXWYqDRjMPqvEKqxw9Y7YGsGZ1kVTQ5j", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "BABYANSEM", mint: "DLvuaz18bKnh1hEaCZsZ5NgJi7wYFm5RvgZVA2M5pump", pool: "5Js3kkt49dvnY8ep9R9vNDNycHGvHhT5NWEoKuXLcNhE", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "Jotchua", mint: "BcHEaaTCvycPwwsJ9yQTXdHP9X2gCLkznDbZ8VySpump", pool: "EjrSeTvU5UfruHXf44ETUSJ1HL83CcWR7k48oCyccXxT", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "SCAM", mint: "6AVAUKa9uxQpruHZUinFECpXEh1usRVtzQWK8N2wpump", pool: "EHbZGrXhkvXpLMazvGhHUAFD48DgUMhtYQ1trF3eLGWK", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "VINE", mint: "6AJcP7wuLwmRYLBNbi825wgguaPsWzPBEHcHndpRpump", pool: "7wS9mtdZfJ56CRmzdugxZPSMSzkaxdGgwVNRuTALGhnQ", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "MET", mint: "METvsvVRapdj9cFLzq4Tr43xK4tAjQfwX76z3n6mWQL", pool: "5xivWhJiSXMHRTWKimkCxZiQdwS2QhAbUrtKHQtF2pqJ", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "TOESCOIN", mint: "6ehEcTMCc85aNF4x9CWx8HuvWGhxQtvKdhKVf2HDpump", pool: "HESE9MkqPvbG8vTrW1waThrqS4nA8C9PQKoLvXm2EGKt", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "DADDY", mint: "4Cnk9EPnW5ixfLZatCPJjDB1PUtcRpVVgTQukm9epump", pool: "J5ygtzpk5gxEmn1FXxi3UMYpVsQi8ZpTuHNX6923B4Fh", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "BIH", mint: "35zP1UMDVG89BZBk8kg771Cfj7h9WzbYVwdgZmVwpump", pool: "A77pPPT1rXUN8oRMqSgzMhz4muhx4KdSbTb1V1LTEekj", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "WLFI", mint: "WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g", pool: "BTcAaWfxJkn2zdEjvKksBg6RvyGMNW4hVbFv9G6KkLdg", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "WYNN", mint: "9E2Q4KKxLS5Y4bu6RKvjg5wQ2kzaLkiVsMt7zwMZpump", pool: "3n5noqZByDWRUx4yr4AkzoPzrSYc1n7vG3jt16XB7smV", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "NORMIE", mint: "4MrsXQzaosYNyFd4wKDvgnC5xRtRqgXRrijFTGj9pump", pool: "6UNCwJNw5zmYCUF4W8d8mk2uDm44PMFfzGnznv6oG9hV", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "Fartcoin", mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", pool: "92hXQu4BzHymaQNo5nXjwXS14jApmLgWutWSoAak7HbX", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "Bank", mint: "2jCt3hj9vd7YpV7Sr3VA5nk3tdSpJtZezeoJXW4Xpump", pool: "7qcRBKAyiuFXeK68RMbYtHBzQcPpSjuqyEV13ER4CWEz", minUsd: NODE_MIN_USD, status: "queued" },
  { ticker: "$WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", pool: "HesbDEM6vAVpScMiZbVUzWkNt9BHB7jp15HcDEuz7XXY", minUsd: NODE_MIN_USD, status: "queued" },
];

export const PARTS = [
  {
    id: "part-1",
    label: "Part 1 — The flow",
    blurb: "Creator fees → buy ANSEM → dual-sided pools → $1 floor per node → scale winners.",
  },
  {
    id: "part-2",
    label: "Part 2 — Wallets & custody",
    blurb: "W1 LP claims · W2 operator buys/sends · ANSEM dest receives. Coming next.",
    stub: true,
  },
  {
    id: "part-3",
    label: "Part 3 — Index token",
    blurb: "Memecoin that buys the index. Outline only until pools + fee loop are live.",
    stub: true,
  },
] as const;

export function startListFloorUsd(list: StartNode[] = START_LIST): number {
  return list.reduce((s, n) => s + (n.minUsd ?? NODE_MIN_USD), 0);
}
