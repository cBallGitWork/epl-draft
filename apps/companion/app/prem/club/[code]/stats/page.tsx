import { squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import ClubShell from "../Shell";
import { clubOr404, leagueOpinions } from "../club";
import { fantasyDepth } from "../SquadTable";
import { positionsLabel } from "../../../../positions";
import PlayerBoard from "./PlayerBoard";
import type { Row } from "./PlayerBoard";

// The club's season, player by player.
//
// **The section's own idiom, which this screen did not have** (Craig, 3 Sep
// 2026: "stats is nothing like other sections, revamp, is for the players"). It
// was a club summary — a home-and-away comparison, four season figures and a
// leaders strip — while every other Stats tab in the app is a dense sortable
// table of PLAYERS. The club-level view it used to carry is `/prem` and
// `/prem/team-stats`, which rank all twenty and are better at it.
//
// The board's order matches the Squad tab's until a reader taps a head, which is
// the same promise `squad/[teamId]/stats` makes: two tabs about one squad should
// not disagree about who is first.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function ClubStatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const league = await leagueOpinions();

  const rows: Row[] = squadOf(snapshot, club.id)
    .sort(
      (a, b) =>
        fantasyDepth(league.get(a.code)) - fantasyDepth(league.get(b.code)) ||
        b.season.minutes - a.season.minutes ||
        a.name.localeCompare(b.name),
    )
    .map((player) => ({
      player,
      position: positionsLabel(league.get(player.code)?.positions ?? []),
    }));

  return (
    <ClubShell club={club} title="Stats" current="stats" empty={rows.length === 0 ? ["stats"] : []}>
      {rows.length === 0 ? (
        <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
      ) : (
        <PlayerBoard rows={rows} />
      )}
    </ClubShell>
  );
}
