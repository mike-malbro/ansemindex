import { NextResponse } from "next/server";
import { PRIMARY_WALLET, ANSEM_MINT } from "@/lib/config";
import { buildPortfolio } from "@/lib/portfolio";
import { planFeeClaims } from "@/lib/keeper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEEPER_URL = process.env.KEEPER_URL;

async function tryKeeperHttp(pathname: string, init?: RequestInit) {
  if (!KEEPER_URL) return null;
  const res = await fetch(`${KEEPER_URL}${pathname}`, {
    ...init,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

export async function GET() {
  try {
    const remote = await tryKeeperHttp("/api/state");
    if (remote) {
      return NextResponse.json({ source: "keeper", ...remote.json });
    }

    return NextResponse.json({
      source: "hub",
      config: {
        lpWallet: process.env.LP_WALLET || PRIMARY_WALLET,
        operatorWallet: process.env.OPERATOR_WALLET || null,
        ansemDestWallet: process.env.ANSEM_DEST_WALLET || null,
        ansemMint: process.env.ANSEM_MINT || ANSEM_MINT,
        dryRun: true,
        live: false,
        feeSplit: {
          ansemSend: Number(process.env.FEE_SPLIT_ANSEM_SEND ?? 0.7),
          reserve: Number(process.env.FEE_SPLIT_RESERVE ?? 0.3),
        },
        note: "Keeper not linked (set KEEPER_URL). Hub dry-plans only — no signing.",
      },
      lastTick: null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "state failed" },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "tick";

    if (action === "doctor" || action === "state") {
      const remote = await tryKeeperHttp("/api/state");
      if (remote) return NextResponse.json({ source: "keeper", ...remote.json });
      return GET();
    }

    if (action === "tick") {
      const remote = await tryKeeperHttp("/api/tick", { method: "POST" });
      if (remote) {
        return NextResponse.json({ source: "keeper", ...remote.json });
      }

      // In-process dry plan (no child_process, no keys)
      const portfolio = await buildPortfolio(
        process.env.LP_WALLET || PRIMARY_WALLET,
      );
      const claimPlan = planFeeClaims(
        portfolio.positions.map((p) => ({
          position_address: p.position_address,
          pool_address: p.pool_address,
          unclaimed_fees_usd: p.unclaimed_fees_usd,
        })),
      );
      const fees = portfolio.totals.unclaimed_fees;
      const ansemPct = Number(process.env.FEE_SPLIT_ANSEM_SEND ?? 0.7);
      const reservePct = Number(process.env.FEE_SPLIT_RESERVE ?? 0.3);

      return NextResponse.json({
        source: "hub_dry_plan",
        dry_run: true,
        note: "Hub simulated tick. Deploy keeper/ + set KEEPER_URL for real claim/buy/send.",
        wallets: {
          lp: process.env.LP_WALLET || PRIMARY_WALLET,
          operator: process.env.OPERATOR_WALLET || null,
          ansem_dest: process.env.ANSEM_DEST_WALLET || null,
        },
        claimable_fees_usd: fees,
        claim: claimPlan,
        plan: {
          status: fees > 0 ? "ready" : "skip",
          totalUsd: fees,
          legs: [
            {
              id: "ansem_send",
              type: "jupiter_buy_send",
              usd: fees * ansemPct,
              pct: ansemPct,
              action: "buy_send_ansem",
              mint: ANSEM_MINT,
              recipient: process.env.ANSEM_DEST_WALLET || null,
            },
            {
              id: "reserve",
              type: "sol_reserve",
              usd: fees * reservePct,
              pct: reservePct,
              action: "sol_reserve",
            },
          ],
        },
        totals: portfolio.totals,
        positions: portfolio.total_positions,
      });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "action failed" },
      { status: 502 },
    );
  }
}
