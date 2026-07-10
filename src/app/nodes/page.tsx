import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { INDEX_TICKER, INDEX_NAME } from "@/lib/config";
import {
  INFLUENCE_LEADER,
  NODE_REPO_HINT,
  HUB_PUBLIC_API,
  JOIN_STEPS,
} from "@/lib/join";
import { EXPLAIN_NODES } from "@/lib/thesis";
import { shortCa, solscanAccount } from "@/lib/format";

export const metadata = {
  title: `Nodes · ${INDEX_TICKER}`,
  description: EXPLAIN_NODES.body,
};

export default function NodesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black font-mono text-white">
      <SiteNav tone="black" />
      <main className="w-full flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400">
          {INDEX_TICKER} · nodes
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {EXPLAIN_NODES.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {EXPLAIN_NODES.body}
        </p>

        <div className="mt-10 max-w-2xl border border-white/10 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Influence leader
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {INFLUENCE_LEADER.label}
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Cell <code className="text-zinc-400">{INFLUENCE_LEADER.cellId}</code>
            · role {INFLUENCE_LEADER.role}. Reference book for the public index
            — not shared custody.
          </p>
          <a
            href={solscanAccount(INFLUENCE_LEADER.lp)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-mono text-[11px] text-zinc-400 hover:text-white"
          >
            {shortCa(INFLUENCE_LEADER.lp, 6, 6)} → Solscan
          </a>
        </div>

        <section className="mt-12 max-w-2xl">
          <h2 className="text-sm font-semibold text-white">Run your node</h2>
          <ul className="mt-4 space-y-2 text-xs text-zinc-500">
            <li className="border-l border-white/15 pl-3">
              Local: <code className="text-zinc-400">pnpm doctor && pnpm dry</code>
            </li>
            <li className="border-l border-white/15 pl-3">
              Railway: deploy{" "}
              <code className="text-zinc-400">packages/ansem-node</code> (or the
              published node repo) with secrets only.
            </li>
            <li className="border-l border-white/15 pl-3">
              Pull list:{" "}
              <code className="text-zinc-400">pnpm index</code> → {HUB_PUBLIC_API}
            </li>
          </ul>
          <ol className="mt-6 space-y-2">
            {JOIN_STEPS.map((s) => (
              <li key={s.n} className="text-[11px] text-zinc-500">
                <span className="text-zinc-300">{s.n}.</span> {s.title}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href={NODE_REPO_HINT}
            target="_blank"
            rel="noreferrer"
            className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:border-white/50"
          >
            Publish / clone node →
          </a>
          <Link
            href="/join"
            className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:border-white/50"
          >
            Join guide →
          </Link>
          <Link
            href="/manage"
            className="border border-white/20 px-4 py-2.5 text-sm text-zinc-400 transition hover:border-white/50 hover:text-white"
          >
            Operator desk →
          </Link>
        </div>

        <p className="mt-8 max-w-2xl text-[10px] text-zinc-600">
          {INDEX_NAME}: nodes are optional. Viewing the index never requires a
          node. Registry tables ship later — today the contract is the public
          API + this publishable package.
        </p>
      </main>
      <SiteFooter tone="black" />
    </div>
  );
}
