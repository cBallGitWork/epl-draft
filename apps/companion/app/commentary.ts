import {
  type FootballPlayer,
  type FootballSnapshot,
  type MatchEvent,
  type PlGoal,
  type PlayerMatchStats,
  type RoundBreak,
  before,
  mapMatchEvents,
  mapRoundBreaks,
  mapRoundGoals,
  creditedGoals,
  plFixtureCode,
  streamCredited,
  streamCredits,
} from "@epl/core";
import { replayAt } from "./clock";
import { plRound, plStream, playerCodes } from "./plFeed";

// The ROUND's questions, from the Premier League's own feed. One match's are next
// door in `matchFeed.ts`; the reads and the identity join both use are in
// `plFeed.ts`.
//
// **One request for ten matches.** Their round-level fixtures read carries a
// `goals` array per match — scorer, assister, minute — so the question the Live
// tab exists to answer costs a single upstream call however many matches are on
// and however many phones are open. Counted across gameweeks 1-3, that array
// reconciles with the scoreline on 21 of 21 played fixtures.
//
// FPL cannot answer this at any price: it publishes no minute for a goal
// anywhere, and the sister repo's export runs about a day behind full time.

/** Every goal in the round, joined to FPL players and ordered as they happened.
 *
 *  Ordered on `absolute` — kick-off plus elapsed — and NOT on the match clock: a
 *  12:30 match and a 17:30 one both start their own clock at nought, so a round
 *  sorted on `seconds` puts the afternoon in the wrong sequence. A goal whose
 *  match carries no kick-off time has no place in that order and sorts last
 *  rather than into 1970.
 *
 *  Newest first, because the question this answers is "what just happened".
 *
 *  Returns `[]` rather than throwing when their API refuses. That is not the
 *  swallow §2 forbids: the caller renders the round's football either way, and
 *  an empty wire under a live scoreline is a panel with nothing in it, not a
 *  claim that nothing happened — `Wire` says which it is from `speaksForNow`. */
/** What a replay is allowed to have seen. Live this is every event, because
 *  nothing in a feed has happened in the future; under `REPLAY_AT` it is the
 *  wire as it stood at that minute. An undated event cannot be placed in time
 *  and a replay therefore cannot show it. */
function asOf<T extends { absolute: number | null }>(events: readonly T[]): T[] {
  const at = replayAt();
  return at === null ? [...events] : before(events, at);
}

export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await plRound(gameweek);
  const goals = asOf(mapRoundGoals(round.content, playerCodes(players)));
  return goals.sort((a, b) => (b.absolute ?? 0) - (a.absolute ?? 0));
}

/** Every interval reached in the round — half time and full time, oldest first.
 *
 *  Off the SAME cached round read the goals come from, so the wire's whole cost
 *  is still one upstream request for ten matches. Empty rather than a throw: a
 *  wire with no full-time lines is a wire with fewer lines, not a claim that
 *  nothing has finished. */
export async function roundBreaks(gameweek: number): Promise<RoundBreak[]> {
  return asOf(mapRoundBreaks((await plRound(gameweek)).content));
}

/** Every red card in the round, joined to the men who own them.
 *
 *  **The one thing on this wire that is not free.** Goals and breaks come off
 *  the round read, one request for ten matches; a card is published nowhere on
 *  it, so this is one textstream per fixture that has kicked off — up to ten a
 *  window. That is the cost the prose wire carried before it was deleted, so
 *  the panel is no dearer than it was; it is worth saying out loud because the
 *  next thing anyone wants from the stream is free once this is paid for.
 *
 *  Reds only. A booking is a fact about a match and a sending-off changes it,
 *  and the round has about a hundred of the first — a wire of yellows is a wire
 *  nobody reads down.
 *
 *  Empty, never a throw, at every step: the wire is something this page adds to
 *  a round it can already draw. */
export async function roundRedCards(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await plRound(gameweek).catch(() => null);
  if (round === null) return [];

  const codes = playerCodes(players);
  // Together, not in turn: ten sequential round trips is ten latencies on the
  // one panel a manager watches, and they are ten independent reads.
  const perFixture = await Promise.all(
    round.content.map(async (fixture) => {
      const fixtureCode = plFixtureCode(fixture);
      if (fixtureCode === null || fixture.status === "U") return [];
      const stream = await plStream(fixture.id).catch(() => null);
      if (stream === null) return [];
      return mapMatchEvents(
        stream.events.content,
        fixtureCode,
        codes,
        fixture.kickoff?.millis ?? null,
      ).filter((event) => event.kind === "red-card");
    }),
  );
  return asOf(perFixture.flat());
}

/** The round's goals with the assists FPL pays and Opta never placed.
 *
 *  **Three of them, and none is a pass** — winning a penalty, forcing an own
 *  goal, and a rebound off a blocked or saved shot. Opta's `assistId` is the
 *  ball that was played, so it is absent on all three by construction and the
 *  wire printed a goal with nobody beside it. Brentford 3-0 Chelsea, gameweek
 *  5: FPL pays Schade two and the feed placed neither (Craig, 21 Sep 2026).
 *
 *  **The same two-step the match page uses, and it needs both.** The commentary
 *  proposes an assister for every unexplained goal and `streamCredited` throws
 *  the proposal away unless FPL's per-man counts confirm it exactly; when it
 *  does throw it away, `creditedGoals` resolves the one case arithmetic can —
 *  a single man short by exactly the side's unexplained goals. That fixture is
 *  why: the attempt before Carvalho's 90+4 belongs to CHELSEA, so the rebound
 *  rule proposes an opponent, the audit correctly refuses the lot, and the
 *  arithmetic then credits Schade both.
 *
 *  **Per side, not per fixture**, because that arithmetic is a side's: its
 *  unexplained goals against the men FPL paid on it. A goal belongs to the
 *  scorer's club, inverted for an own goal, which is the one football fact in
 *  here.
 *
 *  **It costs no request.** The textstream is the read `roundRedCards` already
 *  makes, cached per fixture per window; `PlGoal` is built from the goals we
 *  hold rather than read again, since the audit uses the minute, the scorer and
 *  the assister and touches nothing else. Built one for one, which is what lets
 *  the answer go back by index. */
export async function creditAssists(
  goals: readonly MatchEvent[],
  snapshot: FootballSnapshot,
  stats: readonly PlayerMatchStats[],
): Promise<MatchEvent[]> {
  const codes = playerCodes(snapshot.players);
  const clubOf = new Map(snapshot.players.map((player) => [player.code, player.clubId]));
  const codeOf = new Map(snapshot.players.map((player) => [player.id, player.code]));
  const fixtures = new Map(snapshot.fixtures.map((fixture) => [fixture.code, fixture]));

  /** Which club a goal counts for: the scorer's, unless he put it in his own. */
  const sideOf = (goal: MatchEvent): number | undefined => {
    const scorer = goal.players[0];
    const club = scorer === null || scorer === undefined ? undefined : clubOf.get(scorer);
    const fixture = fixtures.get(goal.fixtureCode);
    if (club === undefined || fixture === undefined) return undefined;
    if (goal.kind !== "own-goal") return club;
    return club === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId;
  };

  const sides = new Map<string, MatchEvent[]>();
  const loose: MatchEvent[] = [];
  for (const goal of goals) {
    const side = sideOf(goal);
    if (side === undefined) {
      loose.push(goal);
      continue;
    }
    const key = `${goal.fixtureCode}:${side}`;
    sides.set(key, [...(sides.get(key) ?? []), goal]);
  }

  const credited = await Promise.all(
    [...sides].map(async ([key, theirs]) => {
      const [fixtureCode, side] = key.split(":").map(Number);
      const fixtureId = fixtures.get(fixtureCode)?.id;
      if (fixtureId === undefined) return theirs;
      const stream = await plStream(fixtureId).catch(() => null);
      if (stream === null) return theirs;

      // What FPL paid THIS side in THIS match. A side's arithmetic may not see
      // the other's assists or it stops being a side's arithmetic.
      const paid = new Map<number, number>();
      for (const line of stats) {
        if (line.fixtureId !== fixtureId || line.assists === 0) continue;
        const code = codeOf.get(line.playerId);
        if (code === undefined || clubOf.get(code) !== side) continue;
        paid.set(code, line.assists);
      }

      const asGoals: PlGoal[] = theirs.map((goal) => ({
        minute: Number.parseInt(goal.minute, 10),
        teamId: side,
        scorer: goal.players[0] ?? null,
        assister: goal.players[1] ?? null,
        own: goal.kind === "own-goal",
      }));
      const credits = streamCredits(stream.events.content, codes);
      const settled = streamCredited(asGoals, credits, paid) ?? creditedGoals(asGoals, paid);

      return theirs.map((goal, at) =>
        goal.players[1] == null && settled[at].assister !== null
          ? { ...goal, players: [goal.players[0] ?? null, settled[at].assister] }
          : goal,
      );
    }),
  );
  return [...credited.flat(), ...loose];
}
