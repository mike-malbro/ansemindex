import { BookTabs } from "@/components/BookTabs";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

export const metadata = {
  title: `Index · ${INDEX_TICKER}`,
  description: `${INDEX_NAME} pool book, creator fees, wallet lookup. Pubkeys only.`,
};

export default function BookPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SiteNav />
      <BookTabs />
      <SiteFooter />
    </div>
  );
}
