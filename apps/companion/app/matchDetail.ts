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
    const fixture = await theirFixture(gameweek, fixtureCode);
    return fixture === null ? absent : await read(fixture.id);
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

/** Every man named on either team sheet, by the name Opta's own commentary
 *  writes — which is `name.display` and not our short form.
 *
 *  For `proseSpans`, which marks a man in a sentence by LOOKING HIM UP rather
 *  than by pattern: a capitalised word is not a name, and `Second Half`, `MUN`
 *  and `VAR` would all be caught by one that tried. Off the warm detail read.
 *
 *  `plTeamSheets` is not used here on purpose — it maps to our own short names,
 *  and the string that has to match is the one in the prose. */
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

/** The men taken off INJURED in this match, by FPL code.
 *
 *  Craig, 11 Sep 2026: *"we can find events of a sub off due to an injury in a
 *  game"*, then *"i want them on the overview"*.
 *
 *  **A MAP of minutes, not a set of men**, because the two screens that read it
 *  want different halves and a `Map` answers `.has()` as well as a `Set` does.
 *  The Line Ups board asks only whether; the scoresheet prints the clock. Off the same warm pair the assists use — the stream for the sentence
 *  and the detail for the id join — so it costs no request the page has not
 *  already made. `assists.ts` carries the count and why this one read is allowed
 *  to test a sentence. */
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
