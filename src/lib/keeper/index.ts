/**
 * Keeper scaffold — INERT by default.
 *
 * Phase 2: claim fees / open pairs via @meteora-ag/cp-amm-sdk.
 * Without KEEPER_SECRET_KEY (or with KEEPER_DRY_RUN=true) this module
 * only simulates and logs. No transactions are signed or sent.
 */

export type KeeperAction =
  | { type: "claim_fees"; position: string; pool: string; fees_usd: number }
  | {
      type: "open_pair";
      token_mint: string;
      ansem_mint: string;
      note: string;
    }
  | { type: "rebalance"; position: string; note: string };

export type KeeperPlan = {
  dry_run: boolean;
  has_key: boolean;
  wallet?: string;
  planned_at: string;
  actions: KeeperAction[];
  notes: string[];
};

export function isDryRun(): boolean {
  if (process.env.KEEPER_DRY_RUN === "false" && process.env.KEEPER_SECRET_KEY) {
    return false;
  }
  return true;
}

export function hasKeeperKey(): boolean {
  return Boolean(process.env.KEEPER_SECRET_KEY?.trim());
}

/**
 * Build a preview of what the keeper *would* do given current portfolio fees.
 * Does not touch the chain.
 */
export function planFeeClaims(
  positions: Array<{
    position_address: string;
    pool_address: string;
    unclaimed_fees_usd: number;
  }>,
  minFeeUsd = 0.01,
  opts?: { dry_run?: boolean; has_key?: boolean },
): KeeperPlan {
  // Client preview always dry-runs; server can pass real flags later.
  const dry = opts?.dry_run ?? true;
  const keyed = opts?.has_key ?? false;
  const actions: KeeperAction[] = positions
    .filter((p) => (p.unclaimed_fees_usd ?? 0) >= minFeeUsd)
    .map((p) => ({
      type: "claim_fees" as const,
      position: p.position_address,
      pool: p.pool_address,
      fees_usd: p.unclaimed_fees_usd,
    }));

  const notes: string[] = [];
  if (!keyed) {
    notes.push("KEEPER_SECRET_KEY not set — preview only, no signing.");
  }
  if (dry) {
    notes.push("DRY_RUN active — claimPositionFee will not be submitted.");
  }
  notes.push(
    "Wire @meteora-ag/cp-amm-sdk claimPositionFee when keys are available.",
  );

  return {
    dry_run: dry,
    has_key: keyed,
    planned_at: new Date().toISOString(),
    actions,
    notes,
  };
}

/**
 * Placeholder for future createCustomPool / open-pair flow.
 */
export function planOpenPair(
  tokenMint: string,
  ansemMint: string,
): KeeperPlan {
  return {
    dry_run: isDryRun(),
    has_key: hasKeeperKey(),
    planned_at: new Date().toISOString(),
    actions: [
      {
        type: "open_pair",
        token_mint: tokenMint,
        ansem_mint: ansemMint,
        note: "Scaffold only — createCustomPool not wired.",
      },
    ],
    notes: [
      "Opening new TOKEN-ANSEM pairs requires KEEPER_SECRET_KEY + capital.",
      "Use DAMM v2 createCustomPool when ready.",
    ],
  };
}

export async function executePlan(plan: KeeperPlan): Promise<{
  ok: boolean;
  executed: number;
  message: string;
}> {
  if (plan.dry_run || !plan.has_key) {
    return {
      ok: true,
      executed: 0,
      message: `Dry-run: would execute ${plan.actions.length} action(s).`,
    };
  }
  // Live path intentionally not implemented until keys + SDK wiring.
  return {
    ok: false,
    executed: 0,
    message: "Live keeper execution not enabled yet.",
  };
}
