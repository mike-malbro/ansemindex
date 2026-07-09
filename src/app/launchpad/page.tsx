import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { EXPLAIN_LAUNCHPAD } from "@/lib/thesis";

export const metadata = {
  title: "Launchpad · ANSEM INDEX",
  description:
    "ANSEM-based launchpad: mint a memecoin into a TOKEN–ANSEM DAMM v2 pool so it joins the index.",
};

export default function LaunchpadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/launchpad" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">
          Coming next
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {EXPLAIN_LAUNCHPAD.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
          {EXPLAIN_LAUNCHPAD.body}
        </p>
        <ul className="mt-6 space-y-2">
          {EXPLAIN_LAUNCHPAD.bullets.map((b) => (
            <li
              key={b}
              className="border-l-2 border-zinc-700 pl-3 text-xs text-zinc-500"
            >
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded border border-emerald-900/40 bg-emerald-950/15 px-4 py-4 text-xs text-zinc-400">
          <p className="font-semibold text-emerald-100/90">Security</p>
          <p className="mt-2">
            The public hub and Postgres never hold private keys — only pubkeys,
            pool addresses, and reports. Launch signing (when live) stays in
            your wallet or a private keeper, same rule as Perpad: secrets never
            in the DB.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-600"
          >
            Connect wallet to launch (soon)
          </button>
          <Link
            href="/book"
            className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 hover:border-zinc-500"
          >
            View pool index →
          </Link>
          <Link
            href="/whitepaper#launchpad"
            className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 hover:border-zinc-500"
          >
            Whitepaper →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
