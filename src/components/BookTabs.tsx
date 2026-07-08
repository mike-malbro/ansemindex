"use client";

import { useCallback, useEffect, useState } from "react";
import { PoolIndexBook } from "./PoolIndexBook";
import { CreatorFeePanel } from "./CreatorFeePanel";
import { WalletLookup } from "./WalletLookup";

export type BookTab = "index" | "creator" | "wallet";

const TABS: { id: BookTab; label: string; hint: string }[] = [
  { id: "index", label: "Index", hint: "Pool book" },
  { id: "creator", label: "Creator", hint: "Fee wallet" },
  { id: "wallet", label: "Wallet", hint: "Paste & look up" },
];

function parseTab(raw: string | null): BookTab {
  if (raw === "wallet") return "wallet";
  if (raw === "creator" || raw === "creators") return "creator";
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

/** Top menu on /book: Index · Creator · Wallet */
export function BookTabs() {
  const [tab, setTab] = useState<BookTab>("index");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let next = parseTab(params.get("tab"));
    if (params.get("wallet") && !params.get("tab")) next = "wallet";
    else if (params.get("creator") && !params.get("tab")) next = "creator";
    else if (params.get("pool") && !params.get("tab")) next = "index";
    setTab(next);
    setReady(true);
  }, []);

  const selectTab = useCallback((next: BookTab) => {
    setTab(next);
    setQueryParams({
      tab: next === "index" ? null : next,
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
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur sm:px-6">
        <div
          className="mx-auto flex max-w-[1400px] gap-1 py-3"
          role="tablist"
          aria-label="Sections"
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
                className={`flex min-w-[5.5rem] flex-1 flex-col items-start rounded-md px-3 py-2.5 text-left transition sm:flex-none sm:min-w-[8rem] ${
                  active
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span className="font-mono text-sm font-semibold tracking-tight">
                  {t.label}
                </span>
                <span
                  className={`mt-0.5 font-mono text-[10px] ${
                    active ? "text-zinc-600" : "text-zinc-600"
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
