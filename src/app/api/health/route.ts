import { NextResponse } from "next/server";
import { ensureMigrated, hasDatabase, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "ok" | "missing" | "error" = "missing";
  let pools: number | null = null;

  if (hasDatabase()) {
    try {
      await ensureMigrated();
      const row = await queryOne<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM pools WHERE status = 'open'`,
      );
      pools = Number(row?.c ?? 0);
      db = "ok";
    } catch {
      db = "error";
    }
  }

  return NextResponse.json({
    ok: true,
    service: "ansem-index",
    db,
    open_pools: pools,
    ts: new Date().toISOString(),
  });
}
