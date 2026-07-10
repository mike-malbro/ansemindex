import {
  ANSEM_MINT,
  INDEX_TOKEN_SYMBOL,
  PRIMARY_WALLET,
  TRACKED_WALLETS,
  mapWalletLabel,
} from "./config";
import {
  ensureMigrated,
  getPrimaryProject,
  hasDatabase,
  query,
  queryOne,
} from "./db";
import { enrichPositions } from "./dexscreener";
import {
  readTreasuryUsd,
  writeIndexSnapshotFromDb,
} from "./fee-ledger";
import {
  COLLECT_FEE_COMPOUNDING,
  feeBreakdownForPosition,
  feeBreakdownFromClaimable,
  sumFeeBreakdowns,
} from "./fees";
import {
  claimedFeesUsd,
  getOpenPositions,
  isAnsemIndexPool,
  positionValueUsd,
  unclaimedFeesUsd,
} from "./meteora";
import { discoverLpWalletsForPools } from "./pool-lps";
import type {
  EnrichedPosition,
  IndexPayload,
  IndexPoolRow,
  MapWalletRow,
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

/** Ingest one map wallet’s open positions (pubkey only). */
export async function ingestControllerWallet(
  wallet: string,
  opts?: {
    sortOrder?: number;
    label?: string;
    closeMissing?: boolean;
    seenUnion?: Set<string>;
  },
): Promise<{
  poolsUpserted: number;
  positionsSeen: number;
  portfolio: PortfolioPayload;
  seenPools: string[];
}> {
  await ensureMigrated();
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL not configured");
  }

  const project = await getPrimaryProject();
  if (!project) throw new Error("No project row — run migrations");

  const trackedIdx = TRACKED_WALLETS.findIndex(
    (w) => w.toLowerCase() === wallet.toLowerCase(),
  );
  const existing = await queryOne<{
    label: string;
    sort_order: number;
  }>(
    `SELECT label, sort_order FROM controller_wallets
     WHERE project_id = $1 AND lower(address) = lower($2)`,
    [project.id, wallet],
  );

  const sortOrder =
    opts?.sortOrder ??
    existing?.sort_order ??
    (trackedIdx >= 0 ? trackedIdx : await nextMapWalletSortOrder(project.id));

  const label =
    opts?.label ??
    existing?.label ??
    (trackedIdx >= 0
      ? mapWalletLabel(trackedIdx, wallet)
      : `map(${sortOrder})`);

  const run = await queryOne<{ id: string }>(
    `INSERT INTO ingest_runs (project_id, wallet, status)
     VALUES ($1, $2, 'running') RETURNING id`,
    [project.id, wallet],
  );

  try {
    const open = await getOpenPositions(wallet);
    // Index = TOKEN–ANSEM DAMM v2 only — ignore other Meteora positions.
    const indexPositions = open.positions.filter((p) =>
      isAnsemIndexPool(p, ANSEM_MINT),
    );
    const enriched = await enrichPositions(indexPositions, ANSEM_MINT);
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
      opts?.seenUnion?.add(p.pool_address);
      upserted += 1;

      await query(
        `INSERT INTO pool_snapshots (
           pool_id, controller_wallet, position_address,
           position_value_usd, unclaimed_fees_usd, claimed_fees_usd,
           token_amount, ansem_amount, token_usd, ansem_usd,
           pool_tvl_usd, volume_24h_usd,
           price_change_5m, price_change_1h, price_change_6h, price_change_24h,
           market_cap_usd, raw
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          poolRow.id,
          wallet,
          p.position_address,
          positionValueUsd(p),
          unclaimedFeesUsd(p),
          claimedFeesUsd(p),
          amounts.token_amount,
          amounts.ansem_amount,
          amounts.token_usd,
          amounts.ansem_usd,
          null,
          p.volume_24h ?? null,
          p.price_change_5m ?? null,
          p.price_change_1h ?? null,
          p.price_change_6h ?? null,
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

    if (opts?.closeMissing && seenPools.size > 0) {
      await query(
        `UPDATE pools SET status = 'closed'
         WHERE project_id = $1 AND source = 'controller' AND status = 'open'
           AND pool_address <> ALL($2::text[])`,
        [project.id, [...seenPools]],
      );
    }

    await query(
      `INSERT INTO controller_wallets (project_id, address, label, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, address) DO UPDATE SET
         active = true,
         label = COALESCE(NULLIF(EXCLUDED.label, ''), controller_wallets.label),
         sort_order = EXCLUDED.sort_order`,
      [project.id, wallet, label, sortOrder],
    );

    await query(
      `UPDATE ingest_runs SET status = 'ok', pools_upserted = $2,
         positions_seen = $3, finished_at = now() WHERE id = $1`,
      [run!.id, upserted, enriched.length],
    );

    const feeSum = sumFeeBreakdowns(
      indexPositions.map((p) => feeBreakdownForPosition(p)),
    );
    const balances = enriched.reduce((s, p) => s + p.position_value_usd, 0);
    const solPrice = open.sol_price || 0;

    const withShare = enriched.filter(
      (p) => (p.share_of_pool_pct ?? 0) > 0 || p.position_value_usd > 0,
    );

    return {
      poolsUpserted: upserted,
      positionsSeen: enriched.length,
      seenPools: [...seenPools],
      portfolio: {
        wallet,
        ansem_mint: ANSEM_MINT,
        fetched_at: new Date().toISOString(),
        total_positions: enriched.length,
        total_pools: seenPools.size,
        pools_with_share: withShare.length,
        avg_pool_share_pct: 0,
        sol_price: solPrice,
        totals: {
          balances,
          unclaimed_fees: feeSum.unclaimed_usd,
          unclaimed_rewards: 0,
          total_deposits: balances,
          pnl: 0,
          pnl_pct_change: 0,
          balances_sol: solPrice > 0 ? balances / solPrice : 0,
          unclaimed_fees_sol:
            solPrice > 0 ? feeSum.unclaimed_usd / solPrice : 0,
          unclaimed_rewards_sol: 0,
          total_deposits_sol: solPrice > 0 ? balances / solPrice : 0,
          pnl_sol: 0,
          pnl_sol_pct_change: 0,
        },
        fee_totals: {
          unclaimed_usd: feeSum.unclaimed_usd,
          claimed_usd: feeSum.claimed_usd,
          compounded_usd: feeSum.compounded_usd,
          generated_usd: feeSum.generated_usd,
          compound_pct: feeSum.compound_pct,
          claim_pct: feeSum.claim_pct,
        },
        positions: enriched,
      },
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

async function nextMapWalletSortOrder(projectId: string): Promise<number> {
  const row = await queryOne<{ n: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS n
     FROM controller_wallets WHERE project_id = $1`,
    [projectId],
  );
  return Number(row?.n ?? TRACKED_WALLETS.length);
}

async function listActiveMapWallets(projectId: string) {
  return query<{
    address: string;
    label: string;
    sort_order: number;
  }>(
    `SELECT address, label, sort_order FROM controller_wallets
     WHERE project_id = $1 AND active = true
     ORDER BY sort_order ASC`,
    [projectId],
  );
}

/**
 * Ingest every map wallet: env TRACKED_WALLETS, then auto-discover every
 * other LP wallet in those Index pools (on-chain), then ingest them too.
 */
export async function ingestAllMapWallets(): Promise<{
  wallets: string[];
  poolsUpserted: number;
  positionsSeen: number;
  discovered?: number;
}> {
  await ensureMigrated();
  if (!hasDatabase()) throw new Error("DATABASE_URL not configured");

  const project = await getPrimaryProject();
  if (!project) throw new Error("No project row — run migrations");
  const projectId = project.id;

  // Seed env wallets into DB (labels / order).
  for (let i = 0; i < TRACKED_WALLETS.length; i++) {
    const address = TRACKED_WALLETS[i]!;
    await query(
      `INSERT INTO controller_wallets (project_id, address, label, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, address) DO UPDATE SET
         active = true,
         label = EXCLUDED.label,
         sort_order = EXCLUDED.sort_order`,
      [projectId, address, mapWalletLabel(i, address), i],
    );
  }

  const seenUnion = new Set<string>();
  let poolsUpserted = 0;
  let positionsSeen = 0;
  const wallets: string[] = [];

  async function ingestList(
    list: { address: string; label: string; sort_order: number }[],
  ) {
    for (const w of list) {
      if (wallets.some((a) => a.toLowerCase() === w.address.toLowerCase())) {
        continue;
      }
      wallets.push(w.address);
      const result = await ingestControllerWallet(w.address, {
        sortOrder: w.sort_order,
        label: w.label,
        closeMissing: false,
        seenUnion,
      });
      poolsUpserted += result.poolsUpserted;
      positionsSeen += result.positionsSeen;
    }
  }

  // Pass 1 — known map wallets (env + previously discovered)
  await ingestList(await listActiveMapWallets(projectId));

  // Auto-discover LP owners — highest-value pools first, soft deadline so
  // refresh returns before Railway/proxy kills the request. Wallets are
  // registered incrementally so a timeout still keeps what we found.
  const rankedPools = await query<{ pool_address: string }>(
    `WITH latest AS (
       SELECT DISTINCT ON (ps.pool_id)
         p.pool_address,
         ps.position_value_usd
       FROM pool_snapshots ps
       INNER JOIN pools p ON p.id = ps.pool_id
       WHERE p.project_id = $1 AND p.status = 'open'
       ORDER BY ps.pool_id, ps.snapshot_at DESC
     )
     SELECT pool_address
     FROM latest
     ORDER BY position_value_usd DESC NULLS LAST`,
    [projectId],
  );
  const poolAddrs =
    rankedPools.length > 0
      ? rankedPools.map((p) => p.pool_address)
      : seenUnion.size > 0
        ? [...seenUnion]
        : (
            await query<{ pool_address: string }>(
              `SELECT pool_address FROM pools
               WHERE project_id = $1 AND status = 'open'`,
              [projectId],
            )
          ).map((p) => p.pool_address);

  let discovered = 0;
  if (poolAddrs.length > 0) {
    try {
      const known = new Set(wallets.map((a) => a.toLowerCase()));
      const fresh: string[] = [];

      async function registerOwners(owners: string[]) {
        for (const owner of owners) {
          const key = owner.toLowerCase();
          if (known.has(key)) continue;
          known.add(key);
          fresh.push(owner);
          const sortOrder = await nextMapWalletSortOrder(projectId);
          await query(
            `INSERT INTO controller_wallets (project_id, address, label, sort_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (project_id, address) DO UPDATE SET
               active = true`,
            [projectId, owner, `map(${sortOrder})`, sortOrder],
          );
        }
      }

      await discoverLpWalletsForPools(poolAddrs, {
        // Small rolling batches — public RPC only clears ~15 pools/pass.
        // Cursor advances each refresh so the full book gets covered.
        maxPools: 20,
        concurrency: 3,
        deadlineMs: 150_000,
        rolling: true,
        onOwners: registerOwners,
      });

      discovered = fresh.length;
      if (fresh.length > 0) {
        const toIngest = (await listActiveMapWallets(projectId)).filter((w) =>
          fresh.some((a) => a.toLowerCase() === w.address.toLowerCase()),
        );
        await ingestList(toIngest);
      }
    } catch (e) {
      console.warn(
        "[ingest] LP wallet discovery failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  // Close pools not seen by any map wallet this pass
  if (seenUnion.size > 0) {
    await query(
      `UPDATE pools SET status = 'closed'
       WHERE project_id = $1 AND source = 'controller' AND status = 'open'
         AND pool_address <> ALL($2::text[])`,
      [project.id, [...seenUnion]],
    );
  }

  // Index-level ANSEM 0–70% snapshot for fee dashboards
  await writeIndexSnapshotFromDb("ingest");

  return {
    wallets,
    poolsUpserted,
    positionsSeen,
    discovered,
  };
}

/** Read merged index: one row per pool, values summed across map wallets. */
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

  const walletList =
    wallets.length > 0
      ? wallets
      : TRACKED_WALLETS.map((address, i) => ({
          address,
          label: mapWalletLabel(i, address),
          sort_order: i,
        }));

  const wallet0 = walletList[0]?.address ?? PRIMARY_WALLET;

  // Latest snapshot per (pool, map wallet), then sum by pool
  type AggRow = {
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
    map_wallets: string[];
    snapshot_at: string | null;
  };

  const raw = await query<AggRow>(
    `WITH latest AS (
       SELECT DISTINCT ON (ps.pool_id, ps.controller_wallet)
         ps.pool_id,
         ps.controller_wallet,
         ps.position_address,
         ps.position_value_usd,
         ps.unclaimed_fees_usd,
         ps.claimed_fees_usd,
         ps.token_amount,
         ps.ansem_amount,
         ps.token_usd,
         ps.ansem_usd,
         ps.pool_tvl_usd,
         ps.volume_24h_usd,
         ps.price_change_5m,
         ps.price_change_1h,
         ps.price_change_6h,
         ps.price_change_24h,
         ps.market_cap_usd,
         ps.snapshot_at
       FROM pool_snapshots ps
       ORDER BY ps.pool_id, ps.controller_wallet, ps.snapshot_at DESC
     )
     SELECT
       p.id AS pool_id,
       p.pool_address,
       p.pool_name,
       p.token_mint,
       p.token_symbol,
       p.ansem_mint,
       p.base_fee_pct::float8 AS base_fee_pct,
       p.status,
       p.last_seen_at::text AS last_seen_at,
       COALESCE(SUM(l.position_value_usd), 0)::float8 AS position_value_usd,
       COALESCE(SUM(l.unclaimed_fees_usd), 0)::float8 AS unclaimed_fees_usd,
       COALESCE(SUM(l.claimed_fees_usd), 0)::float8 AS claimed_fees_usd,
       COALESCE(SUM(l.token_amount), 0)::float8 AS token_amount,
       COALESCE(SUM(l.ansem_amount), 0)::float8 AS ansem_amount,
       COALESCE(SUM(l.token_usd), 0)::float8 AS token_usd,
       COALESCE(SUM(l.ansem_usd), 0)::float8 AS ansem_usd,
       MAX(l.pool_tvl_usd)::float8 AS pool_tvl_usd,
       MAX(l.volume_24h_usd)::float8 AS volume_24h_usd,
       MAX(l.price_change_5m)::float8 AS price_change_5m,
       MAX(l.price_change_1h)::float8 AS price_change_1h,
       MAX(l.price_change_6h)::float8 AS price_change_6h,
       MAX(l.price_change_24h)::float8 AS price_change_24h,
       MAX(l.market_cap_usd)::float8 AS market_cap_usd,
       (ARRAY_AGG(l.position_address ORDER BY l.position_value_usd DESC NULLS LAST))[1] AS position_address,
       ARRAY_AGG(DISTINCT l.controller_wallet) FILTER (WHERE l.controller_wallet IS NOT NULL) AS map_wallets,
       MAX(l.snapshot_at)::text AS snapshot_at
     FROM pools p
     LEFT JOIN latest l ON l.pool_id = p.id
     WHERE p.project_id = $1 AND p.status = 'open'
     GROUP BY p.id
     ORDER BY COALESCE(SUM(l.position_value_usd), 0) DESC`,
    [project.id],
  );

  const total_position_usd = raw.reduce(
    (s, p) => s + Number(p.position_value_usd || 0),
    0,
  );
  const pools: IndexPoolRow[] = raw.map((p) => {
    const value = Number(p.position_value_usd || 0);
    // Index pools are 90% compound / 10% claim-in-quote; expand claimable slice.
    const fees = feeBreakdownFromClaimable(
      Number(p.unclaimed_fees_usd || 0),
      Number(p.claimed_fees_usd || 0),
      COLLECT_FEE_COMPOUNDING,
    );
    return {
      pool_id: p.pool_id,
      pool_address: p.pool_address,
      pool_name: p.pool_name,
      token_mint: p.token_mint,
      token_symbol: p.token_symbol,
      ansem_mint: p.ansem_mint,
      base_fee_pct: p.base_fee_pct,
      status: p.status,
      last_seen_at: p.last_seen_at,
      position_value_usd: value,
      unclaimed_fees_usd: fees.unclaimed_usd,
      claimed_fees_usd: fees.claimed_usd,
      compounded_fees_usd: fees.compounded_usd,
      fees_generated_usd: fees.generated_usd,
      token_amount: Number(p.token_amount || 0),
      ansem_amount: Number(p.ansem_amount || 0),
      token_usd: Number(p.token_usd || 0),
      ansem_usd: Number(p.ansem_usd || 0),
      pool_tvl_usd: p.pool_tvl_usd,
      volume_24h_usd: p.volume_24h_usd,
      price_change_5m: p.price_change_5m,
      price_change_1h: p.price_change_1h,
      price_change_6h: p.price_change_6h,
      price_change_24h: p.price_change_24h,
      market_cap_usd: p.market_cap_usd,
      position_address: p.position_address,
      controller_wallet: (p.map_wallets ?? [])[0] ?? wallet0,
      map_wallets: p.map_wallets ?? [],
      share_pct: total_position_usd > 0 ? (value / total_position_usd) * 100 : 0,
      snapshot_at: p.snapshot_at,
    };
  });

  const total_fees_usd = pools.reduce(
    (s, p) => s + Number(p.unclaimed_fees_usd || 0),
    0,
  );
  const total_claimed_fees_usd = pools.reduce(
    (s, p) => s + Number(p.claimed_fees_usd || 0),
    0,
  );
  const total_compounded_fees_usd = pools.reduce(
    (s, p) => s + Number(p.compounded_fees_usd || 0),
    0,
  );
  const total_fees_generated_usd = pools.reduce(
    (s, p) => s + Number(p.fees_generated_usd || 0),
    0,
  );

  const map_wallets: MapWalletRow[] = walletList.map((w) => {
    const mine = pools.filter((p) =>
      (p.map_wallets ?? []).some(
        (a) => a.toLowerCase() === w.address.toLowerCase(),
      ),
    );
    const position_usd = mine.reduce(
      (s, p) => s + Number(p.position_value_usd || 0),
      0,
    );
    // Approximate: attribute full pool value if wallet is in map_wallets
    // (merged row already summed; for map strip we count pools they touch)
    return {
      address: w.address,
      label: w.label,
      sort_order: w.sort_order,
      pools: mine.length,
      position_usd,
      unclaimed_fees_usd: mine.reduce(
        (s, p) => s + Number(p.unclaimed_fees_usd || 0),
        0,
      ),
      claimed_fees_usd: mine.reduce(
        (s, p) => s + Number(p.claimed_fees_usd || 0),
        0,
      ),
      fees_earned_usd: mine.reduce(
        (s, p) => s + Number(p.fees_generated_usd || 0),
        0,
      ),
    };
  });

  const lastIngest = await queryOne<{ finished_at: string }>(
    `SELECT finished_at::text FROM ingest_runs
     WHERE project_id = $1 AND status = 'ok'
     ORDER BY finished_at DESC NULLS LAST LIMIT 1`,
    [project.id],
  );

  const treasury_usd = await readTreasuryUsd();

  return {
    source: "db",
    index_token: INDEX_TOKEN_SYMBOL,
    wallet0,
    wallets: walletList,
    map_wallets,
    /** @deprecated use map_wallets — kept for older clients */
    creators: map_wallets,
    ansem_mint: project.mint,
    treasury_usd,
    ingested_at: lastIngest?.finished_at ?? null,
    total_pools: pools.length,
    total_position_usd,
    total_fees_usd,
    total_claimed_fees_usd,
    total_fees_earned_usd: total_fees_usd + total_claimed_fees_usd,
    total_compounded_fees_usd,
    total_fees_generated_usd,
    pools,
  };
}
