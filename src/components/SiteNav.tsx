import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Creators" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/manage", label: "Manage" },
] as const;

export function SiteNav({ current }: { current?: string }) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
          $ANSEMINDEX
          <span className="ml-2 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
            creators
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((l) => {
            const active = current === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-2.5 py-1 font-mono text-[11px] transition ${
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
