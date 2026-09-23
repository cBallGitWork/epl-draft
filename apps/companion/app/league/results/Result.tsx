import { leads, type PeriodPairing, type LeagueTeam } from "@epl/core";
import ScoreRow from "../../components/shell/ScoreRow";
import Absent from "@/app/components/shell/Absent";
import { matchupHref } from "../routes";

// One finished head-to-head, as Championship Manager's results row.
//
// The row is `components/shell/ScoreRow`, shared with the Live tab and with the
// schedule — its docblock carries the measurements off `craig/01-evening-
// results.jpg`. Craig, 5 Sep 2026: *"draft restults the same, CM it."* And that
// is the whole of this file's job now: it used to hand-draw a scoreline of its
// own, with its own `v`, its own crest size and its own idea of how a winner is
// marked.
//
// **The winner is said by the LOSER dimming, which is a change.** This bolded
// the winner and left the loser at `text-muted`, so a drawn tie printed two muted
// names and no white one — the only row on the page where neither side is the
// colour a name is. `ScoreRow` takes `lost` instead: both names are white until
// one side is actually behind, and then that one alone goes quiet. The reference
// prints both scores in the same cyan, so the figure cannot carry it and the name
// has to.
//
// Marking a winner at all is only safe because the page hands this FINISHED
// rounds — see `gameweekStatus` in core.

export default function Result({
  pairing,
  points,
  badges,
  places,
  mine,
  gameweek,
}: {
  pairing: PeriodPairing;
  /** The round this result belongs to, so a side opens the head-to-head ON ITS
   *  OWN WEEK rather than on whatever Fantrax is pointing at today. Without it
   *  a September result opened December's tie. */
  gameweek: number;
  /** Each side's settled total for the period, by team id. */
  points: Map<string, number | null>;
  badges: Map<string, string>;
  /** Each team's place in the table, for CM's blue block. Today's standing, not
   *  the one it held on the week of the result — the table is a running order
   *  and this app holds no history of it. */
  places: Map<string, number>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
}) {
  const home = points.get(pairing.home.teamId) ?? null;
  const away = points.get(pairing.away.teamId) ?? null;
  const yours = pairing.home.teamId === mine || pairing.away.teamId === mine;
  // Opened on the reader's own side when he is in it, else on the home side.
  const opensOn = yours ? mine : pairing.home.teamId;

  return (
    <ScoreRow
      home={side(pairing.home, badges, places, mine, leads(away, home))}
      away={side(pairing.away, badges, places, mine, leads(home, away))}
      score={{ home: figure(home), away: figure(away) }}
      href={matchupHref(opensOn, gameweek)}
    />
  );
}

/** Absence, never a nought. A period Fantrax has not scored was not drawn 0-0,
 *  and `PeriodResult.points` is null exactly when it could not be read. */
function figure(value: number | null) {
  return value === null ? <Absent /> : value;
}

function side(
  team: LeagueTeam,
  badges: Map<string, string>,
  places: Map<string, number>,
  mine: string | null,
  lost: boolean,
) {
  return {
    name: team.name,
    badge: badges.get(team.teamId),
    place: places.get(team.teamId) ?? null,
    mine: team.teamId === mine,
    lost,
  };
}
