import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$ANSEMINDEX · Creator wallets",
  description:
    "Creator wallets seeding TOKEN–ANSEM pools. Click a creator to drill down. Public hub — no keys.",
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
