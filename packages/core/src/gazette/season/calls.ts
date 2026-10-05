import { SEASON_PREDICTIONS } from "../../config";
import type { Availability } from "../../football/playerState";
import type { PlayedSeason } from "./play";
import type { SeasonOutcome } from "./simulate";

// Every call in Lawro's season column, made here: the table, the title, the four, the spoon, the bold call, and for
// each side the man it is built round and its weakness. The writer only words them. Pure.

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
export type Weakness = { kind: "doubt"; man: CallMan } | ({ kind: "line" } & LineRank);

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
  /** Which of the two the line opens on, alternating down the table so ten lines do not open alike. */
  lead: "man" | "weakness";
}

export type BoldCall =
  | { kind: "first-misses"; teamId: string; man: CallMan; place: number }
  | { kind: "steal"; teamId: string; man: CallMan; outscores: number; of: number; among: "first" | "half" };

export interface SeasonCalls {
  sides: SeasonSide[];
  /** How many sides are clear at the top: 0, 1 or 2. */
  clear: number;
  title: { teamId: string; runnerUp: string; close: boolean };
  four: string[];
  /** The side that misses the four, and whether it is close. */
  fifth: { teamId: string; close: boolean } | null;
  spoon: { teamId: string; ninth: string; close: boolean };
  bold: BoldCall | null;
}

/** Null for a table too short to call a title, a four and a spoon. */
export function seasonCalls(played: PlayedSeason, squads: ReadonlyMap<string, readonly CallMan[]>, places: number): SeasonCalls | null {
  const table = played.table;
  if (table.length < Math.max(places + 1, 3)) return null;
  const { close, clear: gap } = SEASON_PREDICTIONS;
  const near = (lead: number, chaser: number) => lead > 0 && chaser >= lead * close;

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

  const [top, second, third] = table;
  const last = table[table.length - 1];
  const ninth = table[table.length - 2];
  return {
    sides,
    clear: second.meanPlace - top.meanPlace >= gap ? 1 : third.meanPlace - second.meanPlace >= gap ? 2 : 0,
    title: { teamId: top.teamId, runnerUp: second.teamId, close: near(top.firsts, second.firsts) },
    four: table.slice(0, places).map((row) => row.teamId),
    fifth: table[places] === undefined ? null : { teamId: table[places].teamId, close: near(table[places - 1].playoffs, table[places].playoffs) },
    spoon: { teamId: last.teamId, ninth: ninth.teamId, close: near(last.lasts, ninth.lasts) },
    bold: boldCall(table, sides, squads, places),
  };
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

/** The side that took the first man of the draft missing the four; else the best man taken in the draft's second half. */
function boldCall(table: readonly SeasonOutcome[], sides: readonly SeasonSide[], squads: ReadonlyMap<string, readonly CallMan[]>, places: number): BoldCall | null {
  const drafted = [...squads].flatMap(([teamId, men]) => men.filter((man) => man.overall !== null).map((man) => ({ teamId, man })));
  const opener = drafted.find(({ man }) => man.overall === 1);
  const side = opener === undefined ? undefined : sides.find((each) => each.teamId === opener.teamId);
  if (opener !== undefined && side !== undefined && side.place > places) return { kind: "first-misses", teamId: opener.teamId, man: opener.man, place: side.place };

  const half = Math.ceil(drafted.length / 2);
  const steal = drafted
    .filter(({ man }) => (man.overall ?? 0) > half)
    .sort((a, b) => b.man.season - a.man.season || (a.man.overall ?? 0) - (b.man.overall ?? 0))[0];
  if (steal === undefined) return null;
  const outscored = (cut: number) => drafted.filter(({ man }) => (man.overall ?? 0) <= cut && man.season < steal.man.season).length;
  const round = table.length;
  return outscored(round) > 0
    ? { kind: "steal", teamId: steal.teamId, man: steal.man, outscores: outscored(round), of: round, among: "first" }
    : { kind: "steal", teamId: steal.teamId, man: steal.man, outscores: outscored(half), of: half, among: "half" };
}
