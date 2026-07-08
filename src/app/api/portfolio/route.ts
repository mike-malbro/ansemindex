import { NextRequest, NextResponse } from "next/server";
import { PRIMARY_WALLET } from "@/lib/config";
import { buildPortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const wallet =
      req.nextUrl.searchParams.get("wallet")?.trim() || PRIMARY_WALLET;
    const portfolio = await buildPortfolio(wallet);
    return NextResponse.json(portfolio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/portfolio]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
