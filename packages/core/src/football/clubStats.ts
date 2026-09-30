import { NO_SEASON } from "./noSeason";
import { byKickoff } from "./selectors";
import type { Club, Fixture, FootballPlayer, SeasonTotals } from "./types";

// What a club has done this season, beyond its place in the table.
//
// `table.ts` answers the one question a league table asks — played, won, drawn,
// lost, for, against, points — and deliberately answers nothing else. This is
// the rest of it: the home and away halves of that record, the run it came in,
// and what the men on its books have been doing.
//
// **In the football layer for `table.ts`'s reason.** Nothing here is a rule
// anybody may change: a home fixture is one where you are the home side, a clean
// sheet is a match you conceded none in, and a form guide is the last few
// results in the order they happened. Those are facts about the competition
// rather than settings of a competition, which is the whole test the layer split
// applies (`.claude/rules/layer-split.md`).
//
// **Only finished fixtures count**, exactly as the table does. FPL writes a
// running score onto a match in play, and a side leading at half time has not
// kept a clean sheet.

/** One side of a record — the same six figures a table row carries, for a
 *  subset of the fixtures.
 *
 *  Not called `Record`, which is what a football writer would call it: that name
 *  shadows TypeScript's own `Record<K, V>` inside this file, so the next person
 *  to want a keyed map here would get a confusing error instead of a utility
 *  type. */
export interface ClubRecord {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export type Result = "W" | "D" | "L";

export interface ClubStats {
  clubId: number;
  home: ClubRecord;
  away: ClubRecord;
  /** Every result this season, **oldest first** — left to right is the direction
   *  the season ran, which is how a form guide is read wherever it appears. The
   *  whole run rather than the last five: how many a guide shows is a question
   *  about a column's width, and that belongs to whatever draws it. */
  form: Result[];
  /** Matches in which the club conceded nothing, and matches in which it scored
   *  nothing. Both counted off finished fixtures only. */
  cleanSheets: number;
  failedToScore: number;
  /** His squad's season, added up. Every man FPL files at this club, whether or
   *  not he has kicked a ball — the denominator is the squad, so a club with a
   *  big treatment room reads as one. */
  squad: SeasonTotals;
}

/** Every club's season, in the order the clubs arrive.
 *
 *  Ordering is the caller's: this says what each club has done, and `leagueTable`
 *  says where that puts them. A function that did both would have to pick one
 *  order for two questions. */
export function clubStats(
  fixtures: readonly Fixture[],
  clubs: readonly Club[],
  players: readonly FootballPlayer[],
): ClubStats[] {
  const rows = new Map<number, ClubStats>(
    clubs.map((club) => [
      club.id,
      {
        clubId: club.id,
        home: blank(),
        away: blank(),
        form: [],
        cleanSheets: 0,
        failedToScore: 0,
        squad: { ...NO_SEASON },
      },
    ]),
  );

  // Chronological, so the form guide runs in the order the season did. A fixture
  // with no kickoff is one FPL has not dated — a TV pick — and cannot be
  // finished, so it never reaches the loop below; sorting it to the end rather
  // than throwing keeps that an assumption this file does not have to make.
  const played = [...fixtures]
    .filter((fixture) => fixture.status === "finished")
    .filter((fixture) => fixture.homeScore !== null && fixture.awayScore !== null)
    .sort(byKickoff);

  for (const fixture of played) {
    const home = rows.get(fixture.homeClubId);
    const away = rows.get(fixture.awayClubId);
    // A fixture naming a club this snapshot does not carry counts for neither
    // side rather than for one — `table.ts` takes the same line.
    if (home === undefined || away === undefined) continue;
    // Narrowed above; repeated here because the filter cannot tell the compiler.
    if (fixture.homeScore === null || fixture.awayScore === null) continue;

    side(home, home.home, fixture.homeScore, fixture.awayScore);
    side(away, away.away, fixture.awayScore, fixture.homeScore);
  }

  for (const player of players) {
    const row = rows.get(player.clubId);
    if (row === undefined) continue;
    add(row.squad, player.season);
  }

  return [...rows.values()];
}

function blank(): ClubRecord {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
}

/** One club's half of one match, written into the right half of its record and
 *  onto the end of its run. */
function side(row: ClubStats, half: ClubRecord, scored: number, conceded: number): void {
  half.played += 1;
  half.goalsFor += scored;
  half.goalsAgainst += conceded;
  if (conceded === 0) row.cleanSheets += 1;
  if (scored === 0) row.failedToScore += 1;

  if (scored > conceded) {
    half.won += 1;
    row.form.push("W");
  } else if (scored === conceded) {
    half.drawn += 1;
    row.form.push("D");
  } else {
    half.lost += 1;
    row.form.push("L");
  }
}

/** Add one man's season onto his club's.
 *
 *  Every key, read off the blank rather than listed here: a sixteenth total
 *  added to `SeasonTotals` should not need this file edited to be counted, and
 *  the day it does is the day a club's total silently stops including it. */
function add(into: SeasonTotals, from: SeasonTotals): void {
  for (const key of Object.keys(NO_SEASON) as (keyof SeasonTotals)[]) {
    into[key] += from[key];
  }
}
