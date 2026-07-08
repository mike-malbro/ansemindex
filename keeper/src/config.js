import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ANSEM_MINT, ROUTE_TYPES } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });
dotenv.config({ path: path.join(ROOT, 'cell_secrets.env') });

function str(key, fallback = '') {
  const v = process.env[key];
  return v != null && String(v).trim() !== '' ? String(v).trim() : fallback;
}

function num(key, fallback) {
  const v = process.env[key];
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(key, fallback = false) {
  const v = process.env[key];
  if (v == null || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function loadCellJson() {
  const p = path.join(ROOT, 'cell.json');
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

const cell = loadCellJson();

/**
 * Creator fee wallet structure (mirrors LIFE W0–W2, burn→ANSEM send):
 *   W0 MAIN_WALLET        — fund source (never signs)
 *   W1 LP_WALLET          — owns Meteora positions, claims fees
 *   W2 OPERATOR_WALLET    — Jupiter buy + SPL send signer
 *   ANSEM_DEST_WALLET     — receives bought ANSEM (replaces burn)
 */
export const config = {
  cellId: str('CELL_ID', cell.cellId || 'ansem-index'),
  rpcUrl: str('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
  ansemMint: str('ANSEM_MINT', cell.ansemMint || ANSEM_MINT),

  mainWallet: str('MAIN_WALLET', cell.wallets?.main || ''),
  lpWallet: str(
    'LP_WALLET',
    cell.wallets?.lp || 'HpJbzERP44V21mKGRDDUArb9JJaL9NdPSgXzZ9uyieVB',
  ),
  operatorWallet: str('OPERATOR_WALLET', cell.wallets?.operator || ''),
  ansemDestWallet: str(
    'ANSEM_DEST_WALLET',
    cell.wallets?.ansemDest || '',
  ),

  lpPrivateKey: str('LP_PRIVATE_KEY'),
  operatorPrivateKey: str('OPERATOR_PRIVATE_KEY'),

  dryRun: bool('DRY_RUN', true),
  simulationMode: bool('SIMULATION_MODE', true),
  manual: bool('MANUAL', false),

  tickMs: num('TICK_MS', 60_000),
  minClaimUsd: num('MIN_CLAIM_USD', 1),
  minRouteUsd: num('MIN_ROUTE_USD', 1),
  minReserveUsd: num('MIN_RESERVE_USD', 5),
  maxBuyUsdPerRun: num('MAX_BUY_USD_PER_RUN', 50),
  ansemSendCapUsd: num('ANSEM_SEND_CAP_USD', 0), // 0 = use pct split
  slippageBps: num('SLIPPAGE_BPS', 250),
  lpReserveSol: num('LP_RESERVE_SOL', 0.01),
  maxClaimPerTick: num('MAX_CLAIM_PER_TICK', 20),

  /** Fee split — must sum to 1. Default: 70% buy+send ANSEM, 30% reserve */
  feeSplit: {
    ansemSend: num('FEE_SPLIT_ANSEM_SEND', cell.feeSplit?.ansemSend ?? 0.7),
    reserve: num('FEE_SPLIT_RESERVE', cell.feeSplit?.reserve ?? 0.3),
    reinvest: num('FEE_SPLIT_REINVEST', cell.feeSplit?.reinvest ?? 0),
  },

  routes: cell.routes || null,

  healthPort: num('HEALTH_PORT', 8080),
  healthEnabled: bool('HEALTH_ENABLED', true),

  cell,
  root: ROOT,
};

export function defaultRoutes() {
  if (config.routes?.length) return config.routes;
  return [
    {
      id: 'ansem_send',
      pct: config.feeSplit.ansemSend,
      type: ROUTE_TYPES.JUPITER_BUY_SEND,
      mint: config.ansemMint,
      recipient: config.ansemDestWallet,
      note: 'Buy ANSEM with fees, send to creator fee wallet (not burn)',
    },
    {
      id: 'reserve',
      pct: config.feeSplit.reserve,
      type: ROUTE_TYPES.SOL_RESERVE,
      note: 'Keep SOL on operator for gas / future reinvest',
    },
    ...(config.feeSplit.reinvest > 0
      ? [
          {
            id: 'reinvest',
            pct: config.feeSplit.reinvest,
            type: ROUTE_TYPES.METEORA_REINVEST,
            note: 'Phase C — add liquidity back to pools',
          },
        ]
      : []),
  ];
}

export function isLive() {
  return !config.dryRun && !config.simulationMode;
}
