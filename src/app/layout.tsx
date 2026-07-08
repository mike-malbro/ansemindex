import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANSEM INDEX · How-to guide",
  description:
    "Creator fees buy tokens/ANSEM until 70% ANSEM, then all buybacks. DAMM v2 · run your own node. Public hub — no keys.",
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
