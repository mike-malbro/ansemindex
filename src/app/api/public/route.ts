import { NextRequest, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { readIndexFromDb } from "@/lib/ingest";
import {
  INDEX_NAME,
  INDEX_TICKER,
  ANSEM_MINT,
  INDEX_TOKEN_MINT,
  INDEX_POOL_ADDRESS,
  INDEX_POOL_PAIR,
  INDEX_POOL_LIVE,
  INDEX_POOL_METEORA_URL,
  DEXSCREENER_INDEX_URL,
} from "@/lib/config";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

/**
 * GET /api/public — open pool list for third parties.
 * CORS * · no auth · read-only snapshot from the ledger.
 *
 * Query:
 *   format=json (default) | csv
 *   limit=N (optional, max 500)
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503, headers: CORS },
      );
    }

    const index = await readIndexFromDb();
    if (!index || index.pools.length === 0) {
      return NextResponse.json(
        {
          error: "Index empty",
          hint: "Trigger ingest via GET /api/index?refresh=1 on the hub",
        },
        { status: 503, headers: CORS },
      );
    }

    const format = (req.nextUrl.searchParams.get("format") ?? "json").toLowerCase();
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? 0);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 500)
        : index.pools.length;

    const pools = index.pools.slice(0, limit).map((p, i) => ({
      rank: i + 1,
      pool: `${p.token_symbol}-ANSEM`,
      token_symbol: p.token_symbol,
      pool_address: p.pool_address,
      token_mint: p.token_mint,
      share_pct: p.share_pct,
      market_cap_usd: p.market_cap_usd,
      position_value_usd: p.position_value_usd,
      fees_generated_usd: p.fees_generated_usd,
      claimed_fees_usd: p.claimed_fees_usd,
      compounded_fees_usd: p.compounded_fees_usd,
      unclaimed_fees_usd: p.unclaimed_fees_usd,
      pool_tvl_usd: p.pool_tvl_usd,
      volume_24h_usd: p.volume_24h_usd,
      price_change_24h: p.price_change_24h,
      meteora_url: `https://app.meteora.ag/pools/${p.pool_address}`,
      dexscreener_url: `https://dexscreener.com/solana/${p.token_mint}`,
    }));

    if (format === "csv") {
      const headers = [
        "rank",
        "pool",
        "token_symbol",
        "pool_address",
        "token_mint",
        "share_pct",
        "market_cap_usd",
        "position_value_usd",
        "fees_generated_usd",
        "pool_tvl_usd",
        "meteora_url",
        "dexscreener_url",
      ];
      const lines = [
        headers.join(","),
        ...pools.map((p) =>
          [
            p.rank,
            p.pool,
            p.token_symbol,
            p.pool_address,
            p.token_mint,
            p.share_pct,
            p.market_cap_usd ?? "",
            p.position_value_usd,
            p.fees_generated_usd,
            p.pool_tvl_usd ?? "",
            p.meteora_url,
            p.dexscreener_url,
          ].join(","),
        ),
      ];
      return new NextResponse("\uFEFF" + lines.join("\n"), {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `inline; filename="${INDEX_TICKER.replace("$", "")}-public.csv"`,
        },
      });
    }

    return NextResponse.json(
      {
        name: INDEX_NAME,
        ticker: INDEX_TICKER,
        ansem_mint: ANSEM_MINT,
        /** Key market: $ANSEMLP–ANSEM (empty until live). */
        index_pool: {
          pair: INDEX_POOL_PAIR,
          live: INDEX_POOL_LIVE,
          token_mint: INDEX_TOKEN_MINT || null,
          pool_address: INDEX_POOL_ADDRESS || null,
          meteora_url: INDEX_POOL_METEORA_URL || null,
          dexscreener_url: DEXSCREENER_INDEX_URL,
        },
        generated_at: new Date().toISOString(),
        ingested_at: index.ingested_at,
        total_pools: index.total_pools,
        total_position_usd: index.total_position_usd,
        total_fees_generated_usd: index.total_fees_generated_usd,
        docs: {
          json: "/api/public",
          csv: "/api/public?format=csv",
          full_index: "/api/index",
        },
        pools,
      },
      { headers: CORS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/public]", message);
    return NextResponse.json(
      { error: message },
      { status: 502, headers: CORS },
    );
  }
}
