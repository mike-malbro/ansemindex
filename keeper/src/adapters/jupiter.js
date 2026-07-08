import { config } from '../config.js';
import { WSOL_MINT } from '../constants.js';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const MAX_PRICE_IMPACT_PCT = Number(process.env.MAX_PRICE_IMPACT_PCT || 2);
const OPERATOR_FEE_RESERVE_LAMPORTS = 5_000_000;

export function createJupiterAdapter() {
  async function getQuote(inputMint, outputMint, amount) {
    const url = new URL(JUPITER_QUOTE_API);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', String(Math.floor(amount)));
    url.searchParams.set('slippageBps', String(config.slippageBps));

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Jupiter quote failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return {
      inputMint: data.inputMint,
      outputMint: data.outputMint,
      inAmount: Number(data.inAmount),
      outAmount: Number(data.outAmount),
      priceImpactPct: Number(data.priceImpactPct ?? 0),
      raw: data,
    };
  }

  async function buildSwapTx(quoteResponse, userPublicKey) {
    try {
      const res = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteResponse.raw ?? quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });
      if (!res.ok) {
        return { status: 'ERROR', error: `Jupiter swap build failed: ${res.status}` };
      }
      const data = await res.json();
      if (!data.swapTransaction) {
        return { status: 'ERROR', error: 'Jupiter returned no swapTransaction' };
      }
      return { status: 'READY', serialized: data.swapTransaction };
    } catch (e) {
      return { status: 'ERROR', error: e instanceof Error ? e.message : String(e) };
    }
  }

  async function swapSolForToken(usdAmount, outputMint, solUsd, ownerPubkey, maxLamports = null) {
    if (!solUsd || solUsd <= 0) {
      return { status: 'ERROR', error: 'SOL price unavailable — cannot size swap' };
    }
    let lamports = Math.floor((usdAmount / solUsd) * 1e9);
    if (maxLamports != null) {
      lamports = Math.min(lamports, Math.max(0, maxLamports - OPERATOR_FEE_RESERVE_LAMPORTS));
    }
    if (lamports <= 0) return { status: 'SKIP', reason: 'amount too small after balance cap' };

    const quote = await getQuote(WSOL_MINT, outputMint, lamports);
    if (quote.priceImpactPct > MAX_PRICE_IMPACT_PCT) {
      return {
        status: 'ERROR',
        error: `price impact ${quote.priceImpactPct.toFixed(2)}% exceeds max ${MAX_PRICE_IMPACT_PCT}%`,
        quote,
      };
    }
    const swap = await buildSwapTx(quote, ownerPubkey);
    return { ...swap, quote, lamports, quoteRaw: quote.raw };
  }

  return { getQuote, buildSwapTx, swapSolForToken, MAX_PRICE_IMPACT_PCT };
}
