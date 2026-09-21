import { instantOf } from "../config";
import type { Fixture, FootballPlayer, FootballSnapshot, MatchEvent } from "./types";

// Rewinding a played round to a moment inside it, so a Saturday can be looked at
// on a Tuesday. Pure: the instant is injected and the only inputs are a snapshot
// and the round's goals.
//
// A rehearsal instrument and never a source of truth — the app wears a marker
// whenever it is running on one (`app/clock.ts`).

/** Minutes of wall clock a match occupies, kick-off to whistle: two halves, the
 *  interval, and enough stoppage that nothing is still live at full time. */
const MATCH_MINUTES = 115;

/** Minutes of the interval, which the match clock does not count. */
const INTERVAL_MINUTES = 15;

/** Minutes in a half, and the point the interval starts. */
const HALF_MINUTES = 45;

/** The gameweek an instant falls in: the round of the latest dated fixture
 *  kicked off by then. Null when the season had not started. */
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

/** What had happened in a round by `at`. Goals and full-time marks carry the
 *  same field that orders them across ten matches, so one filter serves both;
 *  an event with no instant cannot be placed and is dropped. */
export function before<T extends { absolute: number | null }>(
  events: readonly T[],
  at: string,
): T[] {
  const now = instant(at);
  return events.filter((event) => event.absolute !== null && event.absolute <= now);
}

/** A played round as it stood at `at` — scores, statuses and clocks rewound.
 *
 *  `fetchedAt` moves with it: the snapshot now describes that instant, and
 *  `speaksForNow` compares it against the same replayed clock. */
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
  // An undated fixture has no place in the window, and one already over at `at`
  // is over in the replay too — both keep what the provider said.
  if (kickoff === null || now >= kickoff + MATCH_MINUTES * 60_000) return fixture;

  if (now < kickoff) {
    return { ...fixture, status: "upcoming", homeScore: null, awayScore: null, minutes: 0, settled: false };
  }

  const score = scoreline(fixture, goals, clubs);
  return {
    ...fixture,
    status: "live",
    homeScore: score?.home ?? null,
    awayScore: score?.away ?? null,
    minutes: matchClock(Math.floor((now - kickoff) / 60_000)),
    settled: false,
  };
}

/** Minutes on the match clock, from minutes of wall clock since kick-off. The
 *  interval is fifteen minutes nobody counts, and the clock stops at ninety. */
function matchClock(elapsed: number): number {
  if (elapsed <= HALF_MINUTES) return elapsed;
  return Math.min(HALF_MINUTES * 2, Math.max(HALF_MINUTES, elapsed - INTERVAL_MINUTES));
}

interface Scoreline {
  home: number;
  away: number;
}

/** The score these goals add up to, or null when one of them names a man the
 *  bridge could not place — 1 of 27 goals in gameweek 5, which is one fixture of
 *  ten. A dash says the replay cannot tell; a number short of the truth would
 *  not (DESIGN §7).
 *
 *  A scorer's club is enough to place a goal only because an own goal counts for
 *  the other side, which is the one line below that is about football. */
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
