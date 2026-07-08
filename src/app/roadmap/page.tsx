import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ROADMAP_PHASES } from "@/lib/thesis";

export const metadata = {
  title: "Roadmap · ANSEM INDEX",
  description: "Pools → nodes → flywheel → brain → index token.",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/roadmap" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Strategic roadmap
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Pools first, then brain</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Start with the nervous system (pools + fee chart). Nodes and flywheel
          next. Adaptive “brain” only after we have a dataset — and never with
          keys on the public hub.
        </p>

        <ol className="mt-10 space-y-4">
          {ROADMAP_PHASES.map((p) => (
            <li
              key={p.id}
              className={`rounded border px-4 py-4 ${
                p.status === "now"
                  ? "border-amber-800/50 bg-amber-950/15"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Phase {p.phase} — {p.title}
                </h2>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {p.detail}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-xs text-zinc-500">
          How-to steps:{" "}
          <Link href="/" className="text-sky-400 hover:underline">
            Guide home
          </Link>
          . Fee chart:{" "}
          <Link
            href="/whitepaper#fee-chart"
            className="text-sky-400 hover:underline"
          >
            Whitepaper
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
