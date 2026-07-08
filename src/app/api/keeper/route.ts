import { NextResponse } from "next/server";
import { PRIMARY_WALLET, ANSEM_MINT } from "@/lib/config";
import { hasDatabase } from "@/lib/db";
import { persistKeeperTick } from "@/lib/fee-ledger";
import { buildPortfolio } from "@/lib/portfolio";
import { planFeeClaims } from "@/lib/keeper";
import { assertNoSecrets } from "@/lib/security";

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

async function maybePersist(tick: Record<string, unknown>) {
  if (!hasDatabase()) return null;
  try {
    return await persistKeeperTick(tick);
  } catch (e) {
    console.error("[api/keeper] persist failed", e);
    return null;
  }
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
    assertNoSecrets(body);
    const action = (body as { action?: string }).action || "tick";

    if (action === "doctor" || action === "state") {
      const remote = await tryKeeperHttp("/api/state");
      if (remote) return NextResponse.json({ source: "keeper", ...remote.json });
      return GET();
    }

    // Persist a tick payload from the keeper service (or manual)
    if (action === "persist") {
      const tick =
        (body as { tick?: Record<string, unknown> }).tick ||
        (body as Record<string, unknown>);
      const result = await maybePersist(tick);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "tick") {
      const remote = await tryKeeperHttp("/api/tick", { method: "POST" });
      if (remote) {
        await maybePersist(remote.json as Record<string, unknown>);
        return NextResponse.json({ source: "keeper", ...remote.json });
      }

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

      const tick = {
        source: "hub_dry_plan",
        dry_run: true,
        live: false,
        started: new Date().toISOString(),
        finished: new Date().toISOString(),
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
      };

      const persisted = await maybePersist(tick);
      return NextResponse.json({ ...tick, persisted });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "action failed";
    const status = message.startsWith("Rejected secret") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
