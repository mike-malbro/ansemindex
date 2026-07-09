export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
};

export type AmountBundle = {
  amount_x: number;
  amount_y: number;
  amount_x_usd: number;
  amount_y_usd: number;
  amount_x_sol: number;
  amount_y_sol: number;
};

export type UnclaimedFees = AmountBundle;

export type UnclaimedRewards = {
  reward_amount_x: number;
  reward_amount_x_usd: number;
  reward_amount_x_sol: number;
  reward_amount_y: number;
  reward_amount_y_usd: number;
  reward_amount_y_sol: number;
};

export type LockedLiquidity = {
  has_locked_liquidity: boolean;
  unlocked_pct: number;
  vesting_pct: number;
  permanent_locked_pct: number;
  unlocked_amounts: AmountBundle;
};

export type CurrentPosition = {
  current_deposits: AmountBundle;
  unclaimed_fees: UnclaimedFees;
  unclaimed_rewards: UnclaimedRewards;
  updated_at_slot: number;
  locked_liquidity: LockedLiquidity;
};

export type PoolConfig = {
  collect_fee_mode: number;
  base_fee_mode: number;
  base_fee_pct: number;
  dynamic_fee_initialized: boolean;
  pool_type: number;
  concentrated_liquidity: boolean;
  min_price: number;
  max_price: number;
  activation_type: number;
  activation_point: number;
  has_fee_scheduler: boolean;
  is_fee_scheduler_active: boolean;
};

export type OpenPosition = {
  position_address: string;
  pool_address: string;
  pool_name: string;
  token_x: TokenInfo;
  token_y: TokenInfo;
  pool_price: number;
  pool_config: PoolConfig;
  created_at: number;
  total_deposits: AmountBundle;
  total_withdraws: AmountBundle;
  total_claimed_fees: AmountBundle;
  current_position: CurrentPosition;
  // Optional PnL fields when present on the API
  pnl?: number;
  pnl_pct_change?: number;
  pnl_sol?: number;
  pnl_sol_pct_change?: number;
};

export type PositionsByPool = {
  pool_address: string;
  pool_name?: string;
  positions: OpenPosition[];
};

export type PortfolioTotals = {
  balances: number;
  unclaimed_fees: number;
  unclaimed_rewards: number;
  total_deposits: number;
  pnl: number;
  pnl_pct_change: number;
  balances_sol: number;
  unclaimed_fees_sol: number;
  unclaimed_rewards_sol: number;
  total_deposits_sol: number;
  pnl_sol: number;
  pnl_sol_pct_change: number;
};

export type OpenPositionsResponse = {
  total_positions: number;
  total_pools?: number;
  total: PortfolioTotals;
  sol_price: number;
  data: OpenPosition[] | PositionsByPool[];
};

export type PoolResponse = {
  address: string;
  name?: string;
  pool_name?: string;
  token_x?: TokenInfo;
  token_y?: TokenInfo;
  tvl?: number;
  volume?: Record<string, number>;
  fees?: Record<string, number>;
  [key: string]: unknown;
};

export type OhlcvCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type OhlcvResponse = {
  data?: OhlcvCandle[];
  candles?: OhlcvCandle[];
  [key: string]: unknown;
};

export type VolumeHistoryPoint = {
  time: number;
  volume: number;
  volume_usd?: number;
};

export type VolumeHistoryResponse = {
  data?: VolumeHistoryPoint[];
  [key: string]: unknown;
};

export type EnrichedPosition = OpenPosition & {
  position_value_usd: number;
  unclaimed_fees_usd: number;
  /** All-time claimed (quote / claimable slice from Meteora). */
  claimed_fees_usd: number;
  /**
   * Estimated fees auto-compounded into LP (90% on compounding pools).
   * Backed out from claimable ÷ claim share.
   */
  compounded_fees_usd: number;
  /** All-time LP fees generated = claimable + compounded. */
  fees_generated_usd: number;
  constituent_token: TokenInfo;
  ansem_token: TokenInfo;
  ticker: string;
  image_url?: string;
  market_cap?: number;
  price_usd?: number;
  volume_24h?: number;
  price_change_5m?: number;
  price_change_1h?: number;
  price_change_6h?: number;
  price_change_24h?: number;
};

export type PortfolioFeeTotals = {
  unclaimed_usd: number;
  claimed_usd: number;
  compounded_usd: number;
  generated_usd: number;
  compound_pct: number;
  claim_pct: number;
};

export type PortfolioPayload = {
  wallet: string;
  ansem_mint: string;
  fetched_at: string;
  total_positions: number;
  total_pools: number;
  sol_price: number;
  totals: PortfolioTotals;
  /** All-time fee tracking (90% compound / 10% claim in quote). */
  fee_totals: PortfolioFeeTotals;
  positions: EnrichedPosition[];
};

/** Live index row (merged across map wallets). */
export type IndexPoolRow = {
  pool_id: string;
  pool_address: string;
  pool_name: string | null;
  token_mint: string;
  token_symbol: string;
  ansem_mint: string;
  base_fee_pct: number | null;
  status: string;
  last_seen_at: string;
  position_value_usd: number;
  unclaimed_fees_usd: number;
  claimed_fees_usd: number;
  /** Estimated 90% auto-compounded into LP. */
  compounded_fees_usd: number;
  /** All-time generated = claimable + compounded. */
  fees_generated_usd: number;
  token_amount: number;
  ansem_amount: number;
  token_usd: number;
  ansem_usd: number;
  pool_tvl_usd: number | null;
  volume_24h_usd: number | null;
  price_change_5m: number | null;
  price_change_1h: number | null;
  price_change_6h: number | null;
  price_change_24h: number | null;
  market_cap_usd: number | null;
  position_address: string | null;
  /** Primary map wallet (first) — prefer map_wallets */
  controller_wallet: string;
  /** All map wallets holding LP in this pool */
  map_wallets: string[];
  /** Pool value / total index value * 100 */
  share_pct: number;
  snapshot_at: string | null;
};

/** Map wallet = discovery pubkey (not the index itself). */
export type MapWalletRow = {
  address: string;
  label: string;
  sort_order: number;
  pools: number;
  position_usd: number;
  unclaimed_fees_usd: number;
  claimed_fees_usd: number;
  fees_earned_usd: number;
};

/** @deprecated use MapWalletRow */
export type CreatorWalletRow = MapWalletRow;

export type IndexPayload = {
  source: "db" | "live";
  index_token: string;
  wallet0: string;
  wallets: { address: string; label: string; sort_order: number }[];
  map_wallets: MapWalletRow[];
  /** @deprecated alias of map_wallets */
  creators: MapWalletRow[];
  ansem_mint: string;
  treasury_usd: number;
  ingested_at: string | null;
  total_pools: number;
  total_position_usd: number;
  total_fees_usd: number;
  total_claimed_fees_usd: number;
  /** Claimable only (unclaimed + claimed) — understates 90/10 pools. */
  total_fees_earned_usd: number;
  /** Estimated all-time compounded (90% slice). */
  total_compounded_fees_usd: number;
  /** All-time generated = claimable + compounded. */
  total_fees_generated_usd: number;
  pools: IndexPoolRow[];
};
