import MatchShell from "../Shell";
import MatchStats from "../MatchStats";
import { readMatch } from "../match";
import { matchStatsBoard } from "../../../../matchFeed";

// Championship Manager's second tab, filled at last.
//
// **`/team-stats` and not `/stats`**, which the Player Stats tab already holds.
// The two are a real pair and the names say which is which: this one is the two
// SIDES against each other, that one is every man in the match.
//
// Its own read rather than part of `readMatch`: `matchStatsBoard` is the only
// caller of `/stats/match` in the app, no other tab wants it, and folding it
// into the shared assembly would make four screens pay for one screen's request.

export const revalidate = 30;

export default async function MatchTeamStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  // A fixture FPL has not put in a gameweek has no round to resolve their id
  // from — a postponement loses its `event` — and so no board.
  const rows =
    match.fixture.gameweek === null
      ? null
      : await matchStatsBoard(match.fixture.gameweek, match.fixture.code);

  return (
    <MatchShell match={match} current="team-stats">
      <MatchStats rows={rows} home={match.home} away={match.away} />
    </MatchShell>
  );
}
