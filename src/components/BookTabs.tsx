"use client";

import { useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PoolIndexBook } from "./PoolIndexBook";
import { CreatorFeePanel } from "./CreatorFeePanel";
import { WalletLookup } from "./WalletLookup";

export type BookTab = "index" | "creator" | "wallet";

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
      <div role="tabpanel" className="flex-1">
        {tab === "index" && <PoolIndexBook embedded />}
        {tab === "creator" && <CreatorFeePanel />}
        {tab === "wallet" && <WalletLookup />}
      </div>
    </div>
  );
}

/** Book panels switched by SiteNav / ?tab= URLs. */
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
