import { leads, type PeriodPairing, type LeagueTeam } from "@epl/core";
import ScoreRow from "../../components/shell/ScoreRow";
import Absent from "@/app/components/shell/Absent";
import { tieHref } from "../routes";

// One finished head-to-head as CM's results row (`shell/ScoreRow`, Craig, 5 Sep 2026): the loser dims, so a draw keeps
// two white names. Safe because the page hands this finished rounds only.

export default function Result({
  pairing,
  points,
  places,
  mine,
  gameweek,
}: {
  pairing: PeriodPairing;
  /** The result's own gameweek, so a side opens its head-to-head on that week. */
  gameweek: number;
  /** Each side's settled total for the period, by team id. */
  points: Map<string, number | null>;
  /** Each team's place today, for CM's blue block: the app keeps no history of the table. */
  places: Map<string, string>;
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
      home={side(pairing.home, places, mine, leads(away, home))}
      away={side(pairing.away, places, mine, leads(home, away))}
      score={{ home: figure(home), away: figure(away) }}
      href={tieHref(opensOn, gameweek, pairing.home.teamId, pairing.away.teamId)}
    />
  );
}

/** Absence, never a nought: `points` is null exactly when Fantrax's cell could not be read. */
function figure(value: number | null) {
  return value === null ? <Absent /> : value;
}

function side(team: LeagueTeam, places: Map<string, string>, mine: string | null, lost: boolean) {
  return {
    name: team.name,
    place: places.get(team.teamId) ?? null,
    mine: team.teamId === mine,
    lost,
  };
}
