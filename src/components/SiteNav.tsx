"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

const LINKS = [
  { href: "/book", label: "Index", tab: "index" as const },
  { href: "/book?tab=creator", label: "Creator", tab: "creator" as const },
  { href: "/book?tab=wallet", label: "Wallet", tab: "wallet" as const },
] as const;

function parseTab(raw: string | null): "index" | "creator" | "wallet" {
  if (raw === "wallet") return "wallet";
  if (raw === "creator" || raw === "creators") return "creator";
  return "index";
}

function linkClass(active: boolean) {
  return `px-2.5 py-1.5 font-mono text-[11px] transition ${
    active
      ? "text-white underline underline-offset-4"
      : "text-white/50 hover:text-white"
  }`;
}

function SiteNavLinks() {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const onBook = pathname === "/book";
  const tab = onBook ? parseTab(search.get("tab")) : null;

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Book sections">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={linkClass(tab === l.tab)}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Top: brand + Index / Creator / Wallet. Everything else cycles in the footer. */
export function SiteNav(props?: { current?: string; tone?: "default" | "black" }) {
  const black = props?.tone === "black";

  return (
    <header
      className={`border-b px-4 py-3 sm:px-6 lg:px-10 ${
        black
          ? "border-white/10 bg-black"
          : "border-zinc-800 bg-zinc-950/95 backdrop-blur"
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${
          black ? "w-full" : "mx-auto max-w-[1400px]"
        }`}
      >
        <Link
          href="/"
          className="flex items-baseline gap-2 font-mono tracking-tight"
        >
          <span className="text-sm font-semibold text-white">
            {INDEX_TICKER}
          </span>
          <span className="text-sm font-semibold text-white">
            {INDEX_NAME}
          </span>
        </Link>
        <Suspense
          fallback={
            <nav className="flex flex-wrap items-center gap-1" aria-label="Book sections">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(false)}>
                  {l.label}
                </Link>
              ))}
            </nav>
          }
        >
          <SiteNavLinks />
        </Suspense>
      </div>
    </header>
  );
}
