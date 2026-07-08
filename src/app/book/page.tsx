import { IndexDashboard } from "@/components/IndexDashboard";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Index · ANSEM INDEX",
  description:
    "Controller wallet(0) TOKEN–ANSEM pools — the live index map, not our treasury.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteNav current="/book" />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          Live index from wallet(0). Stored in Postgres. Public read only — no
          keys.{" "}
          <a href="/whitepaper#index" className="text-sky-400 hover:underline">
            How the index works
          </a>
        </p>
      </div>
      <IndexDashboard />
    </div>
  );
}
