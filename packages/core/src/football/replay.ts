import { HALF_MINUTES } from "../config";
import { MS_PER_MINUTE, instantOf } from "../time";
import type { Fixture, FootballPlayer, FootballSnapshot, MatchEvent } from "./types";

// A played round rewound to an injected instant inside it: a rehearsal instrument, never a source of truth.

/** Wall-clock minutes from kick-off to whistle, with enough stoppage that nothing is still live at full time. */
const MATCH_MINUTES = 115;

/** Minutes of the interval, which the match clock does not count. */
const INTERVAL_MINUTES = 15;


/** The gameweek of the latest dated fixture kicked off by `at`; null before the season starts. */
export function roundAt(fixtures: readonly Fixture[], at: string): number | null {
  const now = instant(at);
  let latest = -Infinity;
  let gameweek: number | null = null;

  for (const fixture of fixtures) {
    if (fixture.kickoff === null || fixture.gameweek === null) continue;
    const kickoff = instantOf(fixture.kickoff);
    if (kickoff === null || kickoff > now || kickoff <= latest) continue;
    latest = kickoff;
    gameweek = fixture.gameweek;
  }
  return gameweek;
}

/** The events that had happened by `at`; one with no instant is dropped. */
export function before<T extends { absolute: number | null }>(
  events: readonly T[],
  at: string,
): T[] {
  const now = instant(at);
  return events.filter((event) => event.absolute !== null && event.absolute <= now);
}

/** A played round as it stood at `at`, scores, statuses and clocks rewound; `fetchedAt` moves to `at` with it. */
export function rewindRound(
  snapshot: FootballSnapshot,
  goals: readonly MatchEvent[],
  at: string,
): FootballSnapshot {
  const now = instant(at);
  const clubs = clubByCode(snapshot.players);
  const scored = before(goals, at);

  return {
    ...snapshot,
    fetchedAt: at,
    fixtures: snapshot.fixtures.map((fixture) =>
      rewindFixture(
        fixture,
        now,
        scored.filter((goal) => goal.fixtureCode === fixture.code),
        clubs,
      ),
    ),
  };
}

function rewindFixture(
  fixture: Fixture,
  now: number,
  goals: readonly MatchEvent[],
  clubs: Map<number, number>,
): Fixture {
  const kickoff = fixture.kickoff === null ? null : instantOf(fixture.kickoff);
  // An undated fixture, or one already over at `at`, keeps what the provider said.
  if (kickoff === null || now >= kickoff + MATCH_MINUTES * MS_PER_MINUTE) return fixture;

  if (now < kickoff) {
    return { ...fixture, status: "upcoming", homeScore: null, awayScore: null, minutes: 0, settled: false };
  }

  const score = scoreline(fixture, goals, clubs);
  return {
    ...fixture,
    status: "live",
    homeScore: score?.home ?? null,
    awayScore: score?.away ?? null,
    minutes: matchClock(Math.floor((now - kickoff) / MS_PER_MINUTE)),
    settled: false,
  };
}

/** The match clock from wall-clock minutes since kick-off: the interval is not counted, and it stops at ninety. */
function matchClock(elapsed: number): number {
  if (elapsed <= HALF_MINUTES) return elapsed;
  return Math.min(HALF_MINUTES * 2, Math.max(HALF_MINUTES, elapsed - INTERVAL_MINUTES));
}

interface Scoreline {
  home: number;
  away: number;
}

/** The score these goals add up to by scorer's club (an own goal counts for the other side).
 *  Null when a scorer cannot be placed: a dash, never a number short of the truth. */
function scoreline(
  fixture: Fixture,
  goals: readonly MatchEvent[],
  clubs: Map<number, number>,
): Scoreline | null {
  let home = 0;
  let away = 0;

  for (const goal of goals) {
    const scorer = goal.players[0];
    const club = scorer === null || scorer === undefined ? undefined : clubs.get(scorer);
    if (club === undefined) return null;
    if ((club === fixture.homeClubId) !== (goal.kind === "own-goal")) home += 1;
    else away += 1;
  }
  return { home, away };
}

function clubByCode(players: readonly FootballPlayer[]): Map<number, number> {
  return new Map(players.map((player) => [player.code, player.clubId]));
}

function instant(at: string): number {
  const now = instantOf(at);
  if (now === null) throw new Error(`Replay instant is unreadable: "${at}"`);
  return now;
}
