import type {
  FootballPlayer,
  MatchStatRow,
  PlCommentaryLine,
  PlManMatch,
  PlMatchFacts,
} from "@epl/core";
import {
  plCommentary,
  plFixtureCode,
  plManMatches,
  plMatchBoard,
  plMatchFacts,
  plTeamSheets,
} from "@epl/core";
import { roundGoals } from "./commentary";
import { optaToCode, plFixture, plRound, plStats, plStream, theirFixtureId } from "./plFeed";

// What ONE match's screen asks the Premier League. The round's own questions are
// next door in `commentary.ts`; the reads, the caches and the identity join both
// use are in `plFeed.ts`.
//
// **Empty or null, never a throw, in every function here.** Each of these is
// something a match page ADDS to a screen it can already draw from FPL — a
// ground, a bench, a report, a minute beside a scorer. Their API refusing costs
// the block and never the page, which is why the tolerance is uniform and stated
// once rather than argued in four docblocks.

/** Where a match was played, how many watched, and who refereed it — off the
 *  ROUND read, which is already cached for the wire.
 *
 *  **Zero new requests for three of the four fields.** Both reads answer with the
 *  same `RawPlFixture`, and the round carries `ground` 10/10 and `attendance`
 *  9/10 (counted 5 Sep 2026); only `referee` is detail-only, so it comes back
 *  null here. A match screen wanting the referee asks for the fixture.
 *
 *  This is what retires `clubGround` — core's hand-authored table of twenty
 *  stadium names, which is a guess for a neutral venue and wrong for a club that
 *  moves. Null when the round will not answer or does not carry the fixture, and
 *  then the caller falls back to the table it always had. */
export async function matchFacts(
  gameweek: number,
  fixtureCode: number,
): Promise<PlMatchFacts | null> {
  const round = await plRound(gameweek).catch(() => null);
  const fixture = round?.content.find((entry) => plFixtureCode(entry) === fixtureCode);
  return fixture === undefined ? null : plMatchFacts(fixture);
}

/** Both sides' team sheets for one of OUR fixtures, or null.
 *
 *  Null at every step that can fail: a round they will not serve, a fixture our
 *  code does not appear in, a match nobody has named a side for. */
export async function teamSheets(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return null;
    return plTeamSheets(await plFixture(id), optaToCode(players));
  } catch {
    return null;
  }
}

/** Opta's minute-stamped commentary for one of OUR fixtures, newest first.
 *
 *  Craig, 5 Sep 2026: *"needs a match report section that we take from the
 *  premier league site."* This is that read, and it is the one DESIGN §2 has
 *  named as missing since the reference library was catalogued — "a
 *  text-commentary matchday". The mapper was written and tested on 4 Sep and
 *  drew nothing until now. */
export async function matchReport(
  gameweek: number,
  fixtureCode: number,
): Promise<PlCommentaryLine[]> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return [];
    return plCommentary((await plStream(id)).events.content);
  } catch {
    return [];
  }
}

/** Every goal's minute in ONE fixture, by FPL player code.
 *
 *  Craig, 5 Sep 2026: *"live match, we can add the minutes too this now."* He is
 *  right that it is new: the scoresheet's minutes came from the sister repo's
 *  match log, which has **20 of 380** matches in it, so the overwhelming
 *  majority of scorers had a name and no clock. The Premier League's round read
 *  carries a minute for every goal in all ten matches, for one request, and it
 *  is already cached for the wire.
 *
 *  Merged INTO the log rather than replacing it, and the log wins a tie: it is
 *  the sister repo's own reading of the same match, and where the two disagree
 *  the argument is not one this function should settle silently. In practice
 *  they never meet — 20 fixtures against 380.
 */
export async function matchGoalMinutes(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
  logged: Map<number, number[]>,
): Promise<Map<number, number[]>> {
  const minutes = new Map(logged);
  try {
    for (const goal of await roundGoals(gameweek, players)) {
      if (goal.fixtureCode !== fixtureCode) continue;
      // An own goal is credited to the man who put it in his own net, and the
      // scoresheet already prints him under the side he plays FOR with `og`
      // beside his name — so his minute belongs to him, not to the beneficiary.
      const code = goal.players[0];
      // **`logged`, and not the map being built.** Testing `minutes` meant a
      // scorer's SECOND goal saw the entry his first had just written and was
      // skipped, so every brace in the app printed one minute — Isak's 6' and 9'
      // against Ipswich read `6'`. The tie this guard exists to settle is with
      // the sister repo's log, which is fixed before the loop starts; the map it
      // was reading grows as the loop runs, which makes it a different test.
      if (code === null || code === undefined || logged.has(code)) continue;
      // `minute` reads "45+2" for stoppage time; the scoresheet takes numbers,
      // so the added-time half is dropped rather than guessed at. A goal in the
      // 47th minute of the first half is a 45th-minute goal on any teleprinter.
      const at = Number.parseInt(goal.minute, 10);
      if (Number.isNaN(at)) continue;
      minutes.set(code, [...(minutes.get(code) ?? []), at]);
    }
  } catch {
    // Their API refusing costs the minutes and never the scoresheet.
  }
  return minutes;
}

/** What each man did in one match, by FPL player code.
 *
 *  **Off the SAME cached detail read `teamSheets` makes**, so a screen drawing a
 *  team sheet and its marks costs one request rather than two. That is the whole
 *  argument for reading the fixture's own `events` rather than the textstream:
 *  the sheet already needs this response.
 *
 *  Empty on a fixture nobody has played — `events` is absent on all ten upcoming
 *  fixtures of a round — which is the same answer as their API refusing, and the
 *  caller draws neither differently. */
export async function matchManEvents(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, PlManMatch>> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return new Map();
    return plManMatches(await plFixture(id), optaToCode(players));
  } catch {
    return new Map();
  }
}

/** Championship Manager's thirteen-row Match Stats board for one fixture.
 *
 *  **Two reads, and the round one is already warm.** The round resolves their id
 *  AND names which side is at home — `/stats/match` keys its data on their team
 *  ids and says nothing about home and away, so the order has to come from the
 *  fixture. Getting that from `teamLists` instead would draw the board under the
 *  wrong crests, which is the same trap `plTeamSheets` records.
 *
 *  Null when they will not answer, when our code is not in the round, or when
 *  they hold no stats for a side. A board is a comparison and half of one is not
 *  a smaller board. */
export async function matchStatsBoard(
  gameweek: number,
  fixtureCode: number,
): Promise<MatchStatRow[] | null> {
  try {
    const round = await plRound(gameweek);
    const fixture = round.content.find((entry) => plFixtureCode(entry) === fixtureCode);
    const [home, away] = fixture?.teams ?? [];
    if (fixture === undefined || home === undefined || away === undefined) return null;
    return plMatchBoard(await plStats(fixture.id), home.team.id, away.team.id);
  } catch {
    return null;
  }
}
