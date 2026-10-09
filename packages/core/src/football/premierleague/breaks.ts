import type { RawPlFixture } from "./raw";
import { plFixtureCode, wallClock } from "./map";

// Full time off the gameweek read the wire already holds; half time is not drawn.

/** A match reaching full time, as the wire prints it. */
export interface RoundBreak {
  /** FPL's season-stable fixture code, so it joins the same way a goal does. */
  fixtureCode: number;
  /** A literal the wire's row type discriminates on: it must never collide with a goal's `kind`. */
  kind: "full-time";
  /** Elapsed seconds at the final whistle (5,760 for 90+6): orders the wire after the match's goals, never printed. */
  seconds: number;
  /** The same instant as a wall clock, the only field that orders across matches; null without a kick-off time. */
  absolute: number | null;
}

/** Every full time reached in a gameweek, oldest first; finished means `status === "C"`. */
export function mapRoundBreaks(fixtures: readonly RawPlFixture[]): RoundBreak[] {
  const breaks: RoundBreak[] = [];

  for (const fixture of fixtures) {
    const fixtureCode = plFixtureCode(fixture);
    if (fixtureCode === null || fixture.status !== "C") continue;

    // The final clock, or the nominal ninety: a break sorted to kick-off would land before the goals.
    const seconds = fixture.clock?.secs ?? NINETY_MINUTES;
    breaks.push({
      fixtureCode,
      kind: "full-time",
      seconds,
      absolute: wallClock(fixture.kickoff?.millis, seconds),
    });
  }

  return breaks.sort((a, b) => (a.absolute ?? 0) - (b.absolute ?? 0));
}

/** The fallback clock for a complete fixture the feed gave none for. */
const NINETY_MINUTES = 90 * 60;
