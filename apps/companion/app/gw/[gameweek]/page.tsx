import { notFound } from "next/navigation";
import { hasGameweek } from "@epl/core";
import GameweekView from "../../components/football/GameweekView";
import { gameweekSnapshot } from "../../football";
import { marks } from "../../involvement";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
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
  // Read through the cached wrapper rather than the adapter directly: the cookie
  // below makes this route dynamic, so without it every arrival would refetch a
  // round of February that is the same bytes for everyone who asks.
  const snapshot = await gameweekSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  // Marked from TODAY's squad, including on a round played in October. That is
  // deliberate and it is the actual Monday question — "which of these results
  // matter to me" is asked by the man who owns those players now. A squad as it
  // stood in week six would need `getTeamRosters?period=`, which has never been
  // proven to serve history (PLATFORM_NOTES, still open).
  const league = await marks(snapshot.fixtures);
  return <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} />;
}
