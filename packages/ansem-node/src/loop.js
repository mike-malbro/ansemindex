import { config, isLive } from './config.js';
import { splitFees, applyAnsemSendCap, ROUTE_TYPES } from './router.js';
import {
  createMeteoraAdapter,
  listOpenPositions,
} from './adapters/meteora.js';
import { createJupiterAdapter } from './adapters/jupiter.js';
import {
  sweepSol,
  getSolBalance,
  getTokenBalanceRaw,
  signAndSendTransaction,
  buildTokenTransferTx,
} from './adapters/solana.js';
import { loadLpKeypair, loadOperatorKeypair } from './wallet.js';
import { ESTIMATED_GAS_SOL } from './constants.js';

async function fetchSolUsd() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    );
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    return Number(j?.solana?.usd) || 0;
  } catch {
    // fallback from Meteora portfolio if needed
    return 0;
  }
}

function feesUsdFromApiPosition(p) {
  const f = p.current_position?.unclaimed_fees;
  if (!f) return 0;
  return (f.amount_x_usd ?? 0) + (f.amount_y_usd ?? 0);
}

export function planTick({ operatorSol, solUsd, claimableFeesUsd }) {
  const operatorUsd = operatorSol * (solUsd || 0);
  const spendableFromOp = Math.max(0, operatorUsd - config.minReserveUsd);
  const pool = Math.min(
    spendableFromOp,
    claimableFeesUsd > 0 ? claimableFeesUsd : spendableFromOp,
    config.maxBuyUsdPerRun,
  );

  if (pool < config.minRouteUsd) {
    return {
      status: 'skip',
      reason: `spendable $${pool.toFixed(2)} < MIN_ROUTE_USD $${config.minRouteUsd}`,
      legs: [],
      totalUsd: 0,
    };
  }

  let legs = splitFees(pool).legs;
  legs = applyAnsemSendCap(legs, pool, config.ansemSendCapUsd);
  legs = legs.filter((l) => l.usd >= config.minRouteUsd || l.type === ROUTE_TYPES.SOL_RESERVE);

  return {
    status: 'ready',
    totalUsd: pool,
    legs,
    operatorUsd,
    solUsd,
  };
}

async function claimEligiblePositions(meteora, dryRun) {
  const positions = await listOpenPositions(config.lpWallet);
  const withFees = positions
    .map((p) => ({
      position: p.position_address,
      pool: p.pool_address,
      name: p.pool_name,
      feesUsd: feesUsdFromApiPosition(p),
    }))
    .filter((p) => p.feesUsd >= config.minClaimUsd)
    .sort((a, b) => b.feesUsd - a.feesUsd)
    .slice(0, config.maxClaimPerTick);

  const results = [];
  let claimedUsd = 0;

  if (!withFees.length) {
    return { results, claimedUsd, scanned: positions.length };
  }

  const lpKp = loadLpKeypair();
  if (!dryRun && !lpKp) {
    return {
      results: [{ status: 'blocked', error: 'LP_PRIVATE_KEY required to claim' }],
      claimedUsd: 0,
      scanned: positions.length,
    };
  }

  for (const row of withFees) {
    const built = await meteora.buildClaimFeesTx(row.position, config.lpWallet);
    if (built.status === 'SKIP') {
      results.push({ ...row, status: 'skip', reason: built.error });
      continue;
    }
    if (built.status !== 'READY') {
      results.push({ ...row, status: 'error', error: built.error });
      continue;
    }

    if (dryRun) {
      results.push({
        ...row,
        status: 'dry_run',
        note: 'would claimPositionFee2',
      });
      claimedUsd += row.feesUsd;
      continue;
    }

    try {
      const sig = await signAndSendTransaction(
        built.serialized,
        [lpKp],
        `claim:${row.position.slice(0, 8)}`,
      );
      results.push({ ...row, status: 'claimed', sig });
      claimedUsd += row.feesUsd;
    } catch (e) {
      results.push({
        ...row,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { results, claimedUsd, scanned: positions.length };
}

async function maybeSweep(dryRun) {
  if (!config.operatorWallet) {
    return { status: 'skip', reason: 'OPERATOR_WALLET not set' };
  }
  const lpKp = loadLpKeypair();
  if (!lpKp) {
    return { status: 'skip', reason: 'LP key missing for sweep' };
  }

  const sweep = await sweepSol(lpKp, config.operatorWallet, config.lpReserveSol);
  if (sweep.status !== 'ready') return sweep;

  if (dryRun) {
    return { status: 'dry_run', sol: sweep.sol, note: 'would sweep W1→W2' };
  }

  const sig = await signAndSendTransaction(sweep.serialized, [lpKp], 'sweep');
  return { status: 'swept', sig, sol: sweep.sol };
}

async function executeBuySendLeg(leg, solUsd, dryRun) {
  if (!leg.recipient) {
    return { status: 'error', error: 'ANSEM_DEST_WALLET / recipient missing' };
  }
  if (leg.usd < config.minRouteUsd) {
    return { status: 'skip', reason: 'below MIN_ROUTE_USD' };
  }

  const opKp = loadOperatorKeypair();
  const owner = config.operatorWallet || opKp?.publicKey.toBase58();
  if (!owner) return { status: 'error', error: 'OPERATOR_WALLET missing' };

  const jupiter = createJupiterAdapter();
  const opBal = await getSolBalance(owner);
  const maxLamports = Math.floor(opBal * 1e9);

  const swap = await jupiter.swapSolForToken(
    leg.usd,
    leg.mint || config.ansemMint,
    solUsd,
    owner,
    maxLamports,
  );

  if (swap.status === 'SKIP') return swap;
  if (swap.status !== 'READY') {
    return { status: 'error', error: swap.error, quote: swap.quote };
  }

  if (dryRun) {
    return {
      status: 'dry_run',
      action: 'buy_send_ansem',
      usd: leg.usd,
      outAmount: swap.quote?.outAmount,
      recipient: leg.recipient,
      note: 'would Jupiter buy ANSEM then SPL transfer to dest',
    };
  }

  if (!opKp) return { status: 'error', error: 'OPERATOR_PRIVATE_KEY required' };

  const swapSig = await signAndSendTransaction(
    swap.serialized,
    [opKp],
    'jupiter_buy_ansem',
  );

  // Transfer full post-swap ANSEM balance (or quoted out) to dest
  const bal = await getTokenBalanceRaw(owner, leg.mint || config.ansemMint);
  const amount = bal > 0n ? bal : BigInt(swap.quote?.outAmount || 0);
  if (amount <= 0n) {
    return {
      status: 'partial',
      swapSig,
      error: 'swap ok but no ANSEM balance to send',
    };
  }

  const transfer = await buildTokenTransferTx(
    leg.mint || config.ansemMint,
    amount,
    owner,
    leg.recipient,
  );
  if (transfer.status !== 'READY') {
    return { status: 'partial', swapSig, error: transfer.error };
  }

  const sendSig = await signAndSendTransaction(
    transfer.serialized,
    [opKp],
    'send_ansem',
  );

  return {
    status: 'live',
    swapSig,
    sendSig,
    amount: Number(amount),
    recipient: leg.recipient,
    usd: leg.usd,
  };
}

async function executeLegs(legs, solUsd, dryRun) {
  const out = [];
  for (const leg of legs) {
    if (leg.type === ROUTE_TYPES.SOL_RESERVE) {
      out.push({ ...leg, status: 'ok', note: 'held on operator' });
      continue;
    }
    if (leg.type === ROUTE_TYPES.METEORA_REINVEST) {
      out.push({
        ...leg,
        status: 'not_implemented',
        note: 'Add liquidity manually on app.meteora.ag with W1',
      });
      continue;
    }
    if (leg.type === ROUTE_TYPES.JUPITER_BUY_SEND) {
      out.push({ ...(await executeBuySendLeg(leg, solUsd, dryRun)), legId: leg.id });
      continue;
    }
    if (leg.type === ROUTE_TYPES.JUPITER_BUY_HOLD) {
      // buy only, no send
      const jupiter = createJupiterAdapter();
      const opKp = loadOperatorKeypair();
      const owner = config.operatorWallet || opKp?.publicKey.toBase58();
      const opBal = await getSolBalance(owner);
      const swap = await jupiter.swapSolForToken(
        leg.usd,
        leg.mint || config.ansemMint,
        solUsd,
        owner,
        Math.floor(opBal * 1e9),
      );
      if (dryRun || swap.status !== 'READY') {
        out.push({
          status: dryRun ? 'dry_run' : swap.status,
          error: swap.error,
          usd: leg.usd,
        });
        continue;
      }
      if (!opKp) {
        out.push({ status: 'error', error: 'OPERATOR_PRIVATE_KEY required' });
        continue;
      }
      const sig = await signAndSendTransaction(swap.serialized, [opKp], 'buy_hold');
      out.push({ status: 'live', sig, usd: leg.usd });
      continue;
    }
    out.push({ status: 'skip', reason: `unknown leg ${leg.type}` });
  }
  return out;
}

/**
 * One keeper tick:
 *   probe positions → claim fees (W1) → sweep SOL (W1→W2) → plan → buy ANSEM → send to dest
 */
export async function runKeeperTick(opts = {}) {
  const dryRun = opts.dryRun ?? !isLive();
  const started = new Date().toISOString();
  const meteora = createMeteoraAdapter();

  let solUsd = await fetchSolUsd();
  const positions = await listOpenPositions(config.lpWallet);
  const claimableFeesUsd = positions.reduce((s, p) => s + feesUsdFromApiPosition(p), 0);

  // Prefer sol price from API payload if coingecko failed
  if (!solUsd && positions[0]) {
    // open_positions response includes sol_price at top level — re-fetch raw
    try {
      const res = await fetch(
        `https://damm-v2.datapi.meteora.ag/wallets/${config.lpWallet}/open_positions`,
      );
      const j = await res.json();
      solUsd = Number(j.sol_price) || 0;
    } catch {
      /* ignore */
    }
  }

  const claim = await claimEligiblePositions(meteora, dryRun);
  const sweep = await maybeSweep(dryRun);

  const opWallet = config.operatorWallet || config.lpWallet;
  const operatorSol = await getSolBalance(opWallet);

  // After claim+sweep, route from operator balance (or simulated claimable)
  const routeBudgetUsd = dryRun
    ? Math.max(claimableFeesUsd, claim.claimedUsd)
    : claim.claimedUsd || claimableFeesUsd * 0; // live: only route what we just claimed / already on W2

  const plan = planTick({
    operatorSol: dryRun
      ? operatorSol + claimableFeesUsd / (solUsd || 1)
      : operatorSol,
    solUsd,
    claimableFeesUsd: dryRun ? claimableFeesUsd : Math.max(claim.claimedUsd, 0),
  });

  // In dry-run always show planned legs from claimable fees
  const planForExec =
    dryRun && plan.status === 'skip' && claimableFeesUsd >= config.minRouteUsd
      ? planTick({
          operatorSol: claimableFeesUsd / (solUsd || 80) + 1,
          solUsd: solUsd || 80,
          claimableFeesUsd,
        })
      : plan;

  let legResults = [];
  if (planForExec.status === 'ready') {
    legResults = await executeLegs(planForExec.legs, solUsd || 80, dryRun);
  }

  const summary = {
    started,
    finished: new Date().toISOString(),
    dry_run: dryRun,
    live: isLive(),
    wallets: {
      lp: config.lpWallet,
      operator: config.operatorWallet || null,
      ansem_dest: config.ansemDestWallet || null,
    },
    sol_usd: solUsd,
    positions_scanned: claim.scanned,
    claimable_fees_usd: claimableFeesUsd,
    claim,
    sweep,
    plan: planForExec,
    legs: legResults,
    gas_estimate_sol: ESTIMATED_GAS_SOL,
    route_budget_usd: routeBudgetUsd,
  };

  console.log(
    `[tick] dry=${dryRun} positions=${claim.scanned} fees=$${claimableFeesUsd.toFixed(2)} claims=${claim.results.length} plan=${planForExec.status}`,
  );

  return summary;
}
