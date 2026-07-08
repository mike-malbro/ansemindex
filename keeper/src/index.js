import http from 'http';
import { config, isLive } from './config.js';
import { runKeeperTick } from './loop.js';
import { verifyKeysMatchPubkeys } from './wallet.js';

let lastTick = null;
let running = false;

async function tickOnce() {
  if (running) {
    console.log('[keeper] tick already running — skip');
    return lastTick;
  }
  running = true;
  try {
    lastTick = await runKeeperTick({ dryRun: !isLive() });
    return lastTick;
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error('[keeper] tick failed:', err);
    lastTick = { error: err, finished: new Date().toISOString(), dry_run: !isLive() };
    return lastTick;
  } finally {
    running = false;
  }
}

function startHealthServer() {
  if (!config.healthEnabled) return;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${config.healthPort}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          service: 'ansem-index-keeper',
          dry_run: !isLive(),
          last_tick: lastTick?.finished ?? null,
        }),
      );
      return;
    }

    if (url.pathname === '/api/state') {
      const keys = verifyKeysMatchPubkeys();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          config: {
            cellId: config.cellId,
            lpWallet: config.lpWallet,
            operatorWallet: config.operatorWallet,
            ansemDestWallet: config.ansemDestWallet,
            ansemMint: config.ansemMint,
            dryRun: config.dryRun,
            simulationMode: config.simulationMode,
            live: isLive(),
            feeSplit: config.feeSplit,
            minClaimUsd: config.minClaimUsd,
            tickMs: config.tickMs,
          },
          keys,
          lastTick,
        }),
      );
      return;
    }

    if (url.pathname === '/api/tick' && req.method === 'POST') {
      const result = await tickOnce();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  server.listen(config.healthPort, '0.0.0.0', () => {
    console.log(`[keeper] health on :${config.healthPort}  (/health /api/state POST /api/tick)`);
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' ANSEM INDEX KEEPER');
  console.log(` cell=${config.cellId}`);
  console.log(` mode=${isLive() ? 'LIVE' : 'DRY_RUN'}`);
  console.log(` LP(W1)=${config.lpWallet}`);
  console.log(` OP(W2)=${config.operatorWallet || '(unset)'}`);
  console.log(` ANSEM dest=${config.ansemDestWallet || '(unset)'}`);
  console.log(' fee flow: claim → sweep → buy ANSEM → send (no burn)');
  console.log('═══════════════════════════════════════════');

  const keys = verifyKeysMatchPubkeys();
  if (!keys.ok) console.warn('[keeper] key checks:', keys.errors);

  startHealthServer();

  // Always run one tick at boot
  await tickOnce();

  if (config.manual) {
    console.log('[keeper] MANUAL=true — exiting after one tick');
    process.exit(0);
  }

  setInterval(() => {
    tickOnce().catch((e) => console.error(e));
  }, config.tickMs);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
