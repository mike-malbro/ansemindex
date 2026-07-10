/**
 * Client-side index exports — Excel-compatible CSV + printable PDF report.
 */
import type { IndexPayload, IndexPoolRow } from "./types";
import { INDEX_NAME, INDEX_TICKER } from "./config";
import { fmtMoney } from "./format";

function stamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Excel-friendly CSV (UTF-8 BOM). Opens in Excel / Sheets. */
export function downloadIndexExcel(data: IndexPayload) {
  const headers = [
    "rank",
    "pool",
    "token",
    "pool_address",
    "token_mint",
    "share_pct",
    "market_cap_usd",
    "position_value_usd",
    "fees_generated_usd",
    "claimed_fees_usd",
    "compounded_fees_usd",
    "unclaimed_fees_usd",
    "pool_tvl_usd",
    "volume_24h_usd",
    "price_change_24h",
    "meteora_url",
    "dexscreener_url",
  ];

  const rows = data.pools.map((p, i) =>
    [
      i + 1,
      `${p.token_symbol}-ANSEM`,
      p.token_symbol,
      p.pool_address,
      p.token_mint,
      (p.share_pct ?? 0).toFixed(4),
      p.market_cap_usd ?? "",
      p.position_value_usd,
      p.fees_generated_usd,
      p.claimed_fees_usd,
      p.compounded_fees_usd,
      p.unclaimed_fees_usd,
      p.pool_tvl_usd ?? "",
      p.volume_24h_usd ?? "",
      p.price_change_24h ?? "",
      `https://app.meteora.ag/pools/${p.pool_address}`,
      `https://dexscreener.com/solana/${p.token_mint}`,
    ]
      .map(csvEscape)
      .join(","),
  );

  const meta = [
    `# ${INDEX_NAME} (${INDEX_TICKER})`,
    `# generated ${new Date().toISOString()}`,
    `# pools ${data.total_pools}`,
    `# index_usd ${data.total_position_usd}`,
    `# fees_generated_usd ${data.total_fees_generated_usd}`,
    `# api GET /api/public`,
    headers.join(","),
    ...rows,
  ].join("\n");

  downloadBlob(
    new Blob(["\uFEFF" + meta], { type: "text/csv;charset=utf-8" }),
    `${INDEX_TICKER.replace("$", "")}-index-${stamp()}.csv`,
  );
}

function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal PDF table report (Courier, no deps). */
export function downloadIndexPdf(data: IndexPayload) {
  const title = `${INDEX_NAME} · Pool Report`;
  const generated = new Date().toISOString();
  const lines: string[] = [
    title,
    `${INDEX_TICKER} · ${data.total_pools} pools · index ${fmtMoney(data.total_position_usd)} · fees ${fmtMoney(data.total_fees_generated_usd)}`,
    `Generated ${generated}`,
    "",
    "Rank  Pool            Share%    Mcap         Amount       Fees",
    "----  --------------  --------  -----------  -----------  -----------",
  ];

  const top: IndexPoolRow[] = data.pools.slice(0, 45);
  for (let i = 0; i < top.length; i++) {
    const p = top[i]!;
    const rank = String(i + 1).padStart(4);
    const pool = `${p.token_symbol}-ANSEM`.padEnd(14).slice(0, 14);
    const share = `${(p.share_pct ?? 0).toFixed(1)}%`.padStart(8);
    const mcap = fmtMoney(p.market_cap_usd).padStart(11);
    const amt = fmtMoney(p.position_value_usd).padStart(11);
    const fees = fmtMoney(p.fees_generated_usd).padStart(11);
    lines.push(`${rank}  ${pool}  ${share}  ${mcap}  ${amt}  ${fees}`);
  }

  if (data.pools.length > top.length) {
    lines.push("");
    lines.push(
      `… ${data.pools.length - top.length} more — Excel export or GET /api/public`,
    );
  }
  lines.push("");
  lines.push("Invest individually on Meteora. Public API: GET /api/public");

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const fontSize = 8;
  const lineH = 11;
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineH);

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push([title]);

  const objects: string[] = [];

  function addObj(body: string): number {
    objects.push(body);
    return objects.length;
  }

  const fontId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
  );

  const contentIds: number[] = [];
  for (const pageLines of pages) {
    let y = pageHeight - margin - fontSize;
    const ops = [`BT`, `/F1 ${fontSize} Tf`, `${margin} ${y} Td`];
    pageLines.forEach((line, i) => {
      const text = pdfEscape(line);
      if (i === 0) ops.push(`(${text}) Tj`);
      else ops.push(`0 -${lineH} Td (${text}) Tj`);
    });
    ops.push("ET");
    const stream = ops.join("\n");
    contentIds.push(
      addObj(`<< /Length ${byteLen(stream)} >>\nstream\n${stream}\nendstream`),
    );
  }

  const pageIds: number[] = [];
  const pagesPlaceholder = "PAGES_ID";
  for (let i = 0; i < pages.length; i++) {
    pageIds.push(
      addObj(
        `<< /Type /Page /Parent ${pagesPlaceholder} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
      ),
    );
  }

  const pagesId = addObj(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  );

  for (let i = 0; i < pageIds.length; i++) {
    const idx = pageIds[i]! - 1;
    objects[idx] = objects[idx]!.replace(
      `${pagesPlaceholder} 0 R`,
      `${pagesId} 0 R`,
    );
  }

  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(byteLen(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefPos = byteLen(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;

  downloadBlob(
    new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" }),
    `${INDEX_TICKER.replace("$", "")}-index-${stamp()}.pdf`,
  );
}
