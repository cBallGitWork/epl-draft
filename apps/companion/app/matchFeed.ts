import type {
  FootballPlayer,
  MatchStatRow,
  PlCommentaryLine,
  PlGoal,
  PlManMatch,
  PlMatchFacts,
  StreamCredit,
} from "@epl/core";
import {
  plCommentary,
  plFixtureCode,
  plGoals,
  plManMatches,
  plMatchBoard,
  plMatchFacts,
  plPlayerCodes,
  plTeamSheets,
  shortProse,
  streamCredits,
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
//
// **And `gameweek` is nullable here rather than at every call site.** A fixture
// FPL has not put in a round has no round to resolve their id from, which is a
// real state — a postponement loses its `event`. Every page guarded that itself,
// eleven ternaries across five files, each restating the same fact in whichever
// empty value its own call wanted. It belongs with the other absences.

/** The shape all four reads share: resolve their fixture id, ask for it, map it —
 *  and answer `absent` at every step that can fail.
 *
 *  Counted before extracting: **4**. The failure ladder is identical in all of
 *  them and only the read and the empty value differ, which is exactly what a
 *  type parameter is for. */
async function ofFixture<T>(
  gameweek: number | null,
  fixtureCode: number,
  absent: T,
  read: (id: number) => Promise<T>,
): Promise<T> {
  if (gameweek === null) return absent;
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    return id === null ? absent : await read(id);
  } catch {
    return absent;
  }
}

/** Where a match was played, how many watched, and who refereed it.
 *
 *  **Off the DETAIL read, and it moved there on 10 Sep 2026.** It took the round
 *  read, which carries `ground` 10/10 and `attendance` 9/10 for free — but
 *  `matchOfficials` is **0/10 on the round and 28/30 on the detail**, so the
 *  referee came back null on every match ever drawn and the docblock said "a
 *  match screen wanting the referee asks for the fixture". This IS that screen,
 *  and it asks.
 *
 *  It costs nothing new in practice: the detail is cached on the same thirty
 *  seconds and three of the five match tabs already fetch it for the team sheet
 *  and its events. All four fields come off one object.
 *
 *  This is what retires `clubGround` — core's hand-authored table of twenty
 *  stadium names, which is a guess for a neutral venue and wrong for a club that
 *  moves. Null when they will not answer, and then the caller falls back to the
 *  table it always had. */
export async function matchFacts(
  gameweek: number | null,
  fixtureCode: number,
): Promise<PlMatchFacts | null> {
  return ofFixture(gameweek, fixtureCode, null, async (id) => plMatchFacts(await plFixture(id)));
}

/** Both sides' team sheets for one of OUR fixtures, or null.
 *
 *  Null at every step that can fail: a round they will not serve, a fixture our
 *  code does not appear in, a match nobody has named a side for. */
export async function teamSheets(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  return ofFixture(gameweek, fixtureCode, null, async (id) =>
    plTeamSheets(await plFixture(id), optaToCode(players)),
  );
}

/** Opta's minute-stamped commentary for one of OUR fixtures, newest first.
 *
 *  Craig, 5 Sep 2026: *"needs a match report section that we take from the
 *  premier league site."* This is that read, and it is the one DESIGN §2 has
 *  named as missing since the reference library was catalogued — "a
 *  text-commentary matchday". The mapper was written and tested on 4 Sep and
 *  drew nothing until now. */
export async function matchReport(
  gameweek: number | null,
  fixtureCode: number,
): Promise<PlCommentaryLine[]> {
  if (gameweek === null) return [];
  try {
    const round = await plRound(gameweek);
    const fixture = round.content.find((entry) => plFixtureCode(entry) === fixtureCode);
    if (fixture === undefined) return [];

    // **The club in brackets after a player comes out** (Craig, 11 Sep 2026:
    // *"when a goal is scored, we can remove the team name in brackets after a
    // player name"*). `shortProse` is the wire's own edit and has been since
    // 5 Sep — the report simply never used it, which is why `Chuba Akpom (Ipswich
    // Town)` was reaching the screen with the club named twice in one sentence.
    // The same pass shortens `Manchester United 5, Ipswich Town 2` to the club
    // abbreviations, which is the other half of that function and the reason a
    // goal line now fits a phone.
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
      // **Ascending, because `roundGoals` is newest-first and a scoresheet reads
      // forwards.** Isak's brace printed `9' 6'` the moment the guard above was
      // fixed, which is both of his goals in the wrong order — the sort is the
      // other half of that fix.
      minutes.set(code, [...(minutes.get(code) ?? []), at].sort((a, b) => a - b));
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
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, PlManMatch>> {
  return ofFixture(gameweek, fixtureCode, new Map<number, PlManMatch>(), async (id) =>
    plManMatches(await plFixture(id), optaToCode(players)),
  );
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
  gameweek: number | null,
  fixtureCode: number,
): Promise<MatchStatRow[] | null> {
  if (gameweek === null) return null;
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

/** Every goal in the commentary with the man FPL's own rules would credit.
 *
 *  **The three assists the fixture feed cannot place**, because Opta's
 *  `assistId` is the PASS and FPL also pays for winning a penalty, for forcing
 *  an own goal and for a blocked shot scored from the rebound. `assists.ts`
 *  carries the argument and the counts.
 *
 *  **Two warm reads and no new request.** The detail is already cached for the
 *  team sheets and the stream for the Match Report, and the detail is here only
 *  for the id join — the textstream carries no team list of its own, so nothing
 *  else in the app can turn its `playerIds` into our codes.
 *
 *  A proposal, never an assertion: `streamCredited` throws the whole thing away
 *  unless FPL's per-man counts agree with it. */
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

export async function matchGoals(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<PlGoal[]> {
  return ofFixture(gameweek, fixtureCode, [] as PlGoal[], async (id) =>
    plGoals(await plFixture(id), optaToCode(players)),
  );
}
