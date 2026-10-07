import type { Fixture } from "@epl/core";

/** Whether FPL has a score for the match: kicked off or played. */
export function hasScore(fixture: Pick<Fixture, "homeScore" | "awayScore">): boolean {
  return fixture.homeScore !== null && fixture.awayScore !== null;
}
