import Link from "next/link";
import {
  NODE_MIN_USD,
  PART1_FLOW,
  PARTS,
  START_LIST,
  WHITEPAPER_TITLE,
  WHITEPAPER_VERSION,
  startListFloorUsd,
} from "@/lib/whitepaper";

export const metadata = {
  title: `${WHITEPAPER_TITLE} · ANSEM INDEX`,
  description:
    "Creator fees buy ANSEM, fund dual-sided pools, seed every start-list node, then add to winners.",
};

export default function WhitepaperPage() {
  const floor = startListFloorUsd();

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 font-mono text-zinc-100">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            {WHITEPAPER_VERSION}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {WHITEPAPER_TITLE}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Part 1 is the flywheel. Creator fees buy ANSEM, fund dual-sided
            pools, put a minimum in every node, then add more to winners.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            Terminal
          </Link>
          <Link
            href="/manage"
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            Manage
          </Link>
        </div>
      </div>

      {/* Part nav */}
      <nav className="mb-10 space-y-2 border-b border-zinc-800 pb-6">
        {PARTS.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="block rounded border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 transition hover:border-zinc-600"
          >
            <div className="text-xs font-semibold text-zinc-200">
              {p.label}
              {"stub" in p && p.stub ? (
                <span className="ml-2 text-[10px] font-normal text-zinc-600">
                  stub
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{p.blurb}</div>
          </a>
        ))}
      </nav>

      {/* PART 1 */}
      <section id="part-1" className="scroll-mt-8 space-y-8">
        <header>
          <h2 className="text-lg font-semibold text-zinc-100">
            Part 1 — The flow
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            This is the launch roadmap in one loop.
          </p>
        </header>

        {/* Flow diagram */}
        <div className="overflow-x-auto rounded border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex min-w-[640px] items-stretch gap-2 text-center text-[10px]">
            {[
              "Creator fees",
              "Buy ANSEM",
              "Dual-sided pools",
              `$${NODE_MIN_USD} / node`,
              "Scale winners",
            ].map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className="flex-1 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-3 text-amber-100/90">
                  {label}
                </div>
                {i < 4 && (
                  <span className="shrink-0 text-zinc-600" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <ol className="space-y-4">
          {PART1_FLOW.map((step) => (
            <li
              key={step.id}
              className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4"
            >
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-300">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Start list */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">
              Start list — nodes to seed
            </h3>
            <p className="text-[11px] text-zinc-500">
              Floor ≈ ${floor.toFixed(0)} · ${NODE_MIN_USD} min each ·{" "}
              {START_LIST.length} nodes
            </p>
          </div>
          <p className="text-[11px] text-zinc-500">
            Edit{" "}
            <code className="text-zinc-400">src/lib/whitepaper.ts</code>{" "}
            → <code className="text-zinc-400">START_LIST</code>. Launch puts
            the minimum in every node first; winners get topped up after.
          </p>
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2 text-right">Min USD</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {START_LIST.map((n, i) => (
                  <tr
                    key={`${n.ticker}-${i}`}
                    className="border-t border-zinc-800/80"
                  >
                    <td className="px-3 py-2 text-zinc-600">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-zinc-100">
                      {n.ticker}
                      <span className="text-zinc-600">–ANSEM</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                      ${n.minUsd}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {n.status ?? "queued"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border border-dashed border-zinc-700 bg-zinc-900/20 px-4 py-3 text-[11px] text-zinc-400">
          <strong className="text-zinc-300">Launch rule:</strong> one dollar
          here, one dollar there — hit the minimum on every start-list node
          (dual-sided). Only then route incremental fees into winners.
        </div>
      </section>

      {/* PART 2 stub */}
      <section id="part-2" className="mt-14 scroll-mt-8 border-t border-zinc-800 pt-8">
        <h2 className="text-lg font-semibold text-zinc-100">
          Part 2 — Wallets & custody
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Stub. W1 LP claims · W2 operator buys & sends · ANSEM dest receives
          creator-fee ANSEM. See{" "}
          <Link href="/manage" className="text-sky-400 hover:underline">
            Manage
          </Link>
          .
        </p>
      </section>

      {/* PART 3 stub */}
      <section id="part-3" className="mt-10 scroll-mt-8 border-t border-zinc-800 pt-8 pb-16">
        <h2 className="text-lg font-semibold text-zinc-100">
          Part 3 — Index token
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Stub. Memecoin that buys the index — after the fee → pool loop is
          live and nodes are seeded.
        </p>
      </section>
    </div>
  );
}
