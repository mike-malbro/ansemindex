import { NextRequest, NextResponse } from "next/server";
import {
  getPool,
  getPoolOhlcv,
  getPoolVolumeHistory,
} from "@/lib/meteora";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ address: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { address } = await ctx.params;
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const resolution =
      req.nextUrl.searchParams.get("resolution") ?? "1h";
    const now = Math.floor(Date.now() / 1000);
    const from = now - 7 * 24 * 60 * 60;

    const [pool, ohlcv, volume] = await Promise.all([
      getPool(address).catch((e) => ({ error: String(e) })),
      getPoolOhlcv(address, { resolution, from, to: now }).catch((e) => ({
        error: String(e),
        data: [],
      })),
      getPoolVolumeHistory(address).catch((e) => ({
        error: String(e),
        data: [],
      })),
    ]);

    return NextResponse.json({
      address,
      pool,
      ohlcv,
      volume,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/pool]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
