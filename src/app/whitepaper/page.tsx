import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  ANSEM_TARGET_PCT,
  BASE_FEE_PCT,
  FEE_CHART,
  PRINCIPLES,
  THESIS,
} from "@/lib/thesis";
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
    "Thesis, fee chart (70% ANSEM then buybacks), and how-to for DAMM v2 TOKEN–ANSEM pools.",
};

export default function WhitepaperPage() {
  const floor = startListFloorUsd();

  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/whitepaper" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          {WHITEPAPER_VERSION} · public guide · no keys
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {WHITEPAPER_TITLE}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          How-to paper. Creator fees buy tokens/ANSEM until{" "}
          {(ANSEM_TARGET_PCT * 100).toFixed(0)}% ANSEM — then all buybacks.
          DAMM v2 at {BASE_FEE_PCT}%.
        </p>

        <nav className="mt-8 space-y-2 border-b border-zinc-800 pb-6">
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

        {/* PART 0 — Thesis */}
        <section id="part-0" className="mt-10 scroll-mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Part 0 — Thesis</h2>
          {[THESIS.why, THESIS.damm, THESIS.onePct, THESIS.adapt].map((t) => (
            <div
              key={t.title}
              className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4"
            >
              <h3 className="text-sm font-semibold text-zinc-100">{t.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {t.body}
              </p>
            </div>
          ))}
          <ul className="space-y-2 pt-2">
            {PRINCIPLES.map((p) => (
              <li
                key={p}
                className="border-l-2 border-zinc-700 pl-3 text-[11px] text-zinc-500"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* FEE CHART */}
        <section id="fee-chart" className="mt-14 scroll-mt-8 space-y-4">
          <h2 className="text-lg font-semibold">{FEE_CHART.title}</h2>
          <div className="overflow-x-auto rounded border border-amber-900/40 bg-amber-950/15 p-4">
            <div className="flex min-w-[560px] items-stretch gap-2 text-center text-[10px]">
              {[
                "Creator fees",
                "Buy tokens / ANSEM",
                `Under ${(ANSEM_TARGET_PCT * 100).toFixed(0)}% → send`,
                `≥ ${(ANSEM_TARGET_PCT * 100).toFixed(0)}% → buybacks`,
              ].map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div className="flex-1 rounded border border-zinc-700 bg-zinc-950/70 px-2 py-3 text-zinc-200">
                    {label}
                  </div>
                  {i < 3 && (
                    <span className="shrink-0 text-zinc-600" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEE_CHART.phases.map((p) => (
              <div
                key={p.id}
                className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {p.label}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {p.rule}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PART 1 — steps */}
        <section id="part-1" className="mt-14 scroll-mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Part 1 — How-to flow</h2>
          <ol className="space-y-3">
            {PART1_FLOW.map((step) => (
              <li
                key={step.id}
                className="flex gap-3 rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4"
              >
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
              </li>
            ))}
          </ol>
        </section>

        {/* START LIST */}
        <section id="start-list" className="mt-14 scroll-mt-8 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Start list — nodes to seed</h2>
            <p className="text-[11px] text-zinc-500">
              Floor ≈ ${floor.toFixed(0)} · ${NODE_MIN_USD} min ·{" "}
              {START_LIST.length} nodes
            </p>
          </div>
          <p className="text-[11px] text-zinc-500">
            Dual-sided TOKEN–ANSEM on{" "}
            <a
              href="https://app.meteora.ag"
              className="text-sky-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              app.meteora.ag
            </a>{" "}
            with your LP wallet. Edit list in{" "}
            <code className="text-zinc-400">src/lib/whitepaper.ts</code>.
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
        </section>

        <section id="part-2" className="mt-14 scroll-mt-8 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold">Part 2 — Wallets</h2>
          <p className="mt-2 text-xs text-zinc-500">
            W1 LP claims · W2 operator buys/sends · ANSEM dest receives. Pubkeys
            only on this hub — see{" "}
            <Link href="/manage" className="text-sky-400 hover:underline">
              Manage
            </Link>
            .
          </p>
        </section>

        <section id="part-3" className="mt-10 scroll-mt-8 border-t border-zinc-800 pt-8 pb-16">
          <h2 className="text-lg font-semibold">Part 3 — Index token</h2>
          <p className="mt-2 text-xs text-zinc-500">
            Stub. Memecoin that buys the index — after pools + nodes. See{" "}
            <Link href="/roadmap" className="text-sky-400 hover:underline">
              Roadmap
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
