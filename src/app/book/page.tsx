import { BookTabs } from "@/components/BookTabs";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Index · ANSEM INDEX",
  description:
    "Pool index, $ANSEMINDEX creators, and wallet lookup. Pubkeys only.",
};

export default function BookPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SiteNav current="/book" />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          Index = pools. Creators = map wallets seeding the book. Wallet =
          paste a pubkey and see holdings + LPs. No keys.{" "}
          <a href="/whitepaper#index" className="text-sky-400 hover:underline">
            How it works
          </a>
        </p>
      </div>
      <BookTabs />
    </div>
  );
}
