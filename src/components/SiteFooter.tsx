import Link from "next/link";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

const CYCLE = [
  { href: "/book", label: "Index" },
  { href: "/book?tab=creator", label: "Creator fees" },
  { href: "/book?tab=wallet", label: "Wallet" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/faq", label: "FAQ" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/launchpad", label: "Launchpad" },
] as const;

/** Bottom cycle nav — secondary pages live here, not in the top bar. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {INDEX_TICKER}
          </span>
          <span className="font-mono text-xs text-zinc-400">{INDEX_NAME}</span>
          <span className="font-mono text-[10px] text-zinc-600">
            · pubkeys only · no keys
          </span>
        </div>
        <nav
          className="mt-4 flex flex-wrap gap-x-3 gap-y-2"
          aria-label="Cycle pages"
        >
          {CYCLE.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] text-zinc-500 transition hover:text-emerald-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
