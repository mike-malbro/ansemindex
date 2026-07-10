/**
 * Pull the public ANSEM LP INDEX list (no keys).
 * Usage: pnpm index
 *        pnpm index --csv
 */
import { config } from "./config.js";

const base =
  process.env.INDEX_API_URL ||
  config.cell?.hub?.publicApi ||
  "https://hub-production-7867.up.railway.app/api/public";

const wantCsv = process.argv.includes("--csv");
const url = wantCsv
  ? `${base}${base.includes("?") ? "&" : "?"}format=csv`
  : base;

const res = await fetch(url, {
  headers: { Accept: wantCsv ? "text/csv" : "application/json" },
});

if (!res.ok) {
  console.error(`[index] HTTP ${res.status} ${url}`);
  process.exit(1);
}

if (wantCsv) {
  const text = await res.text();
  process.stdout.write(text);
  process.exit(0);
}

const data = await res.json();
console.log(
  JSON.stringify(
    {
      name: data.name,
      ticker: data.ticker,
      total_pools: data.total_pools,
      total_position_usd: data.total_position_usd,
      total_fees_generated_usd: data.total_fees_generated_usd,
      generated_at: data.generated_at,
      docs: data.docs,
      influence: config.cell?.influence ?? null,
      pools: (data.pools ?? []).map((p) => ({
        rank: p.rank,
        pool: p.pool,
        share_pct: p.share_pct,
        market_cap_usd: p.market_cap_usd,
        position_value_usd: p.position_value_usd,
        meteora_url: p.meteora_url,
        dexscreener_url: p.dexscreener_url,
      })),
    },
    null,
    2,
  ),
);
