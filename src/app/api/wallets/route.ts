import { NextRequest, NextResponse } from "next/server";
import {
  ensureMigrated,
  getPrimaryProject,
  hasDatabase,
  query,
} from "@/lib/db";
import { mapWalletLabel, TRACKED_WALLETS } from "@/lib/config";
import type { TopWalletRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallets?limit=10
 * Top wallets by Index LP value (from latest pool snapshots).
 */
export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503 },
      );
    }
    await ensureMigrated();
    const project = await getPrimaryProject();
    if (!project) {
      return NextResponse.json({ error: "No project" }, { status: 503 });
    }

    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.floor(limitRaw), 1), 100)
      : 50;

    type Agg = {
      address: string;
      pools: number;
      position_usd: number;
      unclaimed_fees_usd: number;
      claimed_fees_usd: number;
    };

    const rows = await query<Agg>(
      `WITH latest AS (
         SELECT DISTINCT ON (ps.pool_id, ps.controller_wallet)
           ps.controller_wallet AS address,
           ps.position_value_usd,
           ps.unclaimed_fees_usd,
           ps.claimed_fees_usd
         FROM pool_snapshots ps
         INNER JOIN pools p ON p.id = ps.pool_id
         WHERE p.project_id = $1 AND p.status = 'open'
         ORDER BY ps.pool_id, ps.controller_wallet, ps.snapshot_at DESC
       )
       SELECT
         address,
         COUNT(*)::int AS pools,
         COALESCE(SUM(position_value_usd), 0)::float8 AS position_usd,
         COALESCE(SUM(unclaimed_fees_usd), 0)::float8 AS unclaimed_fees_usd,
         COALESCE(SUM(claimed_fees_usd), 0)::float8 AS claimed_fees_usd
       FROM latest
       WHERE address IS NOT NULL AND address <> ''
       GROUP BY address
       ORDER BY COALESCE(SUM(position_value_usd), 0) DESC
       LIMIT $2`,
      [project.id, limit],
    );

    const labels = await query<{
      address: string;
      label: string;
      sort_order: number;
    }>(
      `SELECT address, label, sort_order FROM controller_wallets
       WHERE project_id = $1 AND active = true`,
      [project.id],
    );
    const labelBy = new Map(labels.map((l) => [l.address.toLowerCase(), l]));

    const total = rows.reduce((s, r) => s + Number(r.position_usd || 0), 0);

    const wallets: TopWalletRow[] = rows.map((r, i) => {
      const known = labelBy.get(r.address.toLowerCase());
      const trackedIdx = TRACKED_WALLETS.findIndex(
        (w) => w.toLowerCase() === r.address.toLowerCase(),
      );
      const label =
        known?.label ||
        (trackedIdx >= 0
          ? mapWalletLabel(trackedIdx, r.address)
          : "wallet");
      const position_usd = Number(r.position_usd) || 0;
      return {
        rank: i + 1,
        address: r.address,
        label,
        pools: Number(r.pools) || 0,
        position_usd,
        index_pct: total > 0 ? (position_usd / total) * 100 : 0,
        unclaimed_fees_usd: Number(r.unclaimed_fees_usd) || 0,
        claimed_fees_usd: Number(r.claimed_fees_usd) || 0,
      };
    });

    return NextResponse.json({
      total_index_usd: total,
      wallets,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/wallets]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
