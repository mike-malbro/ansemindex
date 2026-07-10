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

      <main className="w-full flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400">
          {INDEX_TICKER}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {INDEX_NAME}
        </h1>

        <ul className="mt-5 max-w-2xl space-y-2 text-sm leading-relaxed text-zinc-400">
          <li className="flex gap-2">
            <span className="text-zinc-600">·</span>
            <span>
              A list of Meteora DAMM v2 TOKEN–ANSEM pools. That is the index.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600">·</span>
            <span>
              Key market:{" "}
              <span className="text-zinc-200">{INDEX_POOL_PAIR}</span>
              {INDEX_POOL_LIVE ? (
                <>
                  {" "}
                  —{" "}
                  <a
                    href={INDEX_POOL_METEORA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-300 underline decoration-white/20 underline-offset-2 hover:text-white"
                  >
                    trade / LP on Meteora
                  </a>
                </>
              ) : (
                <span className="text-zinc-600"> (coming)</span>
              )}
              . {INDEX_TICKER} fees fund buybacks and growth.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600">·</span>
            <span>
              Invest in any Index pool individually on{" "}
              <a
                href="https://app.meteora.ag"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-300 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                Meteora
              </a>
              . Mike’s node is influence — your deposits are independent.
            </span>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          <a
            href={DEXSCREENER_INDEX_URL}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            DexScreener
            {!INDEX_POOL_LIVE && (
              <span className="ml-1 text-[10px] text-zinc-600">
                (placeholder)
              </span>
            )}
          </a>
          <Link
            href="/join"
            className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Join
          </Link>
          <Link
            href="/nodes"
            className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Nodes
          </Link>
          <Link
            href="/book"
            className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Full index
          </Link>
        </div>

        <section
          id="api"
          className="mt-10 w-full border-t border-white/10 pt-8"
        >
          <h2 className="text-sm font-semibold text-white">API</h2>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Public pool list. CORS open · no auth · no keys. Nodes and third
            parties pull this.
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
            <code className="text-zinc-500">pools[]</code> (share, mcap, amounts,
            Meteora / Dex links).{" "}
            <a
              href="/api/public"
              className="text-zinc-400 underline decoration-white/20 hover:text-white"
            >
              Open JSON →
            </a>
          </p>
        </section>

        <HomeIndex />
      </main>

      <SiteFooter tone="black" />
    </div>
  );
}
