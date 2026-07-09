"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
  const tab = parseTab(search.get("tab"));

  return (
    <div className="flex-1" role="main">
      {tab === "index" && <PoolIndexBook embedded />}
      {tab === "creator" && <CreatorFeePanel />}
      {tab === "wallet" && <WalletLookup />}
    </div>
  );
}

/** Book panels from ?tab= — SiteNav is the only menu (no second bar). */
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
