import { NextRequest, NextResponse } from "next/server";
import { PRIMARY_WALLET, TRACKED_WALLETS } from "@/lib/config";
import { ensureMigrated, hasDatabase, queryOne } from "@/lib/db";
import { rankTokenHolders } from "@/lib/holders";

export const dynamic = "force-dynamic";

/**
 * GET /api/pool/[address]/holders
 * Ranks largest holders of the pool's constituent token (not LP NFTs —
 * Meteora datapi does not expose a pool LP list).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await ctx.params;
    const mintParam = req.nextUrl.searchParams.get("mint")?.trim();

    let mint = mintParam;
    let tokenSymbol: string | null = null;

    if (!mint && hasDatabase()) {
      await ensureMigrated();
      const row = await queryOne<{ token_mint: string; token_symbol: string }>(
        `SELECT token_mint, token_symbol FROM pools WHERE pool_address = $1 LIMIT 1`,
        [address],
      );
      if (row) {
        mint = row.token_mint;
        tokenSymbol = row.token_symbol;
      }
    }

    if (!mint) {
      return NextResponse.json(
        { error: "mint required (or pool must be ingested)" },
        { status: 400 },
      );
    }

    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.floor(limitRaw), 1), 25)
      : 10;

    const holders = await rankTokenHolders(mint, {
      controllerWallets: TRACKED_WALLETS.length
        ? TRACKED_WALLETS
        : [PRIMARY_WALLET],
      limit,
    });

    return NextResponse.json({
      pool_address: address,
      mint,
      token_symbol: tokenSymbol,
      note: "Top 10 token holders (SPL largest accounts). Click a row for their index pie.",
      holders,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/pool/holders]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
