import type { ExpectedMinutes } from "../football/intel/minutes";
import type { Opposition } from "../football/opposition";
import type { Club } from "../football/types";
import { lineup, type SquadLine } from "./lineup";
import { isResolved, type RosteredPlayer, type RosteredTeam } from "./roster";

// A squad with everything a reader needs against each name: who he is, his club's match, and what our league scores him.

/** One roster slot with everything known about it. */
export interface SquadPlayerDetail {
  /** The slot, with `slot.status` blanked — see `WITHHELD` below. */
  rostered: RosteredPlayer;
  /** His real club; undefined for a slot the bridge could not settle. */
  club: Club | undefined;
  /** His club's match this round; undefined for a blank gameweek and for an unresolved slot alike. */
  opposition: Opposition[] | undefined;
  /** Fantasy points: `undefined` no table, so no column; `null` a table with no number for him; else his. */
  points: number | null | undefined;
  /** His xMins from the gameweek on screen on, that gameweek first; the same length for every man on a screen, and
   *  empty on one that shows none. */
  minutes: ExpectedMinutes[];
}

/** A screen's xMins run for a man by FPL code, from its own gameweek; null is a slot the bridge has not settled. */
export type MinutesRun = (code: number | null) => ExpectedMinutes[];

/** For a screen that shows no xMins. */
export const NO_MINUTES: MinutesRun = () => [];

export interface SquadDetailLine {
  position: string;
  players: SquadPlayerDetail[];
}

/** What `slot.status` becomes on the way out, so a client payload never leaks the XI; `isActive` reads it as not active. */
const WITHHELD = "";

export function squadDetail(
  lines: SquadLine[],
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  /** Null when the provider would not answer; an empty map answered and names nobody. */
  points: Map<string, number | null> | null,
  minutes: MinutesRun,
): SquadDetailLine[] {
  return lines.map((line) => ({
    position: line.position,
    players: line.players.map((rostered) => playerDetail(rostered, clubs, opposition, points, minutes)),
  }));
}

/** The eleven in their lines and the reserves under them, each with the same detail. The arrangement is read here,
 *  on the server, the last place it exists: `playerDetail` blanks it on the way out. */
export interface LineupDetail {
  rows: SquadDetailLine[];
  /** RESERVE slots, in position order. */
  bench: SquadPlayerDetail[];
  /** The formation as `lineup()` counts it, "1-3-4-3": men per line in pitch order, never a parsed shape. */
  shape: string;
}

export function lineupDetail(
  team: RosteredTeam,
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  points: Map<string, number | null> | null,
  minutes: MinutesRun,
): LineupDetail {
  const { lines, bench, shape } = lineup(team);
  const detail = (rostered: RosteredPlayer) => playerDetail(rostered, clubs, opposition, points, minutes);
  return {
    rows: lines.map((line) => ({ position: line.position, players: line.players.map(detail) })),
    bench: bench.map(detail),
    shape,
  };
}

/** One slot's detail, for a planner that rearranges the squad in the browser. */
export function playerDetail(
  rostered: RosteredPlayer,
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  points: Map<string, number | null> | null,
  minutes: MinutesRun,
): SquadPlayerDetail {
  const clubId = isResolved(rostered) ? rostered.player.clubId : null;
  return {
    rostered: { ...rostered, slot: { ...rostered.slot, status: WITHHELD } },
    club: clubId === null ? undefined : clubs.get(clubId),
    opposition: clubId === null ? undefined : opposition.get(clubId),
    // `?? null`, not `undefined`: a table that does not name him has still answered, so he gets a dash.
    points: points === null ? undefined : (points.get(rostered.slot.fantraxId) ?? null),
    minutes: minutes(isResolved(rostered) ? rostered.player.code : null),
  };
}
