"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

const LINKS = [
  { href: "/", label: "Home", match: "home" as const },
  { href: "/book", label: "Index", match: "index" as const },
  { href: "/book?tab=creator", label: "Creator", match: "creator" as const },
  { href: "/book?tab=wallet", label: "Wallet", match: "wallet" as const },
  { href: "/join", label: "Join", match: "join" as const },
  { href: "/nodes", label: "Nodes", match: "nodes" as const },
  { href: "/#api", label: "API", match: "api" as const },
  { href: "/whitepaper", label: "Whitepaper", match: "whitepaper" as const },
] as const;

function parseTab(raw: string | null): "index" | "creator" | "wallet" {
  if (raw === "wallet") return "wallet";
  if (raw === "creator" || raw === "creators") return "creator";
  return "index";
}

function linkClass(active: boolean) {
  return `px-2 py-1.5 font-mono text-[11px] transition ${
    active
      ? "text-white underline underline-offset-4"
      : "text-white/55 hover:text-white"
  }`;
}

function isActive(
  match: (typeof LINKS)[number]["match"],
  pathname: string,
  tab: "index" | "creator" | "wallet" | null,
): boolean {
  switch (match) {
    case "home":
      return pathname === "/";
    case "index":
      return pathname === "/book" && tab === "index";
    case "creator":
      return pathname === "/book" && tab === "creator";
    case "wallet":
      return pathname === "/book" && tab === "wallet";
    case "join":
      return pathname === "/join";
    case "nodes":
      return pathname === "/nodes";
    case "api":
      return false;
    case "whitepaper":
      return pathname === "/whitepaper";
    default:
      return false;
  }
}

function SiteNavLinks() {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const onBook = pathname === "/book";
  const tab = onBook ? parseTab(search.get("tab")) : null;

  return (
    <nav
      className="flex flex-wrap items-center gap-x-0.5 gap-y-1"
      aria-label="Main"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={linkClass(isActive(l.match, pathname, tab))}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Top menu: Home · Index · Creator · Wallet · Join · Nodes · API · Whitepaper */
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
          className="flex shrink-0 items-baseline gap-2 font-mono tracking-tight"
        >
          <span className="text-sm font-semibold text-white">
            {INDEX_TICKER}
          </span>
          <span className="hidden text-sm font-semibold text-white sm:inline">
            {INDEX_NAME}
          </span>
        </Link>
        <Suspense
          fallback={
            <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
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
