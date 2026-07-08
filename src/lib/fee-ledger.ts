/**
 * Fee ledger — index ANSEM 0–70% snapshots, keeper ticks, fee events, creator sends.
 * Postgres stores pubkeys + amounts + sigs only.
 */

import { ANSEM_TARGET_PCT } from "./thesis";
import {
  ensureMigrated,
  getPrimaryProject,
  hasDatabase,
  query,
  queryOne,
} from "./db";

export type IndexSnapshotRow = {
  id: string;
  source: string;
  total_position_usd: number;
  total_ansem_usd: number;
  ansem_pct: number;
  total_unclaimed_fees_usd: number;
  total_claimed_fees_usd: number;
  pool_count: number;
  gate_phase: string;
  snapshot_at: string;
};

export type CreatorFeeSendRow = {
  id: string;
  recipient: string;
  mint: string;
  amount_ui: number;
  usd: number;
  swap_tx: string | null;
  transfer_tx: string | null;
  dry_run: boolean;
  status: string;
  sent_at: string;
};

export type FeeEventRow = {
  id: string;
  event_type: string;
  status: string;
  pool_address: string | null;
  mint: string | null;
  usd: number | null;
  recipient: string | null;
  tx_signature: string | null;
  occurred_at: string;
};

export type FeeDashboard = {
  target_pct: number;
  latest: IndexSnapshotRow | null;
  history: IndexSnapshotRow[];
  cumulative_creator_sends_usd: number;
  recent_sends: CreatorFeeSendRow[];
  recent_events: FeeEventRow[];
  recent_ticks: number;
};

function gatePhase(ansemPct: number): "build" | "buybacks" {
  return ansemPct >= ANSEM_TARGET_PCT ? "buybacks" : "build";
}

/** After ingest: write index-level ANSEM % snapshot from latest pool snapshots. */
export async function writeIndexSnapshotFromDb(
  source = "ingest",
): Promise<IndexSnapshotRow | null> {
  if (!hasDatabase()) return null;
  await ensureMigrated();
  const project = await getPrimaryProject();
  if (!project) return null;

  const agg = await queryOne<{
    total_position_usd: number;
    total_ansem_usd: number;
    total_unclaimed_fees_usd: number;
    total_claimed_fees_usd: number;
    pool_count: number;
  }>(
    `WITH latest AS (
       SELECT DISTINCT ON (ps.pool_id, ps.controller_wallet)
         ps.pool_id,
         ps.position_value_usd,
         ps.ansem_usd,
         ps.unclaimed_fees_usd,
         ps.claimed_fees_usd
       FROM pool_snapshots ps
       JOIN pools p ON p.id = ps.pool_id
       WHERE p.project_id = $1 AND p.status = 'open'
       ORDER BY ps.pool_id, ps.controller_wallet, ps.snapshot_at DESC
     ),
     by_pool AS (
       SELECT
         pool_id,
         SUM(position_value_usd)::float8 AS position_value_usd,
         SUM(ansem_usd)::float8 AS ansem_usd,
         SUM(unclaimed_fees_usd)::float8 AS unclaimed_fees_usd,
         SUM(claimed_fees_usd)::float8 AS claimed_fees_usd
       FROM latest
       GROUP BY pool_id
     )
     SELECT
       COALESCE(SUM(position_value_usd), 0)::float8 AS total_position_usd,
       COALESCE(SUM(ansem_usd), 0)::float8 AS total_ansem_usd,
       COALESCE(SUM(unclaimed_fees_usd), 0)::float8 AS total_unclaimed_fees_usd,
       COALESCE(SUM(claimed_fees_usd), 0)::float8 AS total_claimed_fees_usd,
       COUNT(*)::int AS pool_count
     FROM by_pool`,
    [project.id],
  );

  if (!agg) return null;

  const totalPos = Number(agg.total_position_usd) || 0;
  const totalAnsem = Number(agg.total_ansem_usd) || 0;
  const ansemPct = totalPos > 0 ? totalAnsem / totalPos : 0;
  const phase = gatePhase(ansemPct);

  const row = await queryOne<IndexSnapshotRow>(
    `INSERT INTO index_snapshots (
       project_id, source,
       total_position_usd, total_ansem_usd, ansem_pct,
       total_unclaimed_fees_usd, total_claimed_fees_usd,
       pool_count, gate_phase
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING
       id::text, source,
       total_position_usd::float8, total_ansem_usd::float8, ansem_pct::float8,
       total_unclaimed_fees_usd::float8, total_claimed_fees_usd::float8,
       pool_count, gate_phase, snapshot_at::text`,
    [
      project.id,
      source,
      totalPos,
      totalAnsem,
      ansemPct,
      Number(agg.total_unclaimed_fees_usd) || 0,
      Number(agg.total_claimed_fees_usd) || 0,
      Number(agg.pool_count) || 0,
      phase,
    ],
  );

  return row;
}

type TickLike = {
  dry_run?: boolean;
  live?: boolean;
  started?: string;
  finished?: string;
  wallets?: {
    lp?: string | null;
    operator?: string | null;
    ansem_dest?: string | null;
  };
  claimable_fees_usd?: number;
  claimed_usd?: number;
  route_budget_usd?: number;
  sol_usd?: number;
  plan?: {
    status?: string;
    totalUsd?: number;
    legs?: Array<Record<string, unknown>>;
  };
  claim?: {
    claims?: Array<Record<string, unknown>>;
  };
  claims?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

/** Persist a keeper (or hub dry) tick + fee events + creator sends. */
export async function persistKeeperTick(
  tick: TickLike,
): Promise<{ tickId: string | null }> {
  if (!hasDatabase()) return { tickId: null };
  await ensureMigrated();
  const project = await getPrimaryProject();
  if (!project) return { tickId: null };

  const dry = tick.dry_run !== false && tick.live !== true;
  const wallets = tick.wallets || {};
  const plan = tick.plan || {};
  const claimable = Number(tick.claimable_fees_usd) || 0;
  const claimed = Number(tick.claimed_usd) || 0;
  const budget = Number(tick.route_budget_usd) || Number(plan.totalUsd) || 0;

  const tickRow = await queryOne<{ id: string }>(
    `INSERT INTO keeper_ticks (
       project_id, started_at, finished_at, dry_run, live,
       lp_wallet, operator_wallet, ansem_dest_wallet,
       claimable_fees_usd, claimed_usd, route_budget_usd,
       plan_status, plan_total_usd, sol_usd, raw
     ) VALUES (
       $1,
       COALESCE($2::timestamptz, now()),
       COALESCE($3::timestamptz, now()),
       $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
     ) RETURNING id::text`,
    [
      project.id,
      tick.started || null,
      tick.finished || null,
      dry,
      Boolean(tick.live),
      wallets.lp || null,
      wallets.operator || null,
      wallets.ansem_dest || null,
      claimable,
      claimed,
      budget,
      plan.status || null,
      Number(plan.totalUsd) || 0,
      tick.sol_usd != null ? Number(tick.sol_usd) : null,
      JSON.stringify(tick),
    ],
  );

  const tickId = tickRow?.id ?? null;
  if (!tickId) return { tickId: null };

  const status = dry ? "dry_run" : "live";
  const claims =
    tick.claims ||
    tick.claim?.claims ||
    (Array.isArray((tick.claim as { items?: unknown })?.items)
      ? ((tick.claim as { items: Array<Record<string, unknown>> }).items)
      : []);

  for (const c of claims) {
    await query(
      `INSERT INTO fee_events (
         project_id, tick_id, event_type, status,
         position_address, pool_address, usd, tx_signature, error, raw
       ) VALUES ($1,$2,'claim_fees',$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        project.id,
        tickId,
        String(c.status || status),
        (c.position as string) || (c.position_address as string) || null,
        (c.pool as string) || (c.pool_address as string) || null,
        Number(c.feesUsd ?? c.usd ?? 0) || null,
        (c.sig as string) || (c.tx_signature as string) || null,
        (c.error as string) || null,
        JSON.stringify(c),
      ],
    );
  }

  for (const leg of plan.legs || []) {
    const type = String(leg.type || leg.action || "leg");
    const eventType =
      type === "jupiter_buy_send" || type === "buy_send_ansem"
        ? "ansem_send"
        : type === "sol_reserve"
          ? "sol_reserve"
          : type === "jupiter_buy_hold"
            ? "jupiter_buy"
            : type === "meteora_reinvest"
              ? "meteora_reinvest"
              : type;

    const event = await queryOne<{ id: string }>(
      `INSERT INTO fee_events (
         project_id, tick_id, event_type, status,
         mint, usd, recipient, tx_signature, related_tx_signature, leg_id, raw
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       RETURNING id::text`,
      [
        project.id,
        tickId,
        eventType,
        status,
        (leg.mint as string) || null,
        Number(leg.usd) || null,
        (leg.recipient as string) || wallets.ansem_dest || null,
        (leg.sendSig as string) || (leg.sig as string) || null,
        (leg.swapSig as string) || null,
        (leg.id as string) || null,
        JSON.stringify(leg),
      ],
    );

    if (eventType === "ansem_send" && event) {
      const recipient =
        (leg.recipient as string) || wallets.ansem_dest || "unknown";
      await query(
        `INSERT INTO creator_fee_sends (
           project_id, tick_id, fee_event_id, recipient, mint,
           amount_ui, usd, swap_tx, transfer_tx, dry_run, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          project.id,
          tickId,
          event.id,
          recipient,
          (leg.mint as string) || process.env.ANSEM_MINT || "ANSEM",
          Number(leg.amount) || 0,
          Number(leg.usd) || 0,
          (leg.swapSig as string) || null,
          (leg.sendSig as string) || (leg.sig as string) || null,
          dry,
          status,
        ],
      );
    }
  }

  // Also snapshot index after a tick
  await writeIndexSnapshotFromDb(dry ? "keeper_dry" : "keeper_tick");

  return { tickId };
}

export async function readFeeDashboard(): Promise<FeeDashboard | null> {
  if (!hasDatabase()) return null;
  await ensureMigrated();
  const project = await getPrimaryProject();
  if (!project) return null;

  const history = await query<IndexSnapshotRow>(
    `SELECT
       id::text, source,
       total_position_usd::float8, total_ansem_usd::float8, ansem_pct::float8,
       total_unclaimed_fees_usd::float8, total_claimed_fees_usd::float8,
       pool_count, gate_phase, snapshot_at::text
     FROM index_snapshots
     WHERE project_id = $1
     ORDER BY snapshot_at DESC
     LIMIT 48`,
    [project.id],
  );

  const recent_sends = await query<CreatorFeeSendRow>(
    `SELECT
       id::text, recipient, mint,
       amount_ui::float8, usd::float8,
       swap_tx, transfer_tx, dry_run, status, sent_at::text
     FROM creator_fee_sends
     WHERE project_id = $1
     ORDER BY sent_at DESC
     LIMIT 40`,
    [project.id],
  );

  const recent_events = await query<FeeEventRow>(
    `SELECT
       id::text, event_type, status,
       pool_address, mint, usd::float8, recipient, tx_signature,
       occurred_at::text
     FROM fee_events
     WHERE project_id = $1
     ORDER BY occurred_at DESC
     LIMIT 50`,
    [project.id],
  );

  const cum = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(usd), 0)::float8 AS total
     FROM creator_fee_sends
     WHERE project_id = $1 AND status IN ('live', 'dry_run', 'ok', 'pending')`,
    [project.id],
  );

  const ticks = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM keeper_ticks WHERE project_id = $1`,
    [project.id],
  );

  return {
    target_pct: ANSEM_TARGET_PCT,
    latest: history[0] ?? null,
    history,
    cumulative_creator_sends_usd: Number(cum?.total) || 0,
    recent_sends,
    recent_events,
    recent_ticks: Number(ticks?.n) || 0,
  };
}

/** Cumulative live creator sends for treasury display. */
export async function readTreasuryUsd(): Promise<number> {
  if (!hasDatabase()) return 0;
  await ensureMigrated();
  const project = await getPrimaryProject();
  if (!project) return 0;
  const row = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(usd), 0)::float8 AS total
     FROM creator_fee_sends
     WHERE project_id = $1 AND dry_run = false AND status = 'live'`,
    [project.id],
  );
  return Number(row?.total) || 0;
}
