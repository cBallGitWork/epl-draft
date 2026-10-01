import {
  type AssistKinds,
  type FixtureStream,
  type FootballPlayer,
  type FootballSnapshot,
  type MatchEvent,
  type PlayerMatchStats,
  type RoundBreak,
  before,
  creditRoundAssists,
  mapRoundBreaks,
  mapRoundGoals,
  plFixtureCode,
  streamRedCards,
} from "@epl/core";
import { replayAt } from "./clock";
import { plRound, plStream, playerCodes } from "./plFeed";
import { orDegraded } from "./refusals";

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

/** What a replay is allowed to have seen. Live this is every event, because
 *  nothing in a feed has happened in the future; under `REPLAY_AT` it is the
 *  wire as it stood at that minute. An undated event cannot be placed in time
 *  and a replay therefore cannot show it. */
function asOf<T extends { absolute: number | null }>(events: readonly T[]): T[] {
  const at = replayAt();
  return at === null ? [...events] : before(events, at);
}

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
 *  `[]` when their API fails, which is not the swallow §2 forbids: an empty wire under a live
 *  scoreline is a panel with nothing in it, and `Wire` says which from `speaksForNow`. */
export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await orDegraded(plRound(gameweek), () => null);
  if (round === null) return [];
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
  const round = await orDegraded(plRound(gameweek), () => null);
  return round === null ? [] : asOf(mapRoundBreaks(round.content));
}

/** Each kicked-off fixture's commentary this round, filed under FPL's fixture code.
 *
 *  **The one thing on this wire that is not free**: goals and breaks come off the round read,
 *  one request for ten matches, but a red card and a rebound assist are published only in the
 *  per-fixture textstream — up to ten reads a window. Fetched once here for both.
 *
 *  Keyed by CODE, because FPL and the Premier League number fixtures differently: looked up by
 *  FPL's id, all fifty GW1-5 streams were 1992 matches. Empty, never a throw, at every step. */
export async function roundStreams(gameweek: number): Promise<Map<number, FixtureStream>> {
  const round = await plRound(gameweek).catch(() => null);
  if (round === null) return new Map();
  const entries = await Promise.all(
    round.content.map(async (fixture) => {
      const code = plFixtureCode(fixture);
      if (code === null || fixture.status === "U") return null;
      const stream = await plStream(fixture.id).catch(() => null);
      if (stream === null) return null;
      return [code, { events: stream.events.content, kickoffMillis: fixture.kickoff?.millis ?? null }] as const;
    }),
  );
  return new Map(entries.filter((entry) => entry !== null));
}

/** Every red card in the round, joined to the men who own them. Reds only: a round has about a
 *  hundred bookings, and a wire of yellows is a wire nobody reads down. */
export function roundRedCards(
  streams: ReadonlyMap<number, FixtureStream>,
  players: readonly FootballPlayer[],
): MatchEvent[] {
  return asOf(streamRedCards(streams, playerCodes(players)));
}

/** The round's goals with the assists FPL pays and Opta never placed (`creditRoundAssists`).
 *  The streams are `roundRedCards`' own; the kinds are the stats league's (`roundAssistKinds`). */
export function creditAssists(
  goals: readonly MatchEvent[],
  snapshot: FootballSnapshot,
  stats: readonly PlayerMatchStats[],
  streams: ReadonlyMap<number, FixtureStream>,
  kinds: ReadonlyMap<number, AssistKinds>,
): MatchEvent[] {
  const codes = playerCodes(snapshot.players);
  return creditRoundAssists(goals, snapshot.players, snapshot.fixtures, stats, streams, codes, kinds);
}
