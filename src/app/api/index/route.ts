import { NextRequest, NextResponse } from "next/server";
import { PRIMARY_WALLET } from "@/lib/config";
import { hasDatabase } from "@/lib/db";
import { ingestControllerWallet, readIndexFromDb } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/index — live index from DB (controller wallet book). */
export async function GET(req: NextRequest) {
  try {
    const refresh = req.nextUrl.searchParams.get("refresh") === "1";

    if (refresh && hasDatabase()) {
      await ingestControllerWallet(
        req.nextUrl.searchParams.get("wallet")?.trim() || PRIMARY_WALLET,
      );
    }

    let index = await readIndexFromDb();

    // Cold start: ingest once if DB empty
    if (hasDatabase() && (!index || index.pools.length === 0)) {
      await ingestControllerWallet(PRIMARY_WALLET);
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

/** POST /api/index — force ingest from controller wallet. */
export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503 },
      );
    }
    const body = (await req.json().catch(() => ({}))) as { wallet?: string };
    const result = await ingestControllerWallet(
      body.wallet?.trim() || PRIMARY_WALLET,
    );
    const index = await readIndexFromDb();
    return NextResponse.json({
      ok: true,
      poolsUpserted: result.poolsUpserted,
      positionsSeen: result.positionsSeen,
      index,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/index POST]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
