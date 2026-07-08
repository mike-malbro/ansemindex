import { ANSEM_MINT, PRIMARY_WALLET } from "./config";
import { enrichPositions } from "./dexscreener";
import { getOpenPositions } from "./meteora";
import type { PortfolioPayload } from "./types";

export async function buildPortfolio(
  wallet = PRIMARY_WALLET,
): Promise<PortfolioPayload> {
  const open = await getOpenPositions(wallet);
  const enriched = await enrichPositions(open.positions, ANSEM_MINT);

  enriched.sort(
    (a, b) =>
      b.position_value_usd +
      b.unclaimed_fees_usd -
      (a.position_value_usd + a.unclaimed_fees_usd),
  );

  const poolSet = new Set(enriched.map((p) => p.pool_address));

  return {
    wallet,
    ansem_mint: ANSEM_MINT,
    fetched_at: new Date().toISOString(),
    total_positions: open.total_positions ?? enriched.length,
    total_pools: open.total_pools ?? poolSet.size,
    sol_price: open.sol_price,
    totals: open.total,
    positions: enriched,
  };
}
