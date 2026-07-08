import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { HomeIndex } from "@/components/HomeIndex";
import { FeeFlywheelChart } from "@/components/whitepaper/FeeFlywheelChart";
import { INDEX_TOKEN_SYMBOL } from "@/lib/config";
import {
  ANSEM_TARGET_PCT,
  BASE_FEE_PCT,
  HOW_TO_GUIDE,
  PRINCIPLES,
  ROADMAP_PHASES,
  WHITEPAPER_VERSION,
} from "@/lib/thesis";

export const metadata = {
  title: `$${INDEX_TOKEN_SYMBOL} · Creator wallets`,
  description:
    "$ANSEMINDEX — creator wallets, live fees, TOKEN–ANSEM pools. Click a creator to drill down.",
};

export default function GuideHome() {
  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-amber-200/80">
          ${INDEX_TOKEN_SYMBOL}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          ${INDEX_TOKEN_SYMBOL}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          The index is <span className="text-zinc-200">creator wallets</span>{" "}
          seeding TOKEN–ANSEM pools on Meteora. Click a creator → drill down
          into that wallet. Fees shown are real LP fees. ${INDEX_TOKEN_SYMBOL}{" "}
          treasury stays $0 until creator fees. DAMM v2 at {BASE_FEE_PCT}% ·
          flywheel to {(ANSEM_TARGET_PCT * 100).toFixed(0)}% ANSEM.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#creators"
            className="inline-flex items-center rounded border border-amber-800/50 bg-amber-950/20 px-4 py-2.5 text-sm text-amber-100/90 transition hover:border-amber-700/60"
          >
            Creator wallets ↓
          </Link>
          <Link
            href="/whitepaper"
            className="inline-flex items-center rounded border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-zinc-500"
          >
            Whitepaper v{WHITEPAPER_VERSION} →
          </Link>
        </div>

        <HomeIndex />

        <section id="fee-chart" className="mt-12">
          <h2 className="text-sm font-semibold text-zinc-200">Fee chart</h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            Creator fees → buy → seed until {(ANSEM_TARGET_PCT * 100).toFixed(0)}
            % ANSEM → buybacks.
          </p>
          <div className="mt-4">
            <FeeFlywheelChart />
          </div>
          <Link
            href="/whitepaper#flywheel"
            className="mt-3 inline-block text-[11px] text-sky-400 hover:underline"
          >
            Full chart →
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">How-to</h2>
          <ol className="mt-6 space-y-3">
            {HOW_TO_GUIDE.map((step) => (
              <li
                key={step.id}
                className="flex gap-3 rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-300">
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {step.body}
                  </p>
                  <Link
                    href={step.href}
                    className="mt-2 inline-block text-[11px] text-sky-400 hover:underline"
                  >
                    {step.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Roadmap</h2>
            <Link
              href="/roadmap"
              className="text-[11px] text-sky-400 hover:underline"
            >
              Full roadmap →
            </Link>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {ROADMAP_PHASES.map((p) => (
              <div
                key={p.id}
                className={`min-w-[120px] flex-1 rounded border px-3 py-3 ${
                  p.status === "now"
                    ? "border-amber-800/50 bg-amber-950/20"
                    : "border-zinc-800 bg-zinc-900/30"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Phase {p.phase} · {p.status}
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-100">
                  {p.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 mb-16">
          <h2 className="text-lg font-semibold">Principles</h2>
          <ul className="mt-4 space-y-2">
            {PRINCIPLES.map((p) => (
              <li
                key={p}
                className="border-l-2 border-zinc-700 pl-3 text-[11px] leading-relaxed text-zinc-400"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
