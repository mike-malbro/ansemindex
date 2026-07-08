import { Connection, PublicKey } from '@solana/web3.js';
import { CpAmm, getUnClaimLpFee } from '@meteora-ag/cp-amm-sdk';
import { config } from '../config.js';
import { ANSEM_MINT, METEORA_DAMM_V2_API, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '../constants.js';

function bnToUi(raw, decimals) {
  return Number(raw.toString()) / 10 ** decimals;
}

async function resolveTokenProgram(conn, mint) {
  const info = await conn.getAccountInfo(mint, 'confirmed');
  if (info?.owner.equals(new PublicKey(TOKEN_2022_PROGRAM_ID))) {
    return new PublicKey(TOKEN_2022_PROGRAM_ID);
  }
  return new PublicKey(TOKEN_PROGRAM_ID);
}

async function mintDecimals(conn, mint) {
  const supply = await conn.getTokenSupply(mint, 'confirmed');
  return supply.value.decimals;
}

/**
 * List open DAMM v2 positions for a wallet via public datapi (no key).
 */
export async function listOpenPositions(wallet = config.lpWallet) {
  const url = `${METEORA_DAMM_V2_API}/wallets/${wallet}/open_positions`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'ansem-index-keeper/0.1' },
  });
  if (!res.ok) throw new Error(`Meteora positions ${res.status}`);
  const raw = await res.json();
  const data = raw.data ?? [];
  // API may return flat positions or grouped-by-pool
  if (data.length && data[0]?.positions) {
    return data.flatMap((g) =>
      g.positions.map((p) => ({
        ...p,
        pool_address: p.pool_address || g.pool_address,
      })),
    );
  }
  return data;
}

export function createMeteoraAdapter() {
  const conn = new Connection(config.rpcUrl, 'confirmed');
  const amm = new CpAmm(conn);
  const ansemMint = new PublicKey(config.ansemMint || ANSEM_MINT);

  async function readUnclaimedUsd(positionAddress) {
    try {
      const positionState = await amm.fetchPositionState(new PublicKey(positionAddress));
      const poolState = await amm.fetchPoolState(positionState.pool);
      const [decA, decB] = await Promise.all([
        mintDecimals(conn, poolState.tokenAMint),
        mintDecimals(conn, poolState.tokenBMint),
      ]);
      const fees = getUnClaimLpFee(poolState, positionState);
      // Prefer API USD when available; here we only return raw token amounts
      return {
        feeTokenA: bnToUi(fees.feeTokenA, decA),
        feeTokenB: bnToUi(fees.feeTokenB, decB),
        tokenAMint: poolState.tokenAMint.toBase58(),
        tokenBMint: poolState.tokenBMint.toBase58(),
        hasAnsem:
          poolState.tokenAMint.equals(ansemMint) || poolState.tokenBMint.equals(ansemMint),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  async function buildClaimFeesTx(positionAddress, owner) {
    try {
      const pos = await amm.fetchPositionState(new PublicKey(positionAddress));
      const pool = pos.pool;
      const ownerPk = new PublicKey(owner);
      const poolState = await amm.fetchPoolState(pool);
      const positions = await amm.getUserPositionByPool(pool, ownerPk);
      const match = positions.find((p) => p.position.toBase58() === positionAddress);

      if (!match) {
        return {
          status: 'ERROR',
          error: 'Position not owned by LP wallet — verify LP_WALLET owns this position',
        };
      }

      const fees = getUnClaimLpFee(poolState, match.positionState);
      const hasFees = fees.feeTokenA.gtn(0) || fees.feeTokenB.gtn(0);
      if (!hasFees) {
        return { status: 'SKIP', error: 'No unclaimed fees on position' };
      }

      const [tokenAProgram, tokenBProgram] = await Promise.all([
        resolveTokenProgram(conn, poolState.tokenAMint),
        resolveTokenProgram(conn, poolState.tokenBMint),
      ]);

      const tx = await amm.claimPositionFee2({
        owner: ownerPk,
        position: match.position,
        pool,
        positionNftAccount: match.positionNftAccount,
        tokenAMint: poolState.tokenAMint,
        tokenBMint: poolState.tokenBMint,
        tokenAVault: poolState.tokenAVault,
        tokenBVault: poolState.tokenBVault,
        tokenAProgram,
        tokenBProgram,
        receiver: ownerPk,
        feePayer: ownerPk,
      });

      if (!tx?.instructions?.length) {
        return { status: 'ERROR', error: 'Claim tx has no instructions' };
      }

      const { blockhash } = await conn.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = ownerPk;

      return {
        status: 'READY',
        serialized: tx
          .serialize({ requireAllSignatures: false, verifySignatures: false })
          .toString('base64'),
        pool: pool.toBase58(),
        position: positionAddress,
      };
    } catch (e) {
      return { status: 'ERROR', error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Scaffold for add-liquidity — returns NOT_IMPLEMENTED with guidance.
   * Manual add via app.meteora.ag with W1 (LP wallet) for launch.
   */
  async function buildAddLiquidityTx() {
    return {
      status: 'NOT_IMPLEMENTED',
      error:
        'Add liquidity: open app.meteora.ag with LP_WALLET (W1), deposit into TOKEN-ANSEM pool, then positions auto-appear in the terminal.',
    };
  }

  return { readUnclaimedUsd, buildClaimFeesTx, buildAddLiquidityTx, amm, conn };
}
