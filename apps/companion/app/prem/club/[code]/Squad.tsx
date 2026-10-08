import type { Club, FootballPlayer } from "@epl/core";
import ListAndPitch from "@/app/components/league/ListAndPitch";
import { positionsLabel } from "../../../positions";
import Eleven from "./Eleven";
import type { ElevenLine } from "./Eleven";
import SquadTable, { type SquadMinutes } from "./SquadTable";
import type { LeagueOpinion } from "../../leagueOpinions";

// A club's squad and its predicted eleven: side by side on a desk, a toggle below `lg` (Craig, 3 Sep 2026).
// The list opens first: the squad is a fact and the eleven a prediction (DESIGN §9).

export default function Squad({
  players,
  league,
  minutes,
  club,
  eleven,
  formation,
  against,
  updated,
}: {
  players: readonly FootballPlayer[];
  league: ReadonlyMap<number, LeagueOpinion>;
  /** One gameweek's xMins by FPL code, or null when the export does not cover the club's next week. */
  minutes: SquadMinutes | null;
  club: Club;
  /** The predicted eleven in its lines, or empty when there is no prediction —
   *  which is an ordinary state, not a fault: the export runs by hand. */
  eleven: ElevenLine[];
  formation: string | null;
  /** "v Chelsea · Sun 6 Sep", or null when there is no next match. */
  against: string | null;
  /** When Scout last updated the eleven — "Fri 4 Sept, 17:52". */
  updated: string | null;
}) {
  const list = <SquadTable players={players} league={league} minutes={minutes} />;
  // No eleven, no toggle: it would be a control with nothing to decide.
  if (eleven.length === 0 || formation === null) return <div className="flex flex-col gap-2">{list}</div>;

  const byCode = new Map(players.map((player) => [player.code, player]));
  return (
    <ListAndPitch
      opens="list"
      list={list}
      pitch={
        <Eleven
          lines={eleven}
          against={against}
          updated={updated}
          club={club}
          playerOf={(code) => byCode.get(code) ?? null}
          positionOf={(code) => positionsLabel(league.get(code)?.positions ?? [])}
        />
      }
    />
  );
}
