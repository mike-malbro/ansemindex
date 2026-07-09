import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  ANSEM_TARGET_PCT,
  ROADMAP_PHASES,
  WHITEPAPER_VERSION,
} from "@/lib/thesis";

export const metadata = {
  title: "Roadmap · ANSEM INDEX",
  description:
    "Clear phases: Pools → Launchpad → Nodes → Flywheel (70% ANSEM) → longs → Brain.",
};

export default function RoadmapPage() {
  const pct = Math.round(ANSEM_TARGET_PCT * 100);

  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/roadmap" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Strategic roadmap
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          One job per phase
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Pools first. Then launchpad. Nodes optional. Flywheel sends creator
          fees into ANSEM until {pct}%, then buybacks. Longs and brain only
          after the ledger is real. Never with keys on the public hub.
        </p>

        {/* Horizontal strip */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {ROADMAP_PHASES.map((p) => (
            <a
              key={p.id}
              href={`#phase-${p.id}`}
              className={`min-w-[88px] flex-1 rounded border px-2 py-3 text-center transition hover:border-zinc-600 ${
                p.status === "now"
                  ? "border-emerald-800/60 bg-emerald-950/25"
                  : p.status === "next"
                    ? "border-sky-900/50 bg-sky-950/20"
                    : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {p.phase}
              </div>
              <div className="mt-1 text-xs font-semibold text-zinc-100">
                {p.title}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">
                {p.status}
              </div>
            </a>
          ))}
        </div>

        {/* Timeline */}
        <ol className="relative mt-10 space-y-0 border-l border-zinc-800 pl-6">
          {ROADMAP_PHASES.map((p) => (
            <li
              key={p.id}
              id={`phase-${p.id}`}
              className="relative scroll-mt-24 pb-10 last:pb-0"
            >
              <span
                className={`absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full border-2 ${
                  p.status === "now"
                    ? "border-emerald-500 bg-emerald-950"
                    : p.status === "next"
                      ? "border-sky-500 bg-sky-950"
                      : "border-zinc-600 bg-zinc-950"
                }`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  Phase {p.phase} — {p.title}
                </h2>
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    p.status === "now"
                      ? "text-emerald-300"
                      : p.status === "next"
                        ? "text-sky-400"
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
              <ul className="mt-3 space-y-1">
                {p.ships.map((s) => (
                  <li
                    key={s}
                    className="text-[11px] text-zinc-400 before:mr-2 before:text-zinc-600 before:content-['·']"
                  >
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-zinc-600">
                Depends on: {p.depends}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded border border-zinc-800 bg-zinc-900/40 px-4 py-4 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-200">See it live</p>
          <p className="mt-2">
            <Link
              href="/book?tab=creator"
              className="text-sky-400 hover:underline"
            >
              Creator · 0→{pct}% goal
            </Link>
            {" · "}
            <Link href="/book" className="text-sky-400 hover:underline">
              Index
            </Link>
            {" · "}
            <Link
              href="/whitepaper#flywheel"
              className="text-sky-400 hover:underline"
            >
              Fee chart
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
