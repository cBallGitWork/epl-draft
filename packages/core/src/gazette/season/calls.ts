import { SEASON_RANKINGS } from "../../config";
import type { Availability } from "../../football/playerState";
import { editorsOrder, type AppliedMove, type EditorMove } from "./editor";
import type { PlayedSeason } from "./play";

// Every call in Lawro's power rankings, made here: the order of the squads as drafted, and for each side the man it is
// built round and its weak spot. The writer only words them. Pure.

/** One squad man as the column may name him. His season figure orders men and is never printed. */
export interface CallMan {
  fantraxId: string;
  name: string;
  club: string;
  season: number;
  availability: Availability;
  /** Where the draft took him, overall from 1; null for a man the draft did not take. */
  overall: number | null;
}

/** Where a side's elevens rank against the other sides' at one slot, 1 the best. */
export interface LineRank {
  slot: string;
  rank: number;
}

/** What a side's line holds against it: the man it is built round in doubt, or its weakest slot. */
type Weakness = { kind: "doubt"; man: CallMan } | ({ kind: "line" } & LineRank);

export interface SeasonSide {
  teamId: string;
  name: string;
  place: number;
  /** The first man it drafted: the man it is built round. */
  first: CallMan | null;
  /** Its best man by the season's reading, when he is not the first. */
  best: CallMan | null;
  strongest: LineRank | null;
  weakness: Weakness | null;
  /** Which of the two the line opens on, alternating down the rankings so ten lines do not open alike. */
  lead: "man" | "weakness";
}

export interface SeasonCalls {
  /** Strongest squad first, as printed: the code's order with the editor's moves, which the column never moves. */
  sides: SeasonSide[];
  /** The editor's moves as applied, for the record the story files. */
  moved: AppliedMove[];
  /** How many squads are clear of the rest at the top: 0, 1 or 2. */
  clear: number;
}

/** Null for a league too small to rank. `moves` are the editor's calls over the code's order. */
export function seasonCalls(played: PlayedSeason, squads: ReadonlyMap<string, readonly CallMan[]>, moves: readonly EditorMove[]): SeasonCalls | null {
  if (played.table.length < 3) return null;
  const { order: table, applied } = editorsOrder(played.table, moves);
  const sides = table.map((row, at): SeasonSide => {
    const men = [...(squads.get(row.teamId) ?? [])].sort((a, b) => b.season - a.season || a.name.localeCompare(b.name, "en"));
    const first = men.filter((man) => man.overall !== null).sort((a, b) => (a.overall ?? 0) - (b.overall ?? 0))[0] ?? null;
    const best = men[0] !== undefined && men[0].fantraxId !== first?.fantraxId ? men[0] : null;
    const ranks = lineRanks(played.lines, row.teamId);
    const doubt = [first, best].find((man): man is CallMan => man !== null && serious(man.availability));
    const weakest = ranks.at(-1);
    return {
      teamId: row.teamId,
      name: row.name,
      place: at + 1,
      first,
      best,
      strongest: ranks[0] ?? null,
      weakness: doubt !== undefined ? { kind: "doubt", man: doubt } : weakest === undefined ? null : { kind: "line", ...weakest },
      lead: at % 2 === 0 ? "man" : "weakness",
    };
  });
  return { sides, moved: applied, clear: clearAtTop(played.table, table) };
}

/** How many squads are clear at the top by the season's places, 1 or 2, while the editor prints those same squads
 *  there; 0 when none are. */
function clearAtTop(code: PlayedSeason["table"], printed: readonly { teamId: string }[]): number {
  const leaders = [1, 2].find((count) => {
    const top = new Set(code.slice(0, count).map((row) => row.teamId));
    return code[count].meanPlace - code[count - 1].meanPlace >= SEASON_RANKINGS.clear && printed.slice(0, count).every((row) => top.has(row.teamId));
  });
  return leaders ?? 0;
}

/** Out, or no better than an even chance by FPL's own figure: a slight doubt is not a weakness. */
function serious(availability: Availability): boolean {
  return availability.state !== "fit" && (availability.out || availability.state !== "doubt" || availability.chance === null || availability.chance <= 50);
}

/** Each slot's season points against the other sides', best slot first; ties keep the slot order. */
function lineRanks(lines: PlayedSeason["lines"], teamId: string): LineRank[] {
  const own = lines.get(teamId) ?? {};
  return Object.keys(own)
    .sort()
    .map((slot) => ({ slot, rank: 1 + [...lines.values()].filter((other) => (other[slot] ?? 0) > own[slot]).length }))
    .sort((a, b) => a.rank - b.rank);
}
