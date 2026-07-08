import { config, isLive, defaultRoutes } from './config.js';
import { verifyKeysMatchPubkeys } from './wallet.js';
import { listOpenPositions } from './adapters/meteora.js';
import { getSolBalance } from './adapters/solana.js';

async function main() {
  console.log('ANSEM Index keeper doctor\n');
  const checks = [];

  checks.push({
    name: 'LP_WALLET',
    ok: Boolean(config.lpWallet),
    detail: config.lpWallet || 'missing',
  });
  checks.push({
    name: 'OPERATOR_WALLET',
    ok: Boolean(config.operatorWallet),
    detail: config.operatorWallet || 'missing — needed for buy+send',
  });
  checks.push({
    name: 'ANSEM_DEST_WALLET',
    ok: Boolean(config.ansemDestWallet),
    detail: config.ansemDestWallet || 'missing — creator fee destination',
  });
  checks.push({
    name: 'mode',
    ok: true,
    detail: isLive() ? 'LIVE' : 'DRY_RUN (safe)',
  });

  const keys = verifyKeysMatchPubkeys();
  checks.push({
    name: 'keys',
    ok: keys.ok,
    detail: keys.ok
      ? `lp=${Boolean(config.lpPrivateKey)} op=${Boolean(config.operatorPrivateKey)}`
      : keys.errors.join('; '),
  });

  try {
    const routes = defaultRoutes();
    const sum = routes.reduce((s, r) => s + r.pct, 0);
    checks.push({
      name: 'routes',
      ok: Math.abs(sum - 1) < 1e-6,
      detail: routes.map((r) => `${r.id}:${r.pct}`).join(' + ') + ` = ${sum}`,
    });
  } catch (e) {
    checks.push({ name: 'routes', ok: false, detail: String(e.message || e) });
  }

  try {
    const positions = await listOpenPositions(config.lpWallet);
    const fees = positions.reduce((s, p) => {
      const f = p.current_position?.unclaimed_fees;
      return s + (f?.amount_x_usd ?? 0) + (f?.amount_y_usd ?? 0);
    }, 0);
    checks.push({
      name: 'positions',
      ok: positions.length > 0,
      detail: `${positions.length} open · $${fees.toFixed(2)} unclaimed fees`,
    });
  } catch (e) {
    checks.push({ name: 'positions', ok: false, detail: String(e.message || e) });
  }

  if (config.lpWallet) {
    const sol = await getSolBalance(config.lpWallet);
    checks.push({
      name: 'LP SOL',
      ok: sol >= 0.01,
      detail: `${sol.toFixed(4)} SOL`,
    });
  }
  if (config.operatorWallet) {
    const sol = await getSolBalance(config.operatorWallet);
    checks.push({
      name: 'Operator SOL',
      ok: sol >= 0.02,
      detail: `${sol.toFixed(4)} SOL`,
    });
  }

  for (const c of checks) {
    console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`);
  }

  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n${failed === 0 ? 'Ready for dry ticks.' : `${failed} issue(s) — fix before go-live.`}`);
  console.log('\nAdd liquidity: open app.meteora.ag with W1 (LP_WALLET), deposit TOKEN-ANSEM.');
  console.log('Go live: set DRY_RUN=false SIMULATION_MODE=false after keys + dest wallet wired.');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
