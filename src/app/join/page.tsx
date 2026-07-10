import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  INDEX_TICKER,
  DEXSCREENER_INDEX_URL,
  INDEX_POOL_LIVE,
} from "@/lib/config";
import {
  EXPLAIN_JOIN,
  JOIN_STEPS,
  JOIN_SECURITY,
  INFLUENCE_LEADER,
  NODE_REPO_HINT,
  HUB_PUBLIC_API,
  INDEX_OWN_POOL,
} from "@/lib/join";
import { shortCa, solscanAccount } from "@/lib/format";

export const metadata = {
  title: `Join · ${INDEX_TICKER}`,
  description: EXPLAIN_JOIN.body,
};

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black font-mono text-white">
      <SiteNav tone="black" />
      <main className="w-full flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400">
          {INDEX_TICKER} · join
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {EXPLAIN_JOIN.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {EXPLAIN_JOIN.body}
        </p>

        <section className="mt-8 max-w-2xl border border-white/10 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Key market
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {INDEX_OWN_POOL.pair}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {INDEX_OWN_POOL.note}
          </p>
          {INDEX_POOL_LIVE && INDEX_OWN_POOL.meteoraUrl ? (
            <a
              href={INDEX_OWN_POOL.meteoraUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[11px] text-zinc-300 underline decoration-white/20 hover:text-white"
            >
              Open on Meteora →
            </a>
          ) : (
            <p className="mt-3 text-[10px] text-zinc-600">
              Set{" "}
              <code className="text-zinc-500">
                NEXT_PUBLIC_INDEX_TOKEN_MINT
              </code>{" "}
              +{" "}
              <code className="text-zinc-500">
                NEXT_PUBLIC_INDEX_POOL_ADDRESS
              </code>{" "}
              when the pair is live.
            </p>
          )}
        </section>

        <ol className="mt-10 max-w-2xl space-y-6">
          {JOIN_STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/20 text-xs text-zinc-300">
                {s.n}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">{s.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-12 max-w-2xl border-t border-white/10 pt-8">
          <h2 className="text-sm font-semibold text-white">Influence</h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {INFLUENCE_LEADER.label}’s node ({shortCa(INFLUENCE_LEADER.lp)}) is
            the influence leader for the public index — reference sizing only.
            Other nodes deposit and sign independently.
          </p>
          <a
            href={solscanAccount(INFLUENCE_LEADER.lp)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[11px] text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Leader LP on Solscan →
          </a>
        </section>

        <section className="mt-10 max-w-2xl border-t border-white/10 pt-8">
          <h2 className="text-sm font-semibold text-white">Public API</h2>
          <pre className="mt-3 overflow-x-auto border border-white/10 bg-black p-3 text-[11px] text-zinc-400">
            {`curl ${HUB_PUBLIC_API}
curl ${HUB_PUBLIC_API}?format=csv`}
          </pre>
          <p className="mt-2 text-[11px] text-zinc-600">
            CORS open · no auth · pool list for third parties and nodes.
          </p>
        </section>

        <section className="mt-10 max-w-2xl border-t border-white/10 pt-8">
          <h2 className="text-sm font-semibold text-white">Security</h2>
          <ul className="mt-3 space-y-2">
            {JOIN_SECURITY.map((b) => (
              <li
                key={b}
                className="border-l border-white/15 pl-3 text-[11px] leading-relaxed text-zinc-500"
              >
                {b}
              </li>
            ))}
          </ul>
          <Link
            href="/whitepaper#data"
            className="mt-3 inline-block text-[11px] text-zinc-400 underline decoration-white/20 hover:text-white"
          >
            SECURITY.md / DATA.md →
          </Link>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href={DEXSCREENER_INDEX_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:border-white/50"
          >
            DexScreener
            <span className="ml-1 text-[10px] text-zinc-600">(placeholder)</span>
          </a>
          <a
            href={NODE_REPO_HINT}
            target="_blank"
            rel="noreferrer"
            className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:border-white/50"
          >
            Node repo →
          </a>
          <Link
            href="/nodes"
            className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:border-white/50"
          >
            Nodes →
          </Link>
          <Link
            href="/book"
            className="border border-white/20 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/50 hover:text-white"
          >
            Index →
          </Link>
        </div>
      </main>
      <SiteFooter tone="black" />
    </div>
  );
}
