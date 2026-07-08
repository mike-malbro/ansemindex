import { NextRequest, NextResponse } from "next/server";
import { ANSEM_MINT } from "@/lib/config";
import { ensureMigrated, hasDatabase, query } from "@/lib/db";
import { getWalletTokenBalances } from "@/lib/holders";
import { readIndexFromDb } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/holder/[wallet]
 * Token balances for a wallet across index mints — for holder pie drill-down.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ wallet: string }> },
) {
  try {
    const { wallet } = await ctx.params;
    if (!wallet || wallet.length < 32) {
      return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
    }

    let indexMints: { mint: string; symbol: string; priceUsd: number | null }[] =
      [];

    if (hasDatabase()) {
      await ensureMigrated();
      const rows = await query<{
        token_mint: string;
        token_symbol: string;
        token_usd: string | null;
        token_amount: string | null;
      }>(
        `SELECT
           p.token_mint, p.token_symbol,
           s.token_usd::text, s.token_amount::text
         FROM pools p
         LEFT JOIN LATERAL (
           SELECT token_usd, token_amount FROM pool_snapshots ps
           WHERE ps.pool_id = p.id
           ORDER BY ps.snapshot_at DESC LIMIT 1
         ) s ON true
         WHERE p.status = 'open'`,
      );
      indexMints = rows.map((r) => {
        const tokAmt = Number(r.token_amount || 0);
        const tokUsd = Number(r.token_usd || 0);
        return {
          mint: r.token_mint,
          symbol: r.token_symbol,
          priceUsd: tokAmt > 0 ? tokUsd / tokAmt : null,
        };
      });
    } else {
      const index = await readIndexFromDb();
      if (index) {
        indexMints = index.pools.map((p) => ({
          mint: p.token_mint,
          symbol: p.token_symbol,
          priceUsd:
            p.token_amount > 0 ? p.token_usd / p.token_amount : null,
        }));
      }
    }

    const mintList = [
      ...indexMints.map((m) => m.mint),
      ANSEM_MINT,
    ];
    const symbolByMint = new Map(
      indexMints.map((m) => [m.mint.toLowerCase(), m.symbol]),
    );
    symbolByMint.set(ANSEM_MINT.toLowerCase(), "ANSEM");
    const priceByMint = new Map(
      indexMints.map((m) => [m.mint.toLowerCase(), m.priceUsd]),
    );

    const balances = await getWalletTokenBalances(wallet, { mints: mintList });

    const holdings = balances.map((b) => {
      const price = priceByMint.get(b.mint.toLowerCase()) ?? null;
      const valueUsd =
        price != null && Number.isFinite(price) ? b.amountUi * price : null;
      return {
        mint: b.mint,
        symbol: symbolByMint.get(b.mint.toLowerCase()) ?? shortSym(b.mint),
        amountUi: b.amountUi,
        valueUsd,
        priceUsd: price,
      };
    });

    // Prefer USD for pie; fall back to amount share among priced tokens
    const withUsd = holdings.filter((h) => h.valueUsd != null && h.valueUsd > 0);
    const pieSource =
      withUsd.length > 0
        ? withUsd.map((h) => ({
            id: h.mint,
            label: h.symbol,
            value: h.valueUsd!,
          }))
        : holdings
            .filter((h) => h.amountUi > 0)
            .map((h) => ({
              id: h.mint,
              label: h.symbol,
              value: h.amountUi,
            }));

    return NextResponse.json({
      wallet,
      holdings,
      pie: pieSource,
      note:
        withUsd.length > 0
          ? "Allocation by estimated USD (index token prices from LP book)."
          : "Allocation by token amount (no USD price for these mints).",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/holder]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function shortSym(mint: string) {
  return mint.slice(0, 4);
}
