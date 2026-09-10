import { shotsInFixture } from "@epl/core";
import MatchShell from "../Shell";
import MatchStats from "../MatchStats";
import ShotMap from "../ShotMap";
import { readMatch } from "../match";
import { intelShots } from "../../../../intel";
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
  const rows = await matchStatsBoard(match.fixture.gameweek, match.fixture.code);

  // **Where the shots came from, under the count of them.** The board says
  // fourteen and ten; the map says which of them were worth anything and from
  // where — the same question at two depths, which is why they share a tab.
  //
  // Split by club here, because the sister repo's export carries no team: it
  // keys on the FPL player code, and which side a man is on is a fact the
  // bootstrap already holds.
  const here = shotsInFixture(intelShots, match.fixture.id);
  const side = (id: number | undefined) =>
    [...here].flatMap(([code, shots]) => (match.byCode.get(code)?.clubId === id ? shots : []));

  return (
    <MatchShell match={match} current="team-stats">
      <div className="flex flex-col gap-2">
        <MatchStats rows={rows} />
        <ShotMap
          home={match.home}
          away={match.away}
          homeShots={side(match.home?.id)}
          awayShots={side(match.away?.id)}
        />
      </div>
    </MatchShell>
  );
}
