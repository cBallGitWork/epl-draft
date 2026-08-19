import type { Opposition } from "../football/opposition";
import type { Club } from "../football/types";
import type { SquadLine } from "./lineup";
import { isResolved, type RosteredPlayer } from "./roster";

// A squad with everything a reader needs against each name: who he is, who his
// club plays this week, and what our league scores him.
//
// One resolution rather than three. The pitch, the list and the player card each
// asked the same two questions of the same two maps — "which club is this?" and
// "who do they play?" — and the third copy is the one that makes it a rule (§1).
// Worse than the duplication was where it happened: on the browser, which meant
// shipping every club and every fixture in the round so fifteen players could
// look two of them up.
//
// Pure, and both maps arrive as arguments. The football layer is not imported
// here so much as handed over: `Club` and `Opposition` are football facts, the
// roster is league state, and this file is the only place the two meet for a
// squad — which is the same seam `roster.ts` already owns for identity.

/** One roster slot with everything known about it. */
export interface SquadPlayerDetail {
  rostered: RosteredPlayer;
  /** His real club. Undefined for a slot the bridge could not settle — there is
   *  no footballer behind it, so there is no club either. */
  club: Club | undefined;
  /** His club's match this round. Undefined for a blank gameweek *and* for an
   *  unresolved slot; a view has the same nothing to draw in both cases. */
  opposition: Opposition[] | undefined;
  /** Fantasy points, in three states that a view must keep apart:
   *  `undefined` — there is no points table at all, so no column;
   *  `null` — the table exists and has no number for him;
   *  a number — his. */
  points: number | null | undefined;
}

export interface SquadDetailLine {
  position: string;
  players: SquadPlayerDetail[];
}

export function squadDetail(
  lines: SquadLine[],
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  /** Null when the provider would not answer. Distinct from an empty map, which
   *  is a table that answered and simply names nobody. */
  points: Map<string, number | null> | null,
): SquadDetailLine[] {
  return lines.map((line) => ({
    position: line.position,
    players: line.players.map((rostered) => detail(rostered, clubs, opposition, points)),
  }));
}

function detail(
  rostered: RosteredPlayer,
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  points: Map<string, number | null> | null,
): SquadPlayerDetail {
  const clubId = isResolved(rostered) ? rostered.player.clubId : null;
  return {
    rostered,
    club: clubId === null ? undefined : clubs.get(clubId),
    opposition: clubId === null ? undefined : opposition.get(clubId),
    // `?? null` and not `?? undefined`: a table that does not name him has still
    // answered, and a row that silently dropped its column would leave a column
    // of numbers with a hole in it rather than a dash.
    points: points === null ? undefined : (points.get(rostered.slot.fantraxId) ?? null),
  };
}
