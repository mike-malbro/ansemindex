import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeIndex } from "@/components/HomeIndex";
import {
  INDEX_NAME,
  INDEX_TICKER,
  INDEX_POOL_PAIR,
  INDEX_POOL_LIVE,
  INDEX_POOL_METEORA_URL,
  DEXSCREENER_INDEX_URL,
} from "@/lib/config";

export const metadata = {
  title: `${INDEX_TICKER} · ${INDEX_NAME}`,
  description: `${INDEX_NAME} — TOKEN–ANSEM pools. Key market: ${INDEX_POOL_PAIR}. ${INDEX_TICKER} fees fund buybacks and growth.`,
};

export default function GuideHome() {
  return (
    <div className="flex min-h-screen flex-col bg-black font-mono text-white">
      <SiteNav tone="black" />

      <main className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400">
              {INDEX_TICKER}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {INDEX_NAME}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-500">
              TOKEN–ANSEM pools on Meteora. Key market:{" "}
              <span className="text-zinc-300">{INDEX_POOL_PAIR}</span>
              {!INDEX_POOL_LIVE && (
                <span className="text-zinc-600"> (coming)</span>
              )}
              . {INDEX_TICKER} fees → buybacks + growth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px]">
            {INDEX_POOL_LIVE && INDEX_POOL_METEORA_URL && (
              <a
                href={INDEX_POOL_METEORA_URL}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                {INDEX_POOL_PAIR} →
              </a>
            )}
            <a
              href={DEXSCREENER_INDEX_URL}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              DexScreener
              {!INDEX_POOL_LIVE && (
                <span className="ml-1 text-zinc-600">(placeholder)</span>
              )}
            </a>
            <Link
              href="/book"
              className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              Full index →
            </Link>
          </div>
        </div>

        {/* Pool list first */}
        <HomeIndex />

        <section
          id="api"
          className="mt-14 w-full border-t border-white/10 pt-8 pb-4"
        >
          <h2 className="text-sm font-semibold text-white">API</h2>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Public pool list. CORS open · no auth · no keys.
          </p>
          <pre className="mt-4 overflow-x-auto border border-white/10 bg-black p-4 text-[11px] leading-relaxed text-zinc-400">
            {`GET /api/public
GET /api/public?format=csv
GET /api/public?limit=50

curl https://hub-production-7867.up.railway.app/api/public
curl https://hub-production-7867.up.railway.app/api/public?format=csv`}
          </pre>
          <p className="mt-3 text-[11px] text-zinc-600">
            Returns{" "}
            <code className="text-zinc-500">name</code>,{" "}
            <code className="text-zinc-500">ticker</code>,{" "}
            <code className="text-zinc-500">index_pool</code> ({INDEX_POOL_PAIR}
            ), and{" "}
            <code className="text-zinc-500">pools[]</code>.{" "}
            <a
              href="/api/public"
              className="text-zinc-400 underline decoration-white/20 hover:text-white"
            >
              Open JSON →
            </a>
          </p>
        </section>
      </main>

      <SiteFooter tone="black" />
    </div>
  );
}
