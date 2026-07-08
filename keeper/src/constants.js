/** $ANSEM — The Black Bull */
export const ANSEM_MINT = '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';

export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export const METEORA_DAMM_V2_API = 'https://damm-v2.datapi.meteora.ag';

/** Estimated SOL cost per claim + sweep + swap tick */
export const ESTIMATED_GAS_SOL = 0.003;

export const ROUTE_TYPES = {
  /** Jupiter SOL→ANSEM, then SPL transfer to ANSEM_DEST_WALLET (replaces LIFE burn) */
  JUPITER_BUY_SEND: 'jupiter_buy_send',
  /** Jupiter SOL→token, hold on operator */
  JUPITER_BUY_HOLD: 'jupiter_buy_hold',
  /** Keep SOL on operator */
  SOL_RESERVE: 'sol_reserve',
  /** Re-add liquidity to Meteora (manual / Phase C) */
  METEORA_REINVEST: 'meteora_reinvest',
};
