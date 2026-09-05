import type { RawPlFixture } from "./raw";
import { plFixtureCode } from "./map";

// Half time and full time, off the round read the wire already holds.
//
// Craig, 5 Sep 2026: *"Wire should also include half and full time."* Sky's
// vidiprinter prints `HALF TIME  LEEDS 1  BRISTOL CITY 0` between the goals, and
// a wire that only ever says GOAL cannot tell a reader that the 2-1 he is
// looking at is finished.
//
// **One request, and it is a request already made.** The obvious source is the
// per-fixture textstream, which carries Opta's own `end 1` and `end 14` lines
// with the score written into the prose — and costs one request per match, ten a
// round, on the screen sixteen phones poll every thirty seconds. The round read
// carries enough, so this reads that instead.
//
// **What the round read actually publishes**, counted live on GW3, 5 Sep 2026,
// all ten fixtures:
//
// · `status` — `"U"` upcoming, `"L"` live, `"C"` complete. 10/10.
// · `phase` — `"0"` upcoming, `"1"` first half, `"F"` full time; `raw.ts`
//   documents `"2"` for the second half. Seen: `"0"` on 2, `"1"` on 1, `"F"` on
//   7. **No fixture was at half time during the count**, so the phase letter for
//   the interval itself is unverified — which is why the rule below is "past the
//   first half" rather than a match on one letter.
// · `clock` — `{secs, label}`, and on a COMPLETE fixture it is the final
//   whistle: `5760 / "90+6'00"`. 8/10 (absent on the two unstarted).
// · **`halfTimeScore` is absent on all ten.** It is on the DETAIL read and not
//   on this one, so the interval score is not published here at any price — see
//   the note on `seconds` for what that costs and what it does not.
//
// So the break itself is a fact this read gives and the SCORE at half time is
// not; the app edge counts that off the goals it already has, which carry a
// minute each. Nothing here invents one.

/** A match reaching an interval, as the wire prints it. */
export interface RoundBreak {
  /** FPL's season-stable fixture code, so it joins the same way a goal does. */
  fixtureCode: number;
  kind: "half-time" | "full-time";
  /** Elapsed seconds in this fixture at the break, for ordering within a match.
   *
   *  **A lower bound at half time, and exact at full time.** The feed's clock
   *  moves on into the second half, so the interval's own reading cannot be read
   *  back later; what is certain is that half time came after the last
   *  first-half goal and no earlier than 45 minutes, and that is what this
   *  carries. Full time is the fixture's own final clock — 5,760 seconds for a
   *  match that ended 90+6.
   *
   *  It is used to ORDER a wire and never printed, so a bound is enough: the
   *  guarantee that matters is that HALF TIME sits under the last goal of the
   *  first half rather than over it. */
  seconds: number;
  /** The same instant as a wall clock, which is the only field that orders
   *  events across ten matches. Null when the fixture is dated and not timed,
   *  exactly as a goal's is. */
  absolute: number | null;
}

/** Nominal half time, in seconds. A first half runs longer than this every week;
 *  what it can never do is run shorter, which is what makes it a floor. */
const FIRST_HALF = 45 * 60;

/** The break follows the last event of its half rather than sharing a second
 *  with it. One second, because the feed's clock is in seconds. */
const AFTER = 1;

/** Every interval reached in a round, oldest first.
 *
 *  A fixture yields up to two: half time once the first half is over, and full
 *  time once the match is. An unstarted match yields none, and a match in its
 *  first half yields none — the wire is a record of what has happened.
 *
 *  **"Past the first half" and not a letter.** `phase` is `"1"` while the first
 *  half is on and `"F"` when the match is over; the letter for the interval
 *  itself was not observed in the count above, so this asks whether the fixture
 *  has started and left `"1"` behind. A phase letter nobody has seen cannot make
 *  this wrong — it can only be one more value that means "not the first half",
 *  which is the answer either way. */
export function mapRoundBreaks(fixtures: readonly RawPlFixture[]): RoundBreak[] {
  const breaks: RoundBreak[] = [];

  for (const fixture of fixtures) {
    const fixtureCode = plFixtureCode(fixture);
    if (fixtureCode === null) continue;

    const kickoff = fixture.kickoff?.millis;
    const at = (seconds: number): RoundBreak["absolute"] =>
      kickoff === undefined ? null : kickoff + seconds * 1000;

    if (started(fixture) && !inFirstHalf(fixture)) {
      const seconds = Math.max(FIRST_HALF, lastFirstHalfGoal(fixture) + AFTER);
      breaks.push({ fixtureCode, kind: "half-time", seconds, absolute: at(seconds) });
    }

    // The final clock, or the nominal ninety if the feed gave none — a complete
    // fixture with no clock is not one we have seen, and a break sorted to
    // kick-off would be worse than one sorted to ninety minutes.
    if (fixture.status === "C") {
      const seconds = fixture.clock?.secs ?? FIRST_HALF * 2;
      breaks.push({ fixtureCode, kind: "full-time", seconds, absolute: at(seconds) });
    }
  }

  return breaks.sort((a, b) => (a.absolute ?? 0) - (b.absolute ?? 0));
}

function started(fixture: RawPlFixture): boolean {
  return fixture.status !== "U";
}

function inFirstHalf(fixture: RawPlFixture): boolean {
  return fixture.phase === "1";
}

/** The clock of the last goal scored before the interval, or nought.
 *
 *  Each goal carries its own `phase`, which is the feed's own answer to which
 *  half it was in and is better than reading its minute: a goal at 45+3 reads
 *  2,824 seconds, past the nominal forty-five, and is still a first-half goal. */
function lastFirstHalfGoal(fixture: RawPlFixture): number {
  let latest = 0;
  for (const goal of fixture.goals ?? []) {
    if (goal.phase !== "1") continue;
    const secs = goal.clock?.secs;
    if (secs !== undefined && secs > latest) latest = secs;
  }
  return latest;
}
