import { isActive } from "../league/rosterStatus";
import { playerName, type RosteredPlayer, type RosteredTeam } from "./roster";

// A roster arranged the way a team lines up. Fantrax has no formation field, so the shape is counted, never read.

/** Back to front: the one football fact the league's letters do not carry. Declared once, never at a render site. */
const PITCH_ORDER = ["G", "D", "M", "F"];

/** One row of the pitch: everyone the manager has playing in that position. */
export interface LineupLine {
  /** Fantrax's letter, verbatim and never translated. */
  position: string;
  players: RosteredPlayer[];
}

export interface Lineup {
  lines: LineupLine[];
  /** RESERVE slots, in the same position order. */
  bench: RosteredPlayer[];
  /** e.g. "1-3-4-3", as a manager would say it; empty when nobody is active yet. */
  shape: string;
}

/** The bucket for a slot with no position, which Fantrax allows: carried, never dropped. */
const UNPLACED = "";

/** Whether this position stands in goal: the letter at the back of `PITCH_ORDER`. */
export function isGoalkeeper(position: string | null): boolean {
  return position === PITCH_ORDER[0];
}

/** How far up the pitch a position stands, for ordering. */
export function positionDepth(position: string): number {
  const at = PITCH_ORDER.indexOf(position);
  // A letter we have never seen goes to the front, never silently into goal.
  return at === -1 ? PITCH_ORDER.length : at;
}

/** Position letters back to front, for `.sort`. */
export const byPositionDepth = (a: string, b: string): number => positionDepth(a) - positionDepth(b);

/** One row of the pitch with everybody in it, reserves included. */
export interface SquadLine {
  position: string;
  /** Active players first, then reserves — the order they would stand in. */
  players: RosteredPlayer[];
}

/** The squad in lines back to front, the order within each left to the caller. Grouped by the slot the manager
 *  chose, never by eligibility, which would put a two-position man in two lines. */
function linesOf(
  team: RosteredTeam,
  within: (a: RosteredPlayer, b: RosteredPlayer) => number,
): SquadLine[] {
  const byPosition = new Map<string, RosteredPlayer[]>();

  for (const player of team.players) {
    const position = player.slot.position ?? UNPLACED;
    const line = byPosition.get(position);
    if (line) line.push(player);
    else byPosition.set(position, [player]);
  }

  return [...byPosition.entries()]
    .map(([position, players]) => ({ position, players: [...players].sort(within) }))
    .sort((a, b) => byPositionDepth(a.position, b.position));
}

/** A rival's squad before his period opens, in lines with nothing about who starts. Alphabetical within a line,
 *  which is load-bearing: any order the roster carries would leak the XI. */
export function squadUnarranged(team: RosteredTeam): SquadLine[] {
  return linesOf(team, (a, b) => playerName(a).localeCompare(playerName(b)));
}

export function lineup(team: RosteredTeam): Lineup {
  const active = new Map<string, RosteredPlayer[]>();
  const bench: RosteredPlayer[] = [];

  for (const player of team.players) {
    const position = player.slot.position ?? UNPLACED;
    if (isActive(player.slot)) {
      const line = active.get(position);
      if (line) line.push(player);
      else active.set(position, [player]);
    } else {
      bench.push(player);
    }
  }

  const lines = [...active.entries()]
    .map(([position, players]) => ({ position, players }))
    .sort((a, b) => byPositionDepth(a.position, b.position));

  const benchDepth = (player: RosteredPlayer) => positionDepth(player.slot.position ?? UNPLACED);
  bench.sort((a, b) => benchDepth(a) - benchDepth(b));

  return { lines, bench, shape: lines.map((line) => line.players.length).join("-") };
}
