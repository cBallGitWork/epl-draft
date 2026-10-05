import { isActive } from "../league/rosterStatus";
import { playerName, type RosteredPlayer, type RosteredTeam } from "./roster";

// A roster arranged the way a team lines up, rather than the way Fantrax lists
// it. Pure: same team in, same shape out.
//
// Fantrax has no formation field. `getTeamRosters` gives each slot a position
// letter and ACTIVE or RESERVE, and nothing else — so the formation is not
// something we read, it is something we count. That is fine, and it is exactly
// what FPL's "1-4-4-2" encodes anyway.

/** Back to front.
 *
 *  This is the one football fact the league layer's letters do not carry.
 *  `getLeagueInfo` gives the vocabulary and the per-position caps — for our
 *  league `{ G: 1, D: 5, M: 5, F: 3 }` — but nothing in it says a goalkeeper
 *  stands behind a defender. Declared once here rather than assumed at a render
 *  site, and it moves with the adapter on the day a league uses other letters. */
const PITCH_ORDER = ["G", "D", "M", "F"];

/** One row of the pitch: everyone the manager has playing in that position. */
export interface LineupLine {
  /** Fantrax's letter, verbatim. Never translated — it is what the commissioner
   *  set and what the manager sees in Fantrax. */
  position: string;
  players: RosteredPlayer[];
}

export interface Lineup {
  lines: LineupLine[];
  /** RESERVE slots, in the same position order. Kept separate because the
   *  active/reserve split is the whole point of a lineup, not a filter over it. */
  bench: RosteredPlayer[];
  /** e.g. "1-3-4-3" — the outfield shape as a manager would say it. Empty when
   *  nobody is active yet. */
  shape: string;
}

/** A slot with no position cannot be placed on a pitch. Fantrax allows it and we
 *  carry it rather than dropping the player, so it needs a bucket of its own. */
const UNPLACED = "";

/** Whether this position is the one that stands in goal.
 *
 *  The same single declaration `PITCH_ORDER` rests on, asked a second question:
 *  the letter at the back is the keeper. Here rather than at a render site for
 *  the reason given above — a league that files its keepers under "GK" should
 *  need one edit, not two, and a keeper drawn in an outfield shirt is exactly
 *  the kind of quiet wrongness that survives review. */
export function isGoalkeeper(position: string | null): boolean {
  return position === PITCH_ORDER[0];
}

/** How far up the pitch a position stands, for ordering.
 *
 *  Exported because the squad view orders by it too — and ordering a squad list
 *  by a second copy of `["G","D","M","F"]` at the render site is exactly what
 *  the note above forbids. One definition, both consumers. */
export function positionDepth(position: string): number {
  const at = PITCH_ORDER.indexOf(position);
  // A letter we have never seen goes to the front rather than silently into
  // goal — a commissioner adding "W" for wingers should look wrong, not wrong
  // in a way that reads as correct.
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

/** The squad grouped into positional lines, ordered back to front, with the
 *  ordering *within* each line left to the caller.
 *
 *  Grouped by `slot.position` — the position the manager has him filling — and
 *  never by what he is eligible for. Fantrax supports multi-position players
 *  ("F,M" is common), so eligibility would put the same footballer in two lines
 *  or make this file pick one of them for him. The manager already picked. */
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

/** The whole squad in positional lines, with the arrangement stripped out.
 *
 *  What a manager may see of a rival's team before the period opens: fifteen
 *  players, grouped by the position each is filling, and nothing about who
 *  starts. Ordering it by anything the roster carries would restate the XI as an
 *  ordering, which is the leak the gate exists to prevent.
 *
 *  Alphabetical within a line, and that is load-bearing rather than tidy.
 *  Fantrax happens to return actives and reserves interleaved, so payload order
 *  happens not to leak the lineup today; that is their serialisation detail, not
 *  a promise. Sorting by name makes the non-leak a property of this file. */
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
