import { config, defaultRoutes } from './config.js';
import { ROUTE_TYPES } from './constants.js';

export function resolveRoutes() {
  return defaultRoutes().map((r) => ({
    id: r.id,
    pct: r.pct,
    type: r.type,
    mint: r.mint || config.ansemMint,
    recipient: r.recipient || config.ansemDestWallet,
    note: r.note,
  }));
}

export function validateRoutes(routes) {
  const sum = routes.reduce((s, r) => s + Number(r.pct || 0), 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`routes must sum to 1.0, got ${sum}`);
  }
  return true;
}

export function buildLegs(totalUsd) {
  const routes = resolveRoutes();
  validateRoutes(routes);
  const t = Math.max(0, totalUsd);

  return routes.map((route) => {
    const usd = t * route.pct;
    const base = { id: route.id, type: route.type, usd, pct: route.pct };

    switch (route.type) {
      case ROUTE_TYPES.JUPITER_BUY_SEND:
        return {
          ...base,
          action: 'buy_send_ansem',
          mint: route.mint || config.ansemMint,
          recipient: route.recipient || config.ansemDestWallet,
        };
      case ROUTE_TYPES.JUPITER_BUY_HOLD:
        return {
          ...base,
          action: 'buy_hold',
          mint: route.mint || config.ansemMint,
        };
      case ROUTE_TYPES.SOL_RESERVE:
        return {
          ...base,
          action: 'sol_reserve',
          note: 'keep on operator wallet',
        };
      case ROUTE_TYPES.METEORA_REINVEST:
        return {
          ...base,
          action: 'meteora_reinvest',
          note: 'Phase C — add liquidity via app.meteora.ag with W1',
        };
      default:
        return { ...base, action: route.type, note: route.note || 'unknown' };
    }
  });
}

export function splitFees(totalUsd) {
  const legs = buildLegs(totalUsd);
  const ansemSend =
    legs.find((l) => l.type === ROUTE_TYPES.JUPITER_BUY_SEND)?.usd ?? 0;
  const reserve =
    legs.find((l) => l.type === ROUTE_TYPES.SOL_RESERVE)?.usd ?? 0;
  const reinvest =
    legs.find((l) => l.type === ROUTE_TYPES.METEORA_REINVEST)?.usd ?? 0;
  return { ansemSend, reserve, reinvest, legs, total: Math.max(0, totalUsd) };
}

/** Optional fixed $ cap on ANSEM buy+send; remainder stays as reserve. */
export function applyAnsemSendCap(legs, totalUsd, capUsd = 0) {
  if (!capUsd || capUsd <= 0) return legs;
  const t = Math.max(0, totalUsd);
  const sendUsd = Math.min(capUsd, t);
  const rest = Math.max(0, t - sendUsd);

  return legs.map((leg) => {
    if (leg.type === ROUTE_TYPES.JUPITER_BUY_SEND) {
      return { ...leg, usd: sendUsd, pct: t > 0 ? sendUsd / t : 0 };
    }
    if (leg.type === ROUTE_TYPES.SOL_RESERVE) {
      return { ...leg, usd: rest, pct: t > 0 ? rest / t : 0 };
    }
    return leg;
  });
}

export { ROUTE_TYPES };
