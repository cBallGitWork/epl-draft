import MatchShell from "../Shell";
import PlayerStats from "../PlayerStats";
import { readMatch } from "../match";

// Every man in the match and what he did in it, on a tab of its own.
//
// Craig, 5 Sep 2026: *"player stats can be its own blue bar at the top of the
// match page, remove from overview."* It was the second half of the Overview,
// under the scoresheet and the facts line — which made that screen two screens
// and buried the thing CM's own Overview is: a dated head, who scored and when,
// and a foot line. `cm0102/02.jpg` has no table on it at all, and it has a FOOT
// ROW of five buttons for everything that is a table.
//
// A tab rather than that foot row, because this app's match screen already has a
// strip and CM's own second row is a thing `SectionNav` records the absence of.
//
// The table itself is unchanged and still `PlayerStats`, which keeps its own
// docblock on why it is one table across both clubs and how it splits columns
// with the Fantasy Scores tab.

export const revalidate = 30;

export default async function MatchStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);

  return (
    <MatchShell match={match} current="stats">
      <PlayerStats match={match} />
    </MatchShell>
  );
}
