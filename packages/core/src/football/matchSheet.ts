import type { RawFixture, RawFixtureStat } from "./fpl/raw";
import type { FootballPlayer, FootballSnapshot } from "./types";

// What happened in one match, off the season's own fixture list.
//
// **The read this is built from is one the app already makes.** `/fixtures/`
// carries a `stats` block on every fixture and `raw.ts` did not model it, so
// three quarters of a match screen was arriving on the wire and being discarded.
// Counted 4 Sep 2026 across all 380 fixtures: the 20 finished ones carry eleven
// identifiers each, and the 360 that had not started carry `[]`. So an empty
// sheet has two causes that look identical and are the same answer — nobody has
// done anything in this match — and there is no third shape to guard against.
//
// **What it is for, against the two things that already exist.**
//
//   `selectors.contributions` answers the same question for THE ROUND IN VIEW,
//   off `snapshot.stats` — one live feed, not thirty-eight. It is why
//   `prem/Match` refuses to open a row onto "Nothing to report." over a 3-0 win.
//
//   `gameLog.mapGameLog` answers it per fixture for ONE PLAYER, off
//   `element-summary`. Correct and complete, and thirty requests for a match.
//
// This is the third corner: every player, any fixture, one 26 KB read. What it
// pays for that is `minutes`, which the fixture list does not publish at all.
//
// **The bps list is the appearance list.** Fixture 11 of gameweek 2, counted 4
// Sep 2026: 32 distinct elements under `bps`, 32 players with minutes above nought
// in `/event/2/live/`, no misses and no false positives. So a man's presence in
// this sheet is evidence he played, which is the one thing `minutes` would
// otherwise be needed for.
//
// **His PRESENCE, and never the sign of the figure.** bps runs negative — 47 of
// the season's 616 entries were below nought on 4 Sep 2026, floor -14, and not
// one was exactly nought. A screen printing the column owes it
// `--color-bad`, whose one meaning is a negative; a filter written as `bps > 0`
// would quietly drop the five worst players in a match.

/** One player's line in a match, as the fixture list records it.
 *
 *  **Not `PlayerMatchStats`, and the difference is what it cannot say.** That one
 *  comes from the live feed and carries `minutes`, `cleanSheet`, `goalsConceded`
 *  and the expected family; the fixture list carries none of them, and a nought
 *  in their place would be a measurement where there is an absence.
 *
 *  What it has that the live feed does not is a `bps` that belongs to THIS
 *  FIXTURE — `map.ts` takes that one off the gameweek aggregate and writes the
 *  same round total onto every row of a double — and a side that is stated
 *  rather than derived from the player's club. */
export interface MatchSheetLine {
  /** FPL's per-season `id`, which is what the fixture list keys on. Never
   *  persisted (CODE_RULES §3): a fixture belongs to one season, and so does
   *  everything this file says about it. */
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
  bonus: number;
  /** FPL's Bonus Points System score for this fixture. **Signed** — see the
   *  header: a bad afternoon runs to -14, and nothing may filter on `> 0`. */
  bps: number;
  defensiveContribution: number;
}

/** Every player the fixture list has something to say about, for one match. */
export interface MatchSheet {
  fixtureId: number;
  lines: MatchSheetLine[];
}

/** FPL's identifier vocabulary against ours.
 *
 *  Written out rather than camel-cased at runtime: these eleven strings are a
 *  fact about the provider, and a twelfth appearing should be ignored rather
 *  than silently landing in a field nobody declared. `defensive_contribution`
 *  arrived in 25/26 and is the reason that sentence is here. */
const FIELDS: Record<string, keyof Omit<MatchSheetLine, "playerId" | "side">> = {
  goals_scored: "goals",
  assists: "assists",
  own_goals: "ownGoals",
  penalties_saved: "penaltiesSaved",
  penalties_missed: "penaltiesMissed",
  yellow_cards: "yellowCards",
  red_cards: "redCards",
  saves: "saves",
  bonus: "bonus",
  bps: "bps",
  defensive_contribution: "defensiveContribution",
};

/** The season's fixtures as sheets, one per match, keyed by fixture id.
 *
 *  A fixture with no `stats` key and one with eleven empty identifiers both come
 *  back with no lines, and they are the same answer to the only question a
 *  caller asks: nobody has done anything in this match yet. */
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
    bonus: 0,
    bps: 0,
    defensiveContribution: 0,
  };
}

/** A line with the man it belongs to. */
export interface SheetRow {
  player: FootballPlayer;
  line: MatchSheetLine;
}

/** Both team sheets, each in bps order.
 *
 *  bps rather than goals: this is the list of everyone who played, and the
 *  question it answers first is who played well. A goalscorer sorts near the top
 *  on his own merits — FPL pays 24 bps for a forward's goal — without the order
 *  having to say so.
 *
 *  Keyed on the per-season `id`, which is safe here for `contributions`' reason:
 *  the sheet and the snapshot are read in the same request, so nothing outlives
 *  the season the ids belong to. A man in the sheet whom bootstrap does not carry
 *  is dropped rather than crashing the screen. */
export function sheetSides(
  sheet: MatchSheet,
  snapshot: FootballSnapshot,
): { home: SheetRow[]; away: SheetRow[] } {
  const players = new Map(snapshot.players.map((p) => [p.id, p]));
  const home: SheetRow[] = [];
  const away: SheetRow[] = [];

  for (const line of sheet.lines) {
    const player = players.get(line.playerId);
    if (player === undefined) continue;
    (line.side === "home" ? home : away).push({ player, line });
  }

  const byBps = (a: SheetRow, b: SheetRow) =>
    b.line.bps - a.line.bps || a.player.name.localeCompare(b.player.name);
  return { home: home.sort(byBps), away: away.sort(byBps) };
}

/** Only the men who did something the scoresheet names — a goal, an assist, an
 *  own goal, a penalty either way, a card.
 *
 *  Deliberately NOT `contributions`' notion of notable, which counts bonus and a
 *  keeper's saves. Those belong in a column beside every name; this is the list a
 *  match report is written from, and a goalkeeper with four saves did not appear
 *  on the scoresheet. */
export function scoresheet(rows: readonly SheetRow[]): SheetRow[] {
  return rows
    .filter(({ line }) => named(line))
    .sort((a, b) => rank(b.line) - rank(a.line));
}

function named(line: MatchSheetLine): boolean {
  return (
    line.goals > 0 ||
    line.assists > 0 ||
    line.ownGoals > 0 ||
    line.penaltiesSaved > 0 ||
    line.penaltiesMissed > 0 ||
    line.yellowCards > 0 ||
    line.redCards > 0
  );
}

/** Goals outrank assists outrank the rest, and bps breaks the tie — the same
 *  shape `contributions` sorts by, so the two lists read the same way round. */
function rank(line: MatchSheetLine): number {
  return (
    line.goals * 1000 +
    line.assists * 500 +
    line.ownGoals * 200 +
    line.penaltiesSaved * 150 +
    line.redCards * 100 +
    line.penaltiesMissed * 50 +
    line.yellowCards * 10 +
    line.bps / 1000
  );
}
