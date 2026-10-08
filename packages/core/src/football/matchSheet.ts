import type { RawFixture, RawFixtureStat } from "./fpl/raw";
import { playerById } from "./selectors";
import type { FootballPlayer, FootballSnapshot } from "./types";

// What happened in one match, for every player, off the `stats` block on `/fixtures/`; it carries no `minutes`.
// The bps list is the appearance list, so presence in a sheet means he played.
// bps runs negative: a filter on `bps > 0` drops the worst men in a match.

/** One player's line in a match, from the fixture list: no minutes, clean sheet or expected stats, and a per-fixture bps. */
export interface MatchSheetLine {
  /** FPL's per-season `id`, which the fixture list keys on; never persisted. */
  playerId: number;
  side: "home" | "away";
  goals: number;
  assists: number;
  ownGoals: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  /** FPL's Bonus Points System score for this fixture; signed, so never filter on `> 0`. */
  bps: number;
  defensiveContribution: number;
}

/** Every player the fixture list has something to say about, for one match. */
export interface MatchSheet {
  fixtureId: number;
  lines: MatchSheetLine[];
}

/** FPL's stat identifiers against our fields; an identifier not listed here is ignored. */
const FIELDS: Record<string, keyof Omit<MatchSheetLine, "playerId" | "side">> = {
  goals_scored: "goals",
  assists: "assists",
  own_goals: "ownGoals",
  penalties_saved: "penaltiesSaved",
  penalties_missed: "penaltiesMissed",
  yellow_cards: "yellowCards",
  red_cards: "redCards",
  saves: "saves",
  bps: "bps",
  defensive_contribution: "defensiveContribution",
};

/** The season's fixtures as sheets, one per match; a fixture with no `stats` or only empty ones has no lines. */
export function mapMatchSheets(fixtures: readonly RawFixture[]): MatchSheet[] {
  return fixtures.map((fixture) => ({
    fixtureId: fixture.id,
    lines: linesOf(fixture.stats ?? []),
  }));
}

function linesOf(stats: readonly RawFixtureStat[]): MatchSheetLine[] {
  const lines = new Map<number, MatchSheetLine>();

  for (const stat of stats) {
    const field = FIELDS[stat.identifier];
    if (field === undefined) continue;
    for (const side of ["home", "away"] as const) {
      for (const entry of side === "home" ? (stat.h ?? []) : (stat.a ?? [])) {
        const line = lines.get(entry.element) ?? blank(entry.element, side);
        line[field] = entry.value;
        lines.set(entry.element, line);
      }
    }
  }

  return [...lines.values()];
}

function blank(playerId: number, side: "home" | "away"): MatchSheetLine {
  return {
    playerId,
    side,
    goals: 0,
    assists: 0,
    ownGoals: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    bps: 0,
    defensiveContribution: 0,
  };
}

/** A line with the man it belongs to. */
export interface SheetRow {
  player: FootballPlayer;
  line: MatchSheetLine;
}

/** Both team sheets, each by name; `scoresheet` ranks what they did, never FPL's bonus-points score.
 *  Joined on the per-season `id` within one request; a man bootstrap does not carry is dropped. */
export function sheetSides(
  sheet: MatchSheet,
  snapshot: FootballSnapshot,
): { home: SheetRow[]; away: SheetRow[] } {
  const players = playerById(snapshot);
  const home: SheetRow[] = [];
  const away: SheetRow[] = [];

  for (const line of sheet.lines) {
    const player = players.get(line.playerId);
    if (player === undefined) continue;
    (line.side === "home" ? home : away).push({ player, line });
  }

  const byName = (a: SheetRow, b: SheetRow) => a.player.name.localeCompare(b.player.name);
  return { home: home.sort(byName), away: away.sort(byName) };
}

/** Only the men the scoresheet names (a goal, an assist, an own goal, a penalty either way, a red card), ranked.
 *  Not `contributions`' notable: bonus and a keeper's saves do not put a man on the scoresheet. */
export function scoresheet(rows: readonly SheetRow[]): SheetRow[] {
  return rows
    .filter(({ line }) => named(line))
    .sort((a, b) => rank(b.line) - rank(a.line));
}

/** A booking does not name a man on this sheet; a sending off does. */
function named(line: MatchSheetLine): boolean {
  return (
    line.goals > 0 ||
    line.assists > 0 ||
    line.ownGoals > 0 ||
    line.penaltiesSaved > 0 ||
    line.penaltiesMissed > 0 ||
    line.redCards > 0
  );
}

/** Goals outrank assists outrank the rest, the shape `contributions` sorts by; a tie keeps the sheet's order. */
function rank(line: MatchSheetLine): number {
  return (
    line.goals * 1000 +
    line.assists * 500 +
    line.ownGoals * 200 +
    line.penaltiesSaved * 150 +
    line.redCards * 100 +
    line.penaltiesMissed * 50
  );
}
