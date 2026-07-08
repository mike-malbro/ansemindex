import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { FeeFlywheelChart } from "@/components/whitepaper/FeeFlywheelChart";
import {
  ANSEM_TARGET_PCT,
  BASE_FEE_PCT,
  HOW_TO_GUIDE,
  PRINCIPLES,
  ROADMAP_PHASES,
  WHITEPAPER_VERSION,
} from "@/lib/thesis";

export const metadata = {
  title: "ANSEM INDEX · How-to guide",
  description:
    "Creator fees buy tokens/ANSEM until 70% ANSEM, then all buybacks. DAMM v2 · 1% · run your own node.",
};

export default function GuideHome() {
  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Public guide · no keys on this hub
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          How to run the ANSEM Index
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Creator fees buy tokens and ANSEM. Send and seed until ANSEM is{" "}
          {(ANSEM_TARGET_PCT * 100).toFixed(0)}% of the program — then all
          buybacks. DAMM v2 at {BASE_FEE_PCT}%. Copy the method, not the wallet.
        </p>

        <Link
          href="/whitepaper"
          className="mt-6 inline-flex items-center gap-2 rounded border border-amber-800/50 bg-amber-950/20 px-4 py-2.5 text-sm text-amber-100/90 transition hover:border-amber-700/60"
        >
          Read whitepaper v{WHITEPAPER_VERSION} →
        </Link>

        {/* Compact fee chart */}
        <section id="fee-chart" className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-200">Fee chart</h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            Build to {(ANSEM_TARGET_PCT * 100).toFixed(0)}% ANSEM, then all
            buybacks.
          </p>
          <div className="mt-4">
            <FeeFlywheelChart />
          </div>
          <Link
            href="/whitepaper#flywheel"
            className="mt-3 inline-block text-[11px] text-sky-400 hover:underline"
          >
            Full chart in whitepaper v{WHITEPAPER_VERSION} →
          </Link>
        </section>

        {/* How-to index */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">How-to</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Short index into the paper. Public hub never asks for private keys.
          </p>
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

        {/* Roadmap strip */}
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

        {/* Principles */}
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
