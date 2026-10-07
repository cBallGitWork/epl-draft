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

// The round's questions, from the Premier League's own feed, whose round read carries every goal
// in one request; FPL publishes no minute for a goal. One match's questions are in `matchFeed.ts`,
// and the reads and identity join in `plFeed.ts`.

/** Every event when live; under `REPLAY_AT`, those before it, so an undated event is dropped. */
function asOf<T extends { absolute: number | null }>(events: readonly T[]): T[] {
  const at = replayAt();
  return at === null ? [...events] : before(events, at);
}

/** Every goal in the round joined to FPL players, newest first by `absolute` (kickoff plus elapsed),
 *  not the match clock, which starts at nought in every match. `[]` when their API fails. */
export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await orDegraded(plRound(gameweek), () => null);
  if (round === null) return [];
  const goals = asOf(mapRoundGoals(round.content, playerCodes(players)));
  return goals.sort((a, b) => (b.absolute ?? 0) - (a.absolute ?? 0));
}

/** Every half time and full time reached in the round, oldest first; empty rather than a throw. */
export async function roundBreaks(gameweek: number): Promise<RoundBreak[]> {
  const round = await orDegraded(plRound(gameweek), () => null);
  return round === null ? [] : asOf(mapRoundBreaks(round.content));
}

/** Each kicked-off fixture's commentary this round, keyed by FPL's fixture code, never its id, which
 *  the Premier League numbers differently. Up to ten reads a window; empty, never a throw. */
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
