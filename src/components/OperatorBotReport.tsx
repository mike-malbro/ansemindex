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
          wallet holdings</span>. Your map / LP wallet is the{" "}
          <span className="text-zinc-100">leader</span>. The creator / bot book
          is the <span className="text-zinc-100">follower</span>.
        </p>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Mirror workflow
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
          <li>
            <span className="text-zinc-200">Enter</span> — you seed a pool →
            follower enters (proportional)
          </li>
          <li>
            <span className="text-zinc-200">Trim</span> — you sell 90% →
            follower sells 90% of that position
          </li>
          <li>
            <span className="text-emerald-300">Zap out</span> — you full-exit a
            pool → follower <span className="text-emerald-300">zaps out</span>{" "}
            the same pool (flat, no dust policy)
          </li>
          <li>
            <span className="text-zinc-200">Re-enter</span> — you come back →
            follower re-enters on the next mirror pass
          </li>
        </ul>
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-600">
          Loop: snapshot leader → snapshot follower → diff per pool → execute
          follower txs → persist → repeat. Dry-run first.
        </p>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Fee tick (separate loop)
        </h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-zinc-400">
          <li>
            <span className="text-zinc-200">Read</span> — open DAMM positions
          </li>
          <li>
            <span className="text-zinc-200">Claim</span> — LP fees above min
          </li>
          <li>
            <span className="text-zinc-200">Sweep</span> — SOL → operator
          </li>
          <li>
            <span className="text-zinc-200">Route</span> — buy+send ANSEM ·
            reserve
          </li>
          <li>
            <span className="text-zinc-200">Gate</span> — &lt;70% build · ≥70%
            buybacks
          </li>
          <li>
            <span className="text-zinc-200">Persist</span> — ledger rows
          </li>
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-zinc-800 px-3 py-3">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">
            Public roadmap
          </h3>
          <p className="mt-1 text-[11px] text-zinc-400">
            Manual → Flywheel → ML watch → Continue
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
            Full mirror + zap workflow (repo).
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
