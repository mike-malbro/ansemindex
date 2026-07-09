"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PoolIndexBook } from "./PoolIndexBook";
import { CreatorFeePanel } from "./CreatorFeePanel";
import { WalletLookup } from "./WalletLookup";

export type BookTab = "index" | "creator" | "wallet";

const TABS: { id: BookTab; label: string; hint: string }[] = [
  { id: "index", label: "Index", hint: "Pool book" },
  { id: "creator", label: "Creator fees", hint: "$AI → ANSEM" },
  { id: "wallet", label: "Wallet", hint: "Paste & look up" },
];

function parseTab(raw: string | null): BookTab {
  if (raw === "wallet") return "wallet";
  if (raw === "creator" || raw === "creators") return "creator";
  return "index";
}

function BookTabsInner() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "/book";
  const tab = parseTab(search.get("tab"));

  const selectTab = useCallback(
    (next: BookTab) => {
      const params = new URLSearchParams(search.toString());
      if (next === "index") params.delete("tab");
      else params.set("tab", next);
      // Keep pool/wallet deep-links when relevant; clear cross-tab noise
      if (next !== "index") params.delete("pool");
      if (next !== "wallet") params.delete("wallet");
      if (next !== "creator") params.delete("creator");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, search],
  );

  // Deep-link defaults: ?wallet= → wallet tab, ?creator= → creator
  useEffect(() => {
    if (search.get("tab")) return;
    if (search.get("wallet")) selectTab("wallet");
    else if (search.get("creator")) selectTab("creator");
  }, [search, selectTab]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Same switcher shell as the pool page — Index · Creator fees · Wallet */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur sm:px-6">
        <div
          className="mx-auto flex max-w-[1400px] gap-1 py-3"
          role="tablist"
          aria-label="Book sections"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={`flex min-w-[5.5rem] flex-1 flex-col items-start rounded-md px-3 py-2.5 text-left transition sm:flex-none sm:min-w-[9rem] ${
                  active
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span className="font-mono text-sm font-semibold tracking-tight">
                  {t.label}
                </span>
                <span
                  className={`mt-0.5 font-mono text-[10px] ${
                    active ? "text-zinc-800" : "text-zinc-600"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="flex-1">
        {tab === "index" && <PoolIndexBook embedded />}
        {tab === "creator" && <CreatorFeePanel />}
        {tab === "wallet" && <WalletLookup />}
      </div>
    </div>
  );
}

/** In-page Index · Creator fees · Wallet — same setup as the pool book. */
export function BookTabs() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center font-mono text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <BookTabsInner />
    </Suspense>
  );
}
