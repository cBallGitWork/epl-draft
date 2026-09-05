import type { LiveTie } from "./liveTie";

// Your tie's score, in the Live plate of the phone's foot row.
//
// **Championship Manager's own precedent is the count in the label** — its
// fitness screen's tab reads `Fitness (40)`, so a navigation plate carrying a
// figure is the game's idiom rather than a liberty taken with it. Here the
// figure is the one number a manager wants on a Saturday, and the plate is
// already on every screen he can be on.
//
// It is what lets the red LIVE strip stand down below `lg` (Craig, 5 Sep 2026):
// the strip was 44px of a 390px screen spent saying a thing the nav can say in
// the room it already occupies.
//
// **No trailing dim, and that is the difference from the strip.** `LiveStrip`
// dims the losing side because it is a SCORELINE — two sides being compared. A
// plate 65px wide with a two-line label is a count, and a figure at 70% opacity
// inside chrome at `text-xs` is a smudge rather than a signal.

export default async function LiveCount({ tie }: { tie: Promise<LiveTie | null> }) {
  const live = await tie;
  if (live === null) return null;
  return (
    <span className="numeric text-xs font-bold">
      {live.yours ?? "—"} v {live.theirs ?? "—"}
    </span>
  );
}
