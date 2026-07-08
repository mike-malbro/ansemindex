import { ANSEM_MINT, PRIMARY_WALLET, TRACKED_WALLETS } from "./config";
import {
  ensureMigrated,
  getPrimaryProject,
  hasDatabase,
  query,
  queryOne,
} from "./db";
import { enrichPositions } from "./dexscreener";
import { getOpenPositions, positionValueUsd, unclaimedFeesUsd } from "./meteora";
import type {
  EnrichedPosition,
  IndexPayload,
  IndexPoolRow,
  PortfolioPayload,
} from "./types";

export type { IndexPayload, IndexPoolRow };

function splitAmounts(p: EnrichedPosition) {
  const d = p.current_position?.current_deposits;
  const ansemIsY = p.token_y.address === ANSEM_MINT;
  return {
    token_amount: ansemIsY ? (d?.amount_x ?? 0) : (d?.amount_y ?? 0),
    ansem_amount: ansemIsY ? (d?.amount_y ?? 0) : (d?.amount_x ?? 0),
    token_usd: ansemIsY ? (d?.amount_x_usd ?? 0) : (d?.amount_y_usd ?? 0),
    ansem_usd: ansemIsY ? (d?.amount_y_usd ?? 0) : (d?.amount_x_usd ?? 0),
  };
}

/** Pull controller wallet open positions → upsert pools + snapshots. */
export async function ingestControllerWallet(
  wallet = PRIMARY_WALLET,
): Promise<{
  poolsUpserted: number;
  positionsSeen: number;
  portfolio: PortfolioPayload;
}> {
  await ensureMigrated();
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL not configured");
  }

  const project = await getPrimaryProject();
  if (!project) throw new Error("No project row — run migrations");

  const run = await queryOne<{ id: string }>(
    `INSERT INTO ingest_runs (project_id, wallet, status)
     VALUES ($1, $2, 'running') RETURNING id`,
    [project.id, wallet],
  );

  try {
    const open = await getOpenPositions(wallet);
    const enriched = await enrichPositions(open.positions, ANSEM_MINT);
    const seenPools = new Set<string>();
    let upserted = 0;

    for (const p of enriched) {
      const amounts = splitAmounts(p);
      const poolRow = await queryOne<{ id: string }>(
        `INSERT INTO pools (
           project_id, pool_address, pool_name, token_mint, token_symbol,
           ansem_mint, base_fee_pct, source, status, last_seen_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'controller','open', now())
         ON CONFLICT (project_id, pool_address) DO UPDATE SET
           pool_name = EXCLUDED.pool_name,
           token_mint = EXCLUDED.token_mint,
           token_symbol = EXCLUDED.token_symbol,
           base_fee_pct = EXCLUDED.base_fee_pct,
           status = 'open',
           last_seen_at = now()
         RETURNING id`,
        [
          project.id,
          p.pool_address,
          p.pool_name || `${p.ticker}-ANSEM`,
          p.constituent_token.address,
          p.ticker,
          ANSEM_MINT,
          p.pool_config?.base_fee_pct ?? null,
        ],
      );
      if (!poolRow) continue;
      seenPools.add(p.pool_address);
      upserted += 1;

      await query(
        `INSERT INTO pool_snapshots (
           pool_id, controller_wallet, position_address,
           position_value_usd, unclaimed_fees_usd,
           token_amount, ansem_amount, token_usd, ansem_usd,
           pool_tvl_usd, volume_24h_usd, price_change_24h, market_cap_usd, raw
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          poolRow.id,
          wallet,
          p.position_address,
          positionValueUsd(p),
          unclaimedFeesUsd(p),
          amounts.token_amount,
          amounts.ansem_amount,
          amounts.token_usd,
          amounts.ansem_usd,
          null,
          p.volume_24h ?? null,
          p.price_change_24h ?? null,
          p.market_cap ?? null,
          JSON.stringify({
            ticker: p.ticker,
            image_url: p.image_url,
            pool_config: p.pool_config,
          }),
        ],
      );
    }

    // Mark pools not seen this run as closed (still in history)
    if (seenPools.size > 0) {
      await query(
        `UPDATE pools SET status = 'closed'
         WHERE project_id = $1 AND source = 'controller' AND status = 'open'
           AND pool_address <> ALL($2::text[])`,
        [project.id, [...seenPools]],
      );
    }

    // Ensure controller wallet row
    await query(
      `INSERT INTO controller_wallets (project_id, address, label, sort_order)
       VALUES ($1, $2, 'wallet(0)', 0)
       ON CONFLICT (project_id, address) DO UPDATE SET active = true`,
      [project.id, wallet],
    );

    await query(
      `UPDATE ingest_runs SET status = 'ok', pools_upserted = $2,
         positions_seen = $3, finished_at = now() WHERE id = $1`,
      [run!.id, upserted, enriched.length],
    );

    const portfolio: PortfolioPayload = {
      wallet,
      ansem_mint: ANSEM_MINT,
      fetched_at: new Date().toISOString(),
      total_positions: open.total_positions ?? enriched.length,
      total_pools: open.total_pools ?? seenPools.size,
      sol_price: open.sol_price,
      totals: open.total,
      positions: enriched,
    };

    return {
      poolsUpserted: upserted,
      positionsSeen: enriched.length,
      portfolio,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await query(
      `UPDATE ingest_runs SET status = 'error', error = $2, finished_at = now()
       WHERE id = $1`,
      [run!.id, message],
    );
    throw e;
  }
}

/** Read latest index snapshot from DB (falls back to empty). */
export async function readIndexFromDb(): Promise<IndexPayload | null> {
  if (!hasDatabase()) return null;
  await ensureMigrated();

  const project = await getPrimaryProject();
  if (!project) return null;

  const wallets = await query<{
    address: string;
    label: string;
    sort_order: number;
  }>(
    `SELECT address, label, sort_order FROM controller_wallets
     WHERE project_id = $1 AND active = true
     ORDER BY sort_order ASC`,
    [project.id],
  );

  const wallet0 = wallets[0]?.address ?? PRIMARY_WALLET;

  const pools = await query<IndexPoolRow>(
    `SELECT
       p.id AS pool_id,
       p.pool_address,
       p.pool_name,
       p.token_mint,
       p.token_symbol,
       p.ansem_mint,
       p.base_fee_pct::float8 AS base_fee_pct,
       p.status,
       p.last_seen_at::text AS last_seen_at,
       COALESCE(s.position_value_usd, 0)::float8 AS position_value_usd,
       COALESCE(s.unclaimed_fees_usd, 0)::float8 AS unclaimed_fees_usd,
       COALESCE(s.token_amount, 0)::float8 AS token_amount,
       COALESCE(s.ansem_amount, 0)::float8 AS ansem_amount,
       COALESCE(s.token_usd, 0)::float8 AS token_usd,
       COALESCE(s.ansem_usd, 0)::float8 AS ansem_usd,
       s.pool_tvl_usd::float8 AS pool_tvl_usd,
       s.volume_24h_usd::float8 AS volume_24h_usd,
       s.price_change_24h::float8 AS price_change_24h,
       s.market_cap_usd::float8 AS market_cap_usd,
       s.position_address,
       COALESCE(s.controller_wallet, $2) AS controller_wallet,
       s.snapshot_at::text AS snapshot_at
     FROM pools p
     LEFT JOIN LATERAL (
       SELECT * FROM pool_snapshots ps
       WHERE ps.pool_id = p.id
       ORDER BY ps.snapshot_at DESC
       LIMIT 1
     ) s ON true
     WHERE p.project_id = $1 AND p.status = 'open'
     ORDER BY COALESCE(s.position_value_usd, 0) DESC`,
    [project.id, wallet0],
  );

  const lastIngest = await queryOne<{ finished_at: string }>(
    `SELECT finished_at::text FROM ingest_runs
     WHERE project_id = $1 AND status = 'ok'
     ORDER BY finished_at DESC NULLS LAST LIMIT 1`,
    [project.id],
  );

  const total_position_usd = pools.reduce(
    (s, p) => s + Number(p.position_value_usd || 0),
    0,
  );
  const total_fees_usd = pools.reduce(
    (s, p) => s + Number(p.unclaimed_fees_usd || 0),
    0,
  );

  return {
    source: "db",
    wallet0,
    wallets:
      wallets.length > 0
        ? wallets
        : TRACKED_WALLETS.map((address, i) => ({
            address,
            label: `wallet(${i})`,
            sort_order: i,
          })),
    ansem_mint: project.mint,
    treasury_usd: 0,
    ingested_at: lastIngest?.finished_at ?? null,
    total_pools: pools.length,
    total_position_usd,
    total_fees_usd,
    pools,
  };
}
