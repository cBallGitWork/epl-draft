import Link from "next/link";

// The one thing on the front page that is not news: football is on right now,
// and the paper's job at that moment is to get out of the way.

export default function Live() {
  return (
    <Link
      href="/matchday"
      className="elev flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line border-l-4 border-l-live bg-surface px-3 py-2.5"
    >
      <span className="font-semibold">Your head-to-head is live</span>
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-live">
        <span className="live-dot" />
        Watch
      </span>
    </Link>
  );
}
