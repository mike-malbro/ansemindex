import { CreatorBook } from "@/components/CreatorBook";
import { SiteNav } from "@/components/SiteNav";
import { INDEX_TOKEN_SYMBOL } from "@/lib/config";

export const metadata = {
  title: `$${INDEX_TOKEN_SYMBOL} · Creator wallets`,
  description:
    "Creator wallets seeding TOKEN–ANSEM pools — the $ANSEMINDEX book. Click a creator to drill down.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteNav current="/book" />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          ${INDEX_TOKEN_SYMBOL} — creator wallets are the index. Click one →
          drill down at the bottom. Public read only — no keys.
        </p>
      </div>
      <CreatorBook embedded />
    </div>
  );
}
