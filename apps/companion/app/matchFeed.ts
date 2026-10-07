import type {
  FootballPlayer,
  HighlightVideo,
  MatchStatRow,
  PlCommentaryLine,
} from "@epl/core";
import {
  highlightFor,
  parseHighlightFeed,
  plCommentary,
  plMatchBoard,
  shortProse,
} from "@epl/core";
import { roundGoals } from "./commentary";
import {
  highlightsFeed,
  plStats,
  plStream,
  theirFixture,
} from "./plFeed";


// What ONE match's screen asks the Premier League; the round's questions are in `commentary.ts`.
// Every function answers empty or null and never throws, since each adds a block to a page FPL can
// already draw; a null `gameweek` (a postponement loses its round) answers the same.

/** Opta's minute-stamped commentary for one of our fixtures, newest first. */
export async function matchReport(
  gameweek: number | null,
  fixtureCode: number,
): Promise<PlCommentaryLine[]> {
  if (gameweek === null) return [];
  try {
    const fixture = await theirFixture(gameweek, fixtureCode);
    if (fixture === null) return [];

    // Long club name → abbreviation: `shortProse` drops a bracketed club and shortens scorelines.
    const names = new Map<string, string>();
    for (const side of fixture.teams ?? []) {
      const long = side.team?.name;
      const short = side.team?.club?.abbr ?? side.team?.shortName;
      if (long && short) names.set(long, short);
    }

    const lines = plCommentary((await plStream(fixture.id)).events.content);
    return lines.map((line) => ({ ...line, text: shortProse(line.text, names) }));
  } catch {
    return [];
  }
}

/** Every goal's minute in one fixture, by FPL player code, merged into the sister repo's log, which
 *  wins a tie. */
export async function matchGoalMinutes(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
  logged: Map<number, number[]>,
): Promise<Map<number, number[]>> {
  const minutes = new Map(logged);
  if (gameweek === null) return minutes;
  try {
    for (const goal of await roundGoals(gameweek, players)) {
      if (goal.fixtureCode !== fixtureCode) continue;
      // An own goal's minute belongs to the man who scored it, printed with `og` on his own side.
      const code = goal.players[0];
      // Test `logged`, not `minutes`: the growing map would skip a scorer's second goal.
      if (code === null || code === undefined || logged.has(code)) continue;
      // "45+2" parses as 45: the scoresheet takes numbers, so added time is dropped.
      const at = Number.parseInt(goal.minute, 10);
      if (Number.isNaN(at)) continue;
      // Ascending: `roundGoals` is newest first and a scoresheet reads forwards.
      minutes.set(code, [...(minutes.get(code) ?? []), at].sort((a, b) => a - b));
    }
  } catch {
    // Their API refusing costs the minutes and never the scoresheet.
  }
  return minutes;
}

/** Championship Manager's thirteen-row Match Stats board for one fixture, or null without both sides.
 *  Home and away come from the round read: `/stats/match` does not say which is which. */
export async function matchStatsBoard(
  gameweek: number | null,
  fixtureCode: number,
): Promise<MatchStatRow[] | null> {
  if (gameweek === null) return null;
  try {
    const fixture = await theirFixture(gameweek, fixtureCode);
    const [home, away] = fixture?.teams ?? [];
    if (fixture === null || home === undefined || away === undefined) return null;
    return plMatchBoard(await plStats(fixture.id), home.team.id, away.team.id);
  } catch {
    return null;
  }
}

/** The highlights video for one fixture (both clubs and the score must agree), or null. */
export async function matchHighlight(fixture: {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}): Promise<HighlightVideo | null> {
  try {
    return highlightFor(parseHighlightFeed(await highlightsFeed()), fixture);
  } catch {
    return null;
  }
}
