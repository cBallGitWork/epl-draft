import { notFound } from "next/navigation";
import { hasGameweek } from "@epl/core";
import GameweekView from "../../components/football/GameweekView";
import { footballNow, gameweekSnapshot } from "../../football";
import { marks } from "../../involvement";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
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

  // Validated against the season FPL actually published, not a hardcoded 38.
  // Read through a cached wrapper rather than the adapter directly: the cookie
  // below makes this route dynamic, so without it every arrival would refetch a
  // round of February that is the same bytes for everyone who asks.
  //
  // **Which wrapper matters, and getting it wrong showed.** `gameweekSnapshot` is
  // reached from this route and nowhere else, and `unstable_cache` serves a stale
  // entry while it revalidates — so on a quiet round nothing warms it and the
  // first reader gets whatever was true last time somebody looked. On 22 Aug that
  // was 68 minutes: /gw/1 rendered "BRE 2–0 Live 45′" while /matchday, in the same
  // second, rendered "BRE 3–0 FT". A page may be stale; it may not be stale in the
  // present tense.
  //
  // So the current round comes from `footballNow`, which every other screen keeps
  // warm, and `gameweekSnapshot` keeps the job its own docblock describes — a
  // round in February, the same bytes every time anyone asks.
  const current = await footballNow();
  const snapshot = requested === current.gameweek ? current : await gameweekSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  // Marked from TODAY's squad, including on a round played in October. That is
  // deliberate and it is the actual Monday question — "which of these results
  // matter to me" is asked by the man who owns those players now. A squad as it
  // stood in week six would need `getTeamRosters?period=`, which has never been
  // proven to serve history (PLATFORM_NOTES, still open).
  const league = await marks(snapshot.fixtures);
  return <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} />;
}
