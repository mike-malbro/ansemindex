"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

/** Top: brand + Index only. Everything else cycles in the footer. */
export function SiteNav(_props?: { current?: string }) {
  const pathname = usePathname() || "/";
  const onBook = pathname === "/book";

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-mono tracking-tight"
        >
          <span className="text-sm font-semibold text-emerald-400">
            {INDEX_TICKER}
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            {INDEX_NAME}
          </span>
        </Link>
        <Link
          href="/book"
          className={`rounded px-2.5 py-1.5 font-mono text-[11px] transition ${
            onBook
              ? "bg-emerald-950/80 text-emerald-300"
              : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          Index
        </Link>
      </div>
    </header>
  );
}
