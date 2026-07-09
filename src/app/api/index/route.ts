import { NextRequest, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import {
  ingestAllMapWallets,
  ingestControllerWallet,
  readIndexFromDb,
} from "@/lib/ingest";
import { assertNoSecrets, isLikelyPubkey } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET /api/index — merged pool index; refresh auto-discovers all pool LPs. */
export async function GET(req: NextRequest) {
  try {
    const refresh = req.nextUrl.searchParams.get("refresh") === "1";
    const oneWallet = req.nextUrl.searchParams.get("wallet")?.trim();

    if (hasDatabase() && refresh) {
      if (oneWallet) {
        await ingestControllerWallet(oneWallet);
      } else {
        // Env seeds + on-chain LP discovery across Index pools
        await ingestAllMapWallets();
      }
    }

    let index = await readIndexFromDb();

    if (hasDatabase() && (!index || index.pools.length === 0)) {
      await ingestAllMapWallets();
      index = await readIndexFromDb();
    }

    if (!index) {
      return NextResponse.json(
        {
          error: "Index DB not ready",
          hint: "Set DATABASE_URL and redeploy",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(index);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/index]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** POST /api/index — force ingest (all LPs auto-discovered, or one wallet). */
export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503 },
      );
    }
    const body = await req.json().catch(() => ({}));
    assertNoSecrets(body);

    const wallet =
      typeof body === "object" &&
      body &&
      "wallet" in body &&
      typeof (body as { wallet?: string }).wallet === "string"
        ? (body as { wallet: string }).wallet.trim()
        : "";

    if (wallet && !isLikelyPubkey(wallet)) {
      return NextResponse.json(
        { error: "wallet must be a Solana pubkey" },
        { status: 400 },
      );
    }

    const result = wallet
      ? await ingestControllerWallet(wallet)
      : await ingestAllMapWallets();
    const index = await readIndexFromDb();
    return NextResponse.json({
      ok: true,
      ...("wallets" in result
        ? {
            wallets: result.wallets,
            poolsUpserted: result.poolsUpserted,
            positionsSeen: result.positionsSeen,
            ...("discovered" in result
              ? { discovered: result.discovered }
              : {}),
          }
        : {
            poolsUpserted: result.poolsUpserted,
            positionsSeen: result.positionsSeen,
          }),
      index,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/index POST]", message);
    const status = message.startsWith("Rejected secret") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
