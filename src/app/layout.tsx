import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANSEM INDEX",
  description:
    "Independent Meteora DAMM v2 LP terminal for the ANSEM index — read-only portfolio viewer.",
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
