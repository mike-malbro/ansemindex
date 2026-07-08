import { PoolIndexBook } from "@/components/PoolIndexBook";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Index · ANSEM INDEX",
  description:
    "Live DAMM v2 TOKEN–ANSEM pool index with proportional shares. Auto-mapped from map wallets.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteNav current="/book" />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          The index is the pool list. Map wallets auto-ingest open positions.
          Pubkeys only — no keys.{" "}
          <a href="/whitepaper#index" className="text-sky-400 hover:underline">
            How it works
          </a>
        </p>
      </div>
      <PoolIndexBook embedded />
    </div>
  );
}
