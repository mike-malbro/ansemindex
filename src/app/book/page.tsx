import { BookTabs } from "@/components/BookTabs";
import { SiteNav } from "@/components/SiteNav";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

export const metadata = {
  title: `Index · ${INDEX_TICKER}`,
  description: `${INDEX_NAME} pool book, creator fees, wallet lookup. Pubkeys only.`,
};

export default function BookPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SiteNav />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          <span className="text-emerald-400">{INDEX_TICKER}</span>{" "}
          <span className="text-zinc-300">{INDEX_NAME}</span>
          {" · "}
          Switch Index · Creator fees · Wallet below — same book layout. No
          keys.{" "}
          <a href="/faq" className="text-emerald-400 hover:underline">
            FAQ
          </a>
        </p>
      </div>
      <BookTabs />
    </div>
  );
}
