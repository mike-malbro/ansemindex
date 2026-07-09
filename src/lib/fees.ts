import { CLAIM_FEE_BPS, COMPOUNDING_FEE_BPS } from "./config";
import { claimedFeesUsd, unclaimedFeesUsd } from "./meteora";
import type { OpenPosition } from "./types";

/** CollectFeeMode: 0 BothToken, 1 OnlyB (quote), 2 Compounding */
export const COLLECT_FEE_COMPOUNDING = 2;

export type FeeBreakdown = {
  /** Claimable fees sitting in the position (quote / 10% slice). */
  unclaimed_usd: number;
  /** All-time claimed from this position (quote / 10% slice). */
  claimed_usd: number;
  /** claimed + unclaimed — all claimable fees ever accrued. */
  claimable_all_time_usd: number;
  /**
   * Estimated fees auto-reinvested into LP (90% on compounding pools).
   * Backed out from claimable ÷ claim share.
   */
  compounded_usd: number;
  /** All-time LP fees generated = claimable + compounded. */
  generated_usd: number;
  compound_pct: number;
  claim_pct: number;
  is_compounding: boolean;
};

function claimShare(isCompounding: boolean): number {
  if (!isCompounding) return 1;
  const bps = CLAIM_FEE_BPS > 0 ? CLAIM_FEE_BPS : 1000;
  return bps / 10_000;
}

/**
 * Expand Meteora's claimable-only numbers into full fee tracking.
 * On 90/10 compounding pools, reported fees are ~10% of LP fees generated.
 */
export function feeBreakdownFromClaimable(
  unclaimedUsd: number,
  claimedUsd: number,
  collectFeeMode?: number | null,
): FeeBreakdown {
  const isCompounding = collectFeeMode === COLLECT_FEE_COMPOUNDING;
  const share = claimShare(isCompounding);
  const unclaimed = Number(unclaimedUsd) || 0;
  const claimed = Number(claimedUsd) || 0;
  const claimable = unclaimed + claimed;
  const generated = share > 0 ? claimable / share : claimable;
  const compounded = Math.max(0, generated - claimable);

  return {
    unclaimed_usd: unclaimed,
    claimed_usd: claimed,
    claimable_all_time_usd: claimable,
    compounded_usd: compounded,
    generated_usd: generated,
    compound_pct: isCompounding ? COMPOUNDING_FEE_BPS / 100 : 0,
    claim_pct: isCompounding ? CLAIM_FEE_BPS / 100 : 100,
    is_compounding: isCompounding,
  };
}

export function feeBreakdownForPosition(p: OpenPosition): FeeBreakdown {
  return feeBreakdownFromClaimable(
    unclaimedFeesUsd(p),
    claimedFeesUsd(p),
    p.pool_config?.collect_fee_mode,
  );
}

export function sumFeeBreakdowns(rows: FeeBreakdown[]): FeeBreakdown {
  const unclaimed = rows.reduce((s, r) => s + r.unclaimed_usd, 0);
  const claimed = rows.reduce((s, r) => s + r.claimed_usd, 0);
  const compounded = rows.reduce((s, r) => s + r.compounded_usd, 0);
  const generated = rows.reduce((s, r) => s + r.generated_usd, 0);
  const anyCompounding = rows.some((r) => r.is_compounding);
  return {
    unclaimed_usd: unclaimed,
    claimed_usd: claimed,
    claimable_all_time_usd: unclaimed + claimed,
    compounded_usd: compounded,
    generated_usd: generated,
    compound_pct: anyCompounding ? COMPOUNDING_FEE_BPS / 100 : 0,
    claim_pct: anyCompounding ? CLAIM_FEE_BPS / 100 : 100,
    is_compounding: anyCompounding,
  };
}
