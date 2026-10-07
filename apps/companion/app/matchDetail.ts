import type {
  FootballPlayer,
  PlGoal,
  PlManMatch,
  PlMatchFacts,
  StreamCredit,
} from "@epl/core";
import {
  injuryMinutes,
  plGoals,
  plManMatches,
  plMatchFacts,
  plPlayerCodes,
  plTeamSheets,
  streamCredits,
} from "@epl/core";
import {
  optaToCode,
  plFixture,
  plStream,
  theirFixture,
} from "./plFeed";


// One match's detail read (`/fixtures/{id}`), resolved from our fixture code by `ofFixture`: the
// facts, the team sheets, the men's events and names, the injuries, the goals and the stream's
// assist credits. The match's other reads are in `matchFeed.ts`.

/** Resolve their fixture id, read it and map it, answering `absent` at every step that can fail. */
async function ofFixture<T>(
  gameweek: number | null,
  fixtureCode: number,
  absent: T,
  read: (id: number) => Promise<T>,
): Promise<T> {
  if (gameweek === null) return absent;
  try {
    const fixture = await theirFixture(gameweek, fixtureCode);
    return fixture === null ? absent : await read(fixture.id);
  } catch {
    return absent;
  }
}

/** Where a match was played, how many watched and who refereed, off the detail read: the round read
 *  carries no officials. Null when they will not answer, and the caller falls back to `clubGround`. */
export async function matchFacts(
  gameweek: number | null,
  fixtureCode: number,
): Promise<PlMatchFacts | null> {
  return ofFixture(gameweek, fixtureCode, null, async (id) => plMatchFacts(await plFixture(id)));
}

/** Both sides' team sheets for one of our fixtures, or null at any step that fails. */
export async function teamSheets(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  return ofFixture(gameweek, fixtureCode, null, async (id) =>
    plTeamSheets(await plFixture(id), optaToCode(players)),
  );
}

/** What each man did in one match, by FPL player code, off `teamSheets`' cached detail read.
 *  Empty before kickoff, the same answer as their API refusing. */
export async function matchManEvents(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, PlManMatch>> {
  return ofFixture(gameweek, fixtureCode, new Map<number, PlManMatch>(), async (id) =>
    plManMatches(await plFixture(id), optaToCode(players)),
  );
}

/** Every goal in the commentary with the man FPL's rules would credit, the detail read joining ids.
 *  A proposal: `streamCredited` discards it unless FPL's per-man counts agree. */
export async function matchStreamCredits(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<StreamCredit[]> {
  return ofFixture(gameweek, fixtureCode, [] as StreamCredit[], async (id) => {
    const [fixture, stream] = await Promise.all([plFixture(id), plStream(id)]);
    return streamCredits(stream.events.content, plPlayerCodes(fixture, optaToCode(players)));
  });
}

/** Every man on either team sheet by Opta's `name.display`, the form the commentary prints, so
 *  `proseSpans` can look names up; `plTeamSheets` maps to our short names, which never match. */
export async function matchPlayerNames(
  gameweek: number | null,
  fixtureCode: number,
): Promise<string[]> {
  return ofFixture(gameweek, fixtureCode, [] as string[], async (id) => {
    const fixture = await plFixture(id);
    return (fixture.teamLists ?? []).flatMap((list) =>
      list === null ? [] : [...list.lineup, ...list.substitutes].map((man) => man.name.display),
    );
  });
}

/** The minute each man was taken off injured in this match, by FPL code: the Line Ups board asks
 *  whether, the scoresheet prints when. */
export async function matchInjuries(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, number>> {
  return ofFixture(gameweek, fixtureCode, new Map<number, number>(), async (id) => {
    const [fixture, stream] = await Promise.all([plFixture(id), plStream(id)]);
    return injuryMinutes(stream.events.content, plPlayerCodes(fixture, optaToCode(players)));
  });
}

export async function matchGoals(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<PlGoal[]> {
  return ofFixture(gameweek, fixtureCode, [] as PlGoal[], async (id) =>
    plGoals(await plFixture(id), optaToCode(players)),
  );
}
