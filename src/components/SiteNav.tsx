"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

const LINKS = [
  { href: "/book", label: "Index", tab: "index" as const },
  { href: "/book?tab=creator", label: "Creator fees", tab: "creator" as const },
  { href: "/book?tab=wallet", label: "Wallet", tab: "wallet" as const },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/faq", label: "FAQ" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/roadmap", label: "Roadmap" },
] as const;

function navActive(
  pathname: string,
  tab: string | null,
  link: (typeof LINKS)[number],
): boolean {
  if (link.href.startsWith("/book")) {
    if (pathname !== "/book") return false;
    const want = "tab" in link ? link.tab : "index";
    const current = tab === "creator" || tab === "creators"
      ? "creator"
      : tab === "wallet"
        ? "wallet"
        : "index";
    return current === want;
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function SiteNavInner() {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const tab = search.get("tab");

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
        <nav className="flex flex-wrap gap-1" aria-label="Main">
          {LINKS.map((l) => {
            const active = navActive(pathname, tab, l);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-2.5 py-1.5 font-mono text-[11px] transition ${
                  active
                    ? "bg-emerald-950/80 text-emerald-300"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Single top menu — Index · Creator fees · Wallet · Whitepaper · FAQ · … */
export function SiteNav(_props?: { current?: string }) {
  return (
    <Suspense
      fallback={
        <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-[1400px] font-mono text-sm text-zinc-500">
            {INDEX_TICKER} {INDEX_NAME}
          </div>
        </header>
      }
    >
      <SiteNavInner />
    </Suspense>
  );
}
