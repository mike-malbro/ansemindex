import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";
import { ANSEM_TARGET_PCT, ROADMAP_PHASES } from "@/lib/thesis";

export const metadata = {
  title: `Roadmap · ${INDEX_TICKER}`,
  description: `${INDEX_NAME}: Manual → Flywheel → ML watch → Continue.`,
};

export default function RoadmapPage() {
  const pct = Math.round(ANSEM_TARGET_PCT * 100);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/90">
          {INDEX_TICKER} roadmap
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Manual → ML → continue
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          First we run it by hand — you steer, the bot follows the book. Then
          we load ML (see-microtrader) to watch the DEX for new fee entries.
          Same flywheel to {pct}% ANSEM. The process continues.
        </p>

        <ol className="mt-10 space-y-4">
          {ROADMAP_PHASES.map((p) => (
            <li
              key={p.id}
              className={`rounded border px-4 py-4 ${
                p.status === "now"
                  ? "border-emerald-800/50 bg-emerald-950/15"
                  : p.status === "next"
                    ? "border-emerald-900/30 bg-zinc-900/40"
                    : "border-zinc-800 bg-zinc-900/20"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {p.phase}. {p.title}
                </h2>
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    p.status === "now"
                      ? "text-emerald-300"
                      : p.status === "next"
                        ? "text-emerald-400/70"
                        : "text-zinc-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{p.outcome}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {p.detail}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-xs text-zinc-500">
          Live:{" "}
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
            href="/whitepaper#flywheel"
            className="text-emerald-400 hover:underline"
          >
            Fee chart
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
