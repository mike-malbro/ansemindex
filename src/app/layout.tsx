import type { Metadata } from "next";
import "./globals.css";
import { INDEX_NAME, INDEX_TICKER } from "@/lib/config";

export const metadata: Metadata = {
  title: `${INDEX_TICKER} · ${INDEX_NAME}`,
  description: `${INDEX_NAME} (${INDEX_TICKER}) — TOKEN–ANSEM pool index. Creator fees buy ANSEM. Public hub — no keys.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-950 font-mono text-zinc-100">
        {children}
      </body>
    </html>
  );
}
