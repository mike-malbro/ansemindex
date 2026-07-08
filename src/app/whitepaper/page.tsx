import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { FeeCompoundChart } from "@/components/whitepaper/FeeCompoundChart";
import { FeeFlywheelChart } from "@/components/whitepaper/FeeFlywheelChart";
import { PoolDiagram } from "@/components/whitepaper/PoolDiagram";
import {
  ANSEM_TARGET_PCT,
  BASE_FEE_PCT,
  COLLAB_RULES,
  DATA_LAYERS,
  EXPLAIN_DATA,
  EXPLAIN_FEE_1PCT,
  EXPLAIN_INDEX,
  EXPLAIN_LAUNCHPAD,
  EXPLAIN_METEORA,
  EXPLAIN_NODES,
  EXPLAIN_POOL,
  EXPLAIN_PRO_RATA,
  FEE_CHART,
  HOW_TO_SHORT,
  MISSION,
  PRINCIPLES,
  ROADMAP_PHASES,
  WHITEPAPER_NAV,
  WHITEPAPER_UPDATED_NOTE,
  WHITEPAPER_VERSION,
} from "@/lib/thesis";
import { WHITEPAPER_TITLE } from "@/lib/whitepaper";

export const metadata = {
  title: `${WHITEPAPER_TITLE} v${WHITEPAPER_VERSION} · ANSEM INDEX`,
  description:
    "v1.2: pool index, fee flywheel, production databasing, GitHub collab. No keys on the hub.",
};

function Section({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-zinc-800/80 py-12 last:border-b-0"
    >
      {children}
    </section>
  );
}

export default function WhitepaperPage() {
  const pct = Math.round(ANSEM_TARGET_PCT * 100);

  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <SiteNav current="/whitepaper" />

      <nav
        className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur"
        aria-label="Whitepaper sections"
      >
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {WHITEPAPER_NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <Section id="cover">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-amber-800/60 bg-amber-950/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200/90">
              v{WHITEPAPER_VERSION}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              living docs · no keys
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {WHITEPAPER_TITLE}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300">
            {MISSION}
          </p>
          <p className="mt-3 text-xs text-zinc-500">{WHITEPAPER_UPDATED_NOTE}</p>
          <ul className="mt-8 space-y-2">
            {PRINCIPLES.map((p) => (
              <li
                key={p}
                className="border-l-2 border-zinc-700 pl-3 text-[11px] text-zinc-500"
              >
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="index">
          <h2 className="text-lg font-semibold">{EXPLAIN_INDEX.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_INDEX.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_INDEX.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Open it:{" "}
            <Link href="/book" className="text-sky-400 hover:underline">
              /book · Index
            </Link>
            . Map wallets auto-ingest on refresh.
          </p>
        </Section>

        <Section id="shares">
          <h2 className="text-lg font-semibold">{EXPLAIN_PRO_RATA.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_PRO_RATA.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_PRO_RATA.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="meteora">
          <h2 className="text-lg font-semibold">{EXPLAIN_METEORA.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_METEORA.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_METEORA.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="pool">
          <h2 className="text-lg font-semibold">{EXPLAIN_POOL.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_POOL.body}
          </p>
          <div className="mt-6">
            <PoolDiagram />
          </div>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_POOL.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-sm font-semibold text-zinc-200">
            {EXPLAIN_FEE_1PCT.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_FEE_1PCT.body}
          </p>
          <div className="mt-6">
            <FeeCompoundChart />
          </div>
        </Section>

        <Section id="flywheel">
          <h2 className="text-lg font-semibold">{FEE_CHART.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            ANSEM creator fees buy index tokens by share. While ANSEM is under{" "}
            {pct}% of the program, send and seed. At {pct}% or more, the same
            fees go to all buybacks. Base fee on pools: {BASE_FEE_PCT}%.
          </p>
          <div className="mt-6">
            <FeeFlywheelChart />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
          <ol className="mt-6 space-y-3">
            {FEE_CHART.steps.map((s) => (
              <li key={s.n} className="flex gap-3 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-700 text-[10px] text-zinc-400">
                  {s.n}
                </span>
                <div>
                  <div className="font-semibold text-zinc-200">{s.title}</div>
                  <p className="mt-0.5 text-zinc-500">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="data">
          <h2 className="text-lg font-semibold">{EXPLAIN_DATA.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_DATA.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_DATA.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-semibold text-zinc-200">
            Data layers
          </h3>
          <ol className="mt-4 space-y-3">
            {DATA_LAYERS.map((layer, i) => (
              <li
                key={layer.id}
                className="rounded border border-zinc-800 bg-zinc-900/40 px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {i + 1}. {layer.label}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {layer.body}
                </p>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-sm font-semibold text-zinc-200">
            GitHub & collab
          </h3>
          <ul className="mt-4 space-y-3">
            {COLLAB_RULES.map((r) => (
              <li
                key={r.title}
                className="border-l-2 border-zinc-700 pl-3"
              >
                <div className="text-xs font-semibold text-zinc-200">
                  {r.title}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  {r.body}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-zinc-500">
            Full schema contract:{" "}
            <a
              href="https://github.com/mike-malbro/ansemindex/blob/main/DATA.md"
              className="text-sky-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              DATA.md on GitHub
            </a>
            . Security:{" "}
            <a
              href="https://github.com/mike-malbro/ansemindex/blob/main/SECURITY.md"
              className="text-sky-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              SECURITY.md
            </a>
            . Live ledger:{" "}
            <Link href="/book?tab=creator" className="text-sky-400 hover:underline">
              Creator · 0→{pct}%
            </Link>
            .
          </p>
        </Section>

        <Section id="launchpad">
          <h2 className="text-lg font-semibold">{EXPLAIN_LAUNCHPAD.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_LAUNCHPAD.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_LAUNCHPAD.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Stub:{" "}
            <Link href="/launchpad" className="text-sky-400 hover:underline">
              /launchpad
            </Link>
            .
          </p>
        </Section>

        <Section id="nodes">
          <h2 className="text-lg font-semibold">{EXPLAIN_NODES.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {EXPLAIN_NODES.body}
          </p>
          <ul className="mt-4 space-y-2">
            {EXPLAIN_NODES.bullets.map((b) => (
              <li
                key={b}
                className="text-xs text-zinc-500 before:mr-2 before:content-['·']"
              >
                {b}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="howto">
          <h2 className="text-lg font-semibold">How-to</h2>
          <p className="mt-2 text-xs text-zinc-500">
            Short path. Live book:{" "}
            <Link href="/book" className="text-sky-400 hover:underline">
              /book
            </Link>
            .
          </p>
          <ol className="mt-6 space-y-3">
            {HOW_TO_SHORT.map((step) => (
              <li
                key={step.n}
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
        </Section>

        <Section id="roadmap">
          <h2 className="text-lg font-semibold">Roadmap</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Pools → launchpad → nodes → flywheel → long SOL / long ANSEM →
            brain. Rules can shift as data arrives.
          </p>
          <ol className="mt-6 space-y-3">
            {ROADMAP_PHASES.map((p) => (
              <li
                key={p.id}
                className={`rounded border px-4 py-3 ${
                  p.status === "now"
                    ? "border-amber-800/50 bg-amber-950/15"
                    : "border-zinc-800 bg-zinc-900/30"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-100">
                    {p.phase}. {p.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{p.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[11px] text-zinc-600">
            Full page:{" "}
            <Link href="/roadmap" className="text-sky-400 hover:underline">
              /roadmap
            </Link>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}
