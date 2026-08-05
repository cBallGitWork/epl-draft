import { notFound } from "next/navigation";
import { getFootballSnapshot, hasGameweek } from "@epl/core";
import GameweekView from "../../components/GameweekView";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

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
  const snapshot = await getFootballSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  return <GameweekView snapshot={snapshot} />;
}
