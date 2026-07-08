import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { readFeeDashboard } from "@/lib/fee-ledger";

export const dynamic = "force-dynamic";

/** GET /api/fees — ANSEM 0–70% progress + creator fee ledger. */
export async function GET() {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503 },
      );
    }
    const dash = await readFeeDashboard();
    if (!dash) {
      return NextResponse.json(
        { error: "Fee ledger not ready" },
        { status: 503 },
      );
    }
    return NextResponse.json(dash);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/fees]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
