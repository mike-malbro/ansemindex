import { ANSEM_MINT, PRIMARY_WALLET } from "./config";
import { hasDatabase, query } from "./db";
import { enrichPositions } from "./dexscreener";
import { feeBreakdownForPosition, sumFeeBreakdowns } from "./fees";
import { getOpenPositions, isAnsemIndexPool } from "./meteora";
import type { PortfolioPayload, PortfolioTotals } from "./types";

/** Open pool addresses currently on the Index book (DB). */
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
 * Wallet ↔ Index interaction only:
 * open Meteora DAMM v2 TOKEN–ANSEM LPs (prefer pools already on the Index book).
 * No SPL holdings, no non-ANSEM pools.
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

  enriched.sort(
    (a, b) =>
      b.fees_generated_usd - a.fees_generated_usd ||
      b.position_value_usd +
        b.unclaimed_fees_usd -
        (a.position_value_usd + a.unclaimed_fees_usd),
  );

  const poolSet = new Set(enriched.map((p) => p.pool_address));
  const feeSum = sumFeeBreakdowns(
    scoped.map((p) => feeBreakdownForPosition(p)),
  );
  const solPrice = open.sol_price || 0;

  return {
    wallet,
    ansem_mint: ANSEM_MINT,
    fetched_at: new Date().toISOString(),
    total_positions: enriched.length,
    total_pools: poolSet.size,
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
