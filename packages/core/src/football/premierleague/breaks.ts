import type { RawPlFixture } from "./raw";
import { plFixtureCode } from "./map";

// Full time, off the round read the wire already holds.
//
// Craig, 5 Sep 2026: *"Wire should also include half and full time."* Sky's
// vidiprinter prints `HALF TIME  LEEDS 1  BRISTOL CITY 0` between the goals, and
// a wire that only ever says GOAL cannot tell a reader that the 2-1 he is
// looking at is finished.
//
// **And half time came straight back out, the same evening** (Craig: *"ditch the
// HT"*). On a Saturday teatime the two land within an hour of each other and the
// scoreline between them rarely moves, so the wire drew `HT HUL 0 v AVL 0`
// directly under `FT HUL 0 v AVL 0` — the same eight rows the fold pays for,
// spent saying one thing twice. Ten fixtures would have been twenty rows of
// furniture between the goals a reader came for.
//
// Full time survives because it is the one thing a scoreline cannot say about
// itself: a 2-1 with a clock on it and a 2-1 that is finished look identical.
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
//   documents `"2"` for the second half. Seen in that count: `"0"` on 2, `"1"` on
//   1, `"F"` on 7 — no fixture was at half time, so the interval's own letter was
//   unverified. **It is `"H"`, seen live at 17:26Z the same evening** (Hull v
//   Aston Villa, `status=L phase=H`), and the wire drew its `HT` line off it. The
//   rule below stays "past the first half" rather than a match on that letter,
//   which is what made it right before anyone had seen one.
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
  /** One member, and it stays a literal union because it is what the wire's row
   *  type discriminates on — a goal's `kind` comes from Opta's vocabulary and
   *  this must never collide with it. */
  kind: "full-time";
  /** Elapsed seconds in this fixture at full time — the feed's own final clock,
   *  5,760 for a match that ended 90+6. Used to ORDER a wire and never printed,
   *  which is what puts it after every goal in its own match. */
  seconds: number;
  /** The same instant as a wall clock, which is the only field that orders
   *  events across ten matches. Null when the fixture is dated and not timed,
   *  exactly as a goal's is. */
  absolute: number | null;
}

/** Every full time reached in a round, oldest first.
 *
 *  A match that has not finished yields nothing — the wire is a record of what
 *  has happened. */
export function mapRoundBreaks(fixtures: readonly RawPlFixture[]): RoundBreak[] {
  const breaks: RoundBreak[] = [];

  for (const fixture of fixtures) {
    const fixtureCode = plFixtureCode(fixture);
    if (fixtureCode === null || fixture.status !== "C") continue;

    // The final clock, or the nominal ninety if the feed gave none — a complete
    // fixture with no clock is not one we have seen, and a break sorted to
    // kick-off would be worse than one sorted to ninety minutes.
    const seconds = fixture.clock?.secs ?? NINETY_MINUTES;
    const kickoff = fixture.kickoff?.millis;
    breaks.push({
      fixtureCode,
      kind: "full-time",
      seconds,
      absolute: kickoff === undefined ? null : kickoff + seconds * 1000,
    });
  }

  return breaks.sort((a, b) => (a.absolute ?? 0) - (b.absolute ?? 0));
}

/** The fallback clock for a complete fixture the feed gave none for. */
const NINETY_MINUTES = 90 * 60;

