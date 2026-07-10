import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { INDEX_NAME, INDEX_TICKER, INDEX_POOL_PAIR } from "@/lib/config";
import { ANSEM_TARGET_PCT } from "@/lib/thesis";

export const metadata = {
  title: `FAQ · ${INDEX_TICKER}`,
  description: `FAQ for ${INDEX_NAME} — ticker ${INDEX_TICKER}, ${INDEX_POOL_PAIR} pool, creator fees.`,
};

const FAQS = [
  {
    q: `What is ${INDEX_NAME}?`,
    a: `${INDEX_NAME} (ticker ${INDEX_TICKER}) is the public list of Meteora DAMM v2 TOKEN–ANSEM pools. The index is the pool book — not a wallet list.`,
  },
  {
    q: `What is ${INDEX_TICKER}?`,
    a: `${INDEX_TICKER} is the index token. Its home market is ${INDEX_POOL_PAIR} — buy and LP there when live. Other Index pools still quote ANSEM as the pair asset.`,
  },
  {
    q: `What is the ${INDEX_POOL_PAIR} pool?`,
    a: `The key market for the product: ${INDEX_TICKER} paired with ANSEM on Meteora DAMM v2. When live it sits in the Index list like any other TOKEN–ANSEM pool, and DexScreener / join point at it.`,
  },
  {
    q: "Where do creator fees come from?",
    a: `${INDEX_TICKER} creator fees — when live — buy ANSEM toward the ${Math.round(ANSEM_TARGET_PCT * 100)}% gate, then buybacks. Today those fees are $0 until the fee path is live. This is not “ANSEM token creator fees buy the index.”`,
  },
  {
    q: "What is the Wallet tab?",
    a: "Paste any Solana pubkey to see index-token holdings and open TOKEN–ANSEM LP positions. Pubkeys only — never private keys.",
  },
  {
    q: "Does this hub hold keys?",
    a: "No. Postgres stores pubkeys, pools, and fee ledger rows only. Signing stays on a private keeper or your own wallet.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/90">
          {INDEX_TICKER}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{INDEX_NAME} FAQ</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Short answers. Deeper detail in the{" "}
          <Link href="/whitepaper" className="text-emerald-400 hover:underline">
            whitepaper
          </Link>
          .
        </p>
        <ul className="mt-10 space-y-6">
          {FAQS.map((f) => (
            <li
              key={f.q}
              className="border-b border-zinc-800 pb-6 last:border-b-0"
            >
              <h2 className="text-sm font-semibold text-zinc-100">{f.q}</h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {f.a}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-zinc-500">
          <Link href="/book" className="text-emerald-400 hover:underline">
            Index
          </Link>
          {" · "}
          <Link
            href="/book?tab=creator"
            className="text-emerald-400 hover:underline"
          >
            Creator fees
          </Link>
          {" · "}
          <Link
            href="/book?tab=wallet"
            className="text-emerald-400 hover:underline"
          >
            Wallet
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
