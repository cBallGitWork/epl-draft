import { POSTPONED_AFTER_MINUTES } from "../config";
import { MS_PER_MINUTE } from "../time";
import type { Fixture, FixtureStatus, FootballSnapshot } from "./types";

// Where a round stands in time as a Saturday runs; `selectors.ts` answers what a snapshot contains.
// Each function answers one question, and is wrong when asked in place of another.

/** True when any match is in play: drives the live treatment, never the poll rate (that is `duringGameweek`). */
export function isMatchdayLive(snapshot: FootballSnapshot): boolean {
  return snapshot.fixtures.some((f) => f.status === "live");
}

/** From the round's first dated kickoff until its last dated match finishes: whether Matchday shows, and the poll rate.
 *  Wider than `isMatchdayLive`, since the gap between kickoffs counts; closes on `finished`, not `data_checked`.
 *  Undated fixtures are ignored at both ends, and so is one unstarted `POSTPONED_AFTER_MINUTES` past its kickoff. */
export function duringGameweek(snapshot: FootballSnapshot, at: string): boolean {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return false;

  let firstKickoff = Infinity;
  let everythingFinished = true;
  let anyDated = false;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    if (Number.isNaN(kickoff)) continue;
    if (fixture.status === "upcoming" && now - kickoff > POSTPONED_AFTER_MINUTES * MS_PER_MINUTE) continue;
    anyDated = true;
    if (kickoff < firstKickoff) firstKickoff = kickoff;
    if (fixture.status !== "finished") everythingFinished = false;
  }

  return anyDated && now >= firstKickoff && !everythingFinished;
}
/** Whether any match in this gameweek has kicked off; `gameweekStatus` reads "upcoming" with nine results in. */
export function gameweekStarted(fixtures: readonly Fixture[], gameweek: number): boolean {
  return fixtures.some(
    (fixture) => fixture.gameweek === gameweek && fixture.status !== "upcoming",
  );
}

/** A gameweek's status: live while any match is, finished once all are, else upcoming (also with no fixtures).
 *  Every view that marks a winner gates on "finished" from here: a half-time lead is not a win. */
export function gameweekStatus(
  fixtures: readonly Fixture[],
  gameweek: number,
): FixtureStatus {
  const round = fixtures.filter((fixture) => fixture.gameweek === gameweek);
  if (round.length === 0) return "upcoming";
  if (round.some((fixture) => fixture.status === "live")) return "live";
  return round.every((fixture) => fixture.status === "finished") ? "finished" : "upcoming";
}
/** The gameweek and kickoff of the next match to start, or null; not the round in view, which is `focusGameweek`.
 *  Ordered by kickoff, never by lowest unfinished gameweek: FPL leaves a postponed fixture in its original `event`.
 *  Fixtures with no kickoff or no gameweek are ignored. */
export function nextRound(
  fixtures: readonly Fixture[],
  at: string,
): { gameweek: number; kickoff: string } | null {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return null;

  let soonest: { gameweek: number; kickoff: string; at: number } | null = null;
  for (const fixture of fixtures) {
    if (fixture.kickoff === null || fixture.gameweek === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    // Inclusive: a ball kicked at this instant is the next one; `duringGameweek` opens on the same boundary.
    if (Number.isNaN(kickoff) || kickoff < now) continue;
    if (soonest === null || kickoff < soonest.at) {
      soonest = { gameweek: fixture.gameweek, kickoff: fixture.kickoff, at: kickoff };
    }
  }

  return soonest === null ? null : { gameweek: soonest.gameweek, kickoff: soonest.kickoff };
}

/** Seconds until football is live: nought during the round, the wait to the next kickoff otherwise,
 *  null with nothing ahead. Relative, so a client can count it down without trusting its own clock. */
export function secondsToLive(snapshot: FootballSnapshot, fixtures: readonly Fixture[], at: string): number | null {
  if (duringGameweek(snapshot, at)) return 0;
  const next = nextRound(fixtures, at);
  if (next === null) return null;
  return Math.max(0, Math.ceil((Date.parse(next.kickoff) - Date.parse(at)) / 1000));
}

/** How settled a finished round is: bonus still landing, bonus in, or signed off by FPL. */
type FinishedState = "bonus-settling" | "provisional" | "final";

/** A finished round's rung: `finished_provisional` is bonus-settling, bonus in is provisional, `data_checked` is final.
 *  Null while in play and before kickoff alike; `isMatchdayLive` tells them apart. Undated fixtures are ignored. */
export function roundFinished(snapshot: FootballSnapshot): FinishedState | null {
  let anyDated = false;
  let allFinished = true;
  let allSettled = true;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    anyDated = true;
    if (fixture.status !== "finished") allFinished = false;
    if (!fixture.settled) allSettled = false;
  }

  if (!anyDated || !allFinished) return null;
  if (!allSettled) return "bonus-settling";
  return snapshot.dataChecked ? "final" : "provisional";
}

/** In play, or a rung down from the last whistle; null before kickoff and between two kickoffs alike.
 *  Pairs `isMatchdayLive` with `roundFinished`: neither alone answers both "live" and "final". */
export type RoundState = "live" | FinishedState | null;

export function roundState(snapshot: FootballSnapshot): RoundState {
  return isMatchdayLive(snapshot) ? "live" : roundFinished(snapshot);
}

/** Whether any of this gameweek's fixtures in the snapshot has kicked off, read from `status`, not a clock.
 *  Not the inverse of `roundState`, whose null also covers the gap between two kickoffs. */
export function roundStarted(snapshot: FootballSnapshot, gameweek: number): boolean {
  return snapshot.fixtures.some(
    (fixture) => fixture.gameweek === gameweek && fixture.status !== "upcoming",
  );
}
