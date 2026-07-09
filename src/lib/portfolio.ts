import { ANSEM_MINT, PRIMARY_WALLET } from "./config";
import { hasDatabase, query } from "./db";
import { enrichPositions } from "./dexscreener";
import { feeBreakdownForPosition, sumFeeBreakdowns } from "./fees";
import {
  getOpenPositions,
  getPoolsTvlUsd,
  isAnsemIndexPool,
} from "./meteora";
import type { PortfolioPayload, PortfolioTotals } from "./types";

/** Open Index pool addresses (DB). Used to scope wallet → Index only. */
async function indexPoolAddresses(): Promise<Set<string> | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await query<{ pool_address: string }>(
      `SELECT pool_address FROM pools WHERE status = 'open'`,
    );
    if (!rows.length) return null;
    return new Set(rows.map((r) => r.pool_address));
  } catch {
    return null;
  }
}

function totalsFromPositions(
  positions: Awaited<ReturnType<typeof enrichPositions>>,
  solPrice: number,
  feeSum: ReturnType<typeof sumFeeBreakdowns>,
): PortfolioTotals {
  const balances = positions.reduce((s, p) => s + p.position_value_usd, 0);
  const unclaimed = feeSum.unclaimed_usd;
  const sol = solPrice > 0 ? balances / solPrice : 0;
  const unclaimedSol = solPrice > 0 ? unclaimed / solPrice : 0;
  return {
    balances,
    unclaimed_fees: unclaimed,
    unclaimed_rewards: 0,
    total_deposits: balances,
    pnl: 0,
    pnl_pct_change: 0,
    balances_sol: sol,
    unclaimed_fees_sol: unclaimedSol,
    unclaimed_rewards_sol: 0,
    total_deposits_sol: sol,
    pnl_sol: 0,
    pnl_sol_pct_change: 0,
  };
}

/**
 * Wallet ↔ Index: only TOKEN–ANSEM DAMM v2 LPs on the Index list,
 * with each row’s share_of_pool_pct = wallet LP / pool TVL.
 * Not SPL holdings. Not non-ANSEM pools.
 */
export async function buildPortfolio(
  wallet = PRIMARY_WALLET,
): Promise<PortfolioPayload> {
  const open = await getOpenPositions(wallet);
  const ansemPairs = open.positions.filter((p) =>
    isAnsemIndexPool(p, ANSEM_MINT),
  );

  const onIndex = await indexPoolAddresses();
  const scoped = onIndex
    ? ansemPairs.filter((p) => onIndex.has(p.pool_address))
    : ansemPairs;

  const enriched = await enrichPositions(scoped, ANSEM_MINT);

  // Pool % = this wallet’s LP USD ÷ full pool TVL
  const tvlByPool = await getPoolsTvlUsd(
    enriched.map((p) => p.pool_address),
  );

  for (const p of enriched) {
    const tvl = tvlByPool.get(p.pool_address) ?? null;
    p.pool_tvl_usd = tvl;
    p.share_of_pool_pct =
      tvl != null && tvl > 0
        ? (p.position_value_usd / tvl) * 100
        : null;
  }

  enriched.sort(
    (a, b) =>
      (b.share_of_pool_pct ?? 0) - (a.share_of_pool_pct ?? 0) ||
      b.position_value_usd - a.position_value_usd,
  );

  const poolSet = new Set(enriched.map((p) => p.pool_address));
  const feeSum = sumFeeBreakdowns(
    scoped.map((p) => feeBreakdownForPosition(p)),
  );
  const solPrice = open.sol_price || 0;
  const withShare = enriched.filter(
    (p) => p.share_of_pool_pct != null && p.share_of_pool_pct > 0,
  );
  const avgShare =
    withShare.length > 0
      ? withShare.reduce((s, p) => s + (p.share_of_pool_pct ?? 0), 0) /
        withShare.length
      : 0;

  return {
    wallet,
    ansem_mint: ANSEM_MINT,
    fetched_at: new Date().toISOString(),
    total_positions: enriched.length,
    total_pools: poolSet.size,
    pools_with_share: withShare.length,
    avg_pool_share_pct: avgShare,
    sol_price: solPrice,
    totals: totalsFromPositions(enriched, solPrice, feeSum),
    fee_totals: {
      unclaimed_usd: feeSum.unclaimed_usd,
      claimed_usd: feeSum.claimed_usd,
      compounded_usd: feeSum.compounded_usd,
      generated_usd: feeSum.generated_usd,
      compound_pct: feeSum.compound_pct,
      claim_pct: feeSum.claim_pct,
    },
    positions: enriched,
  };
}
