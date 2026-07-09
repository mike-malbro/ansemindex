"use client";

/**
 * Operator-only: how the bot works (copycat holdings control).
 * Not linked from public roadmap / home marketing.
 */
export function OperatorBotReport() {
  return (
    <section className="mb-6 space-y-4 rounded border border-zinc-700 border-dashed bg-zinc-900/30 p-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Operator · not public product copy
        </p>
        <h2 className="mt-1 text-sm font-semibold text-zinc-100">
          Bot function report
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Roadmap is the public story. This is how we build and steer the
          keeper. Do not paste this framing on the homepage.
        </p>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-950/50 px-3 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Control model
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300">
          The bot is a <span className="text-emerald-300">copycat of your
          wallet holdings</span>. Open TOKEN–ANSEM positions on the map / LP
          wallet are the instruction set. You control it manually by what you
          hold, seed, and claim — the tick mirrors that book.
        </p>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Tick functions
        </h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-zinc-400">
          <li>
            <span className="text-zinc-200">Read</span> — open DAMM positions
            on LP / map wallet
          </li>
          <li>
            <span className="text-zinc-200">Claim</span> — LP fees above min
            threshold
          </li>
          <li>
            <span className="text-zinc-200">Sweep</span> — SOL LP → operator
            (when set)
          </li>
          <li>
            <span className="text-zinc-200">Route</span> — buy+send ANSEM to
            dest · SOL reserve
          </li>
          <li>
            <span className="text-zinc-200">Gate</span> — under 70% ANSEM:
            build; at ≥ 70%: buybacks
          </li>
          <li>
            <span className="text-zinc-200">Persist</span> — tick + fee events
            into Postgres ledger
          </li>
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-zinc-800 px-3 py-3">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">
            Public roadmap
          </h3>
          <p className="mt-1 text-[11px] text-zinc-400">
            Index → Flywheel → Launchpad → Network
          </p>
          <a
            href="/roadmap"
            className="mt-2 inline-block text-[11px] text-emerald-400 hover:underline"
          >
            /roadmap →
          </a>
        </div>
        <div className="rounded border border-zinc-800 px-3 py-3">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">
            Ops doc
          </h3>
          <p className="mt-1 text-[11px] text-zinc-400">
            Full write-up for collaborators (repo only).
          </p>
          <a
            href="https://github.com/mike-malbro/ansemindex/blob/main/OPERATOR.md"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[11px] text-emerald-400 hover:underline"
          >
            OPERATOR.md →
          </a>
        </div>
      </div>
    </section>
  );
}
