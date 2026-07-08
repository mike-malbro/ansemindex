"use client";

import { useCallback, useEffect, useState } from "react";
import { PoolIndexBook } from "./PoolIndexBook";
import { CreatorBook } from "./CreatorBook";
import { WalletLookup } from "./WalletLookup";

export type BookTab = "index" | "creators" | "wallet";

const TABS: { id: BookTab; label: string }[] = [
  { id: "index", label: "Index" },
  { id: "creators", label: "$ANSEMINDEX creators" },
  { id: "wallet", label: "Wallet" },
];

function parseTab(raw: string | null): BookTab {
  if (raw === "creators" || raw === "wallet" || raw === "index") return raw;
  return "index";
}

function setQueryParams(patch: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState({}, "", url.toString());
}

/** Top sections on /book: Index · Creators · Wallet lookup. */
export function BookTabs() {
  const [tab, setTab] = useState<BookTab>("index");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let next = parseTab(params.get("tab"));
    // Deep-links imply tab
    if (params.get("wallet") && !params.get("tab")) next = "wallet";
    else if (params.get("creator") && !params.get("tab")) next = "creators";
    else if (params.get("pool") && !params.get("tab")) next = "index";
    setTab(next);
    setReady(true);
  }, []);

  const selectTab = useCallback((next: BookTab) => {
    setTab(next);
    setQueryParams({
      tab: next === "index" ? null : next,
      // keep pool/creator/wallet params for deep-links within tabs
    });
  }, []);

  if (!ready) {
    return (
      <div className="py-16 text-center font-mono text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6">
        <div
          className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto py-2"
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
                className={`shrink-0 rounded px-3 py-2 font-mono text-xs transition ${
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="flex-1">
        {tab === "index" && <PoolIndexBook embedded />}
        {tab === "creators" && <CreatorBook embedded />}
        {tab === "wallet" && <WalletLookup />}
      </div>
    </div>
  );
}
