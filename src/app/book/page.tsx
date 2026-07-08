import { Terminal } from "@/components/Terminal";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Controller book · ANSEM INDEX",
  description:
    "Read-only TOKEN–ANSEM pools on the controller wallet — the map, not our treasury.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <SiteNav current="/book" />
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 sm:px-6">
        <p className="mx-auto max-w-[1400px] font-mono text-[11px] text-zinc-500">
          Controller book — public read of recent TOKEN–ANSEM pools. Not our fee
          treasury (that starts at $0).{" "}
          <a href="/" className="text-sky-400 hover:underline">
            Back to guide
          </a>
        </p>
      </div>
      <Terminal embedded />
    </div>
  );
}
