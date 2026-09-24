import type { Fixture } from "../types";

// A window of recent gameweeks, and the intel rows inside it. The exports key a row on FPL's fixture id,
// so the window is a set of gameweeks and the fixtures are how a row finds its gameweek.

/** Each scheduled fixture's gameweek, by FPL fixture id. */
export function fixtureGameweeks(fixtures: readonly Fixture[]): Map<number, number> {
  const byFixture = new Map<number, number>();
  for (const fixture of fixtures) {
    if (fixture.gameweek !== null) byFixture.set(fixture.id, fixture.gameweek);
  }
  return byFixture;
}

/** The last `count` gameweeks with a match finished, oldest first. */
export function lastPlayed(fixtures: readonly Fixture[], count: number): number[] {
  const played = new Set<number>();
  for (const fixture of fixtures) {
    if (fixture.status === "finished" && fixture.gameweek !== null) played.add(fixture.gameweek);
  }
  return [...played].sort((a, b) => a - b).slice(-count);
}

/** The rows whose fixture falls in the window. */
export function inGameweeks<Row extends { fplFixtureId: number }>(
  rows: readonly Row[],
  gameweekOf: ReadonlyMap<number, number>,
  gameweeks: ReadonlySet<number>,
): Row[] {
  return rows.filter((row) => {
    const gameweek = gameweekOf.get(row.fplFixtureId);
    return gameweek !== undefined && gameweeks.has(gameweek);
  });
}

/** A window as the desk writes it: "GW6–11", "GW6" for one week, and nothing for none. */
export function gameweekSpan(gameweeks: readonly number[]): string {
  if (gameweeks.length === 0) return "";
  const first = gameweeks[0];
  const last = gameweeks[gameweeks.length - 1];
  return first === last ? `GW${first}` : `GW${first}–${last}`;
}
