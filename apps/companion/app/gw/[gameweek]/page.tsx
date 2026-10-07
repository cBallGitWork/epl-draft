import { notFound } from "next/navigation";
import { hasGameweek } from "@epl/core";
import GameweekView from "../../components/football/GameweekView";
import { footballNow, gameweekSnapshot } from "../../football";
import { marks } from "../../involvement";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function GameweekPage({
  // Next 16 hands route params as a promise.
  params,
}: {
  params: Promise<{ gameweek: string }>;
}) {
  const { gameweek } = await params;
  const requested = Number(gameweek);

  // Reject anything that is not a plain round number before asking FPL for it —
  // "3.5" and "3abc" both coerce to something Number will happily accept.
  if (!Number.isInteger(requested)) notFound();

  // The current round from `footballNow`, which every screen keeps warm: `gameweekSnapshot` is warmed
  // only here, so a live round read through it would serve a stale score in the present tense.
  const current = await footballNow();
  const snapshot = requested === current.gameweek ? current : await gameweekSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  // Marked from today's squads, even on a past round: rosters by period are unproven (PLATFORM_NOTES).
  const league = await marks(snapshot.fixtures);
  return <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} />;
}
