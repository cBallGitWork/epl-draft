import type { RawPlFixture } from "./raw";

// What a match screen states about the match itself: where it was played, how
// many watched, and who refereed it.
//
// **Its own file rather than `map.ts`**, which is past CODE_RULES §4's ceiling
// and is the goals-and-events mapper. This is the fixture's own furniture, and
// nothing here reads a player.
//
// **Three of the four fields are free.** Both the round read and the per-fixture
// detail read answer with `RawPlFixture`, so this takes that type and works on
// either — and the round read, which the wire already makes once for ten
// matches, carries `ground` 10/10 and `attendance` 9/10. Only `referee` needs
// the detail read: `matchOfficials` is 0/10 on the round and 28/30 on the detail,
// counted 5 Sep 2026 across GW1-3. A caller with only the round in hand gets a
// null referee and three real answers, which is why this is one function and not
// two.
//
// **This retires `clubGround`.** Core carries a hand-authored table of twenty
// stadium names (`football/clubs.ts`) because nothing published one; the feed
// publishes the ground of the match actually played, which is the right answer
// for a neutral venue and for a club that moves. The table stays as the fallback
// until every consumer reads this, and then it goes.

/** Where a match was played, who watched, and who refereed. */
export interface PlMatchFacts {
  /** `"Portman Road"`. Null for a fixture the feed has not grounded. */
  ground: string | null;
  /** `"Ipswich"` — the town, not the club. */
  city: string | null;
  /** The gate. **Published after the match rather than during it**, so null is
   *  ordinary on anything not yet finished, and it is a real absence rather
   *  than a nought. 24 of 30 on played fixtures, counted 5 Sep 2026 — the six
   *  without it were still in play or had just ended. */
  attendance: number | null;
  /** The interval score, home first. **Detail read only** — 30/30 on completed
   *  fixtures there, 0/10 on the round, which is what `RawPlFixture` records.
   *  Null before half time, which is a real state and not an absence.
   *
   *  The Overview took this from the sister repo's match log, which has 20 of
   *  380 fixtures. `cm0102/02.jpg` prints `HT 1-1` beside the competition, so it
   *  is a fact that screen has always wanted. */
  halfTime: { home: number; away: number } | null;
  /** The referee's name as the feed prints it. Null on the round read at any
   *  time, and on a fixture nobody has appointed one to. */
  referee: string | null;
}

/** The referee's role in the officials list.
 *
 *  **Matched rather than taken by position**, and the two running assistants are
 *  why: they carry no `role` key at all, so the array is not four labelled
 *  entries and two blanks in a fixed order — it is six entries of which two are
 *  anonymous. Counted 5 Sep 2026: `MAIN` present on 28 of the 28 fixtures that
 *  published officials at all. */
const REFEREE = "MAIN";

export function plMatchFacts(fixture: RawPlFixture): PlMatchFacts {
  return {
    ground: fixture.ground?.name ?? null,
    city: fixture.ground?.city ?? null,
    // `?? null` and not `|| null`: a gate of nought is not a fact this feed has
    // ever published, but a falsy guard would turn one into "we do not know".
    attendance: fixture.attendance ?? null,
    halfTime:
      fixture.halfTimeScore === undefined
        ? null
        : { home: fixture.halfTimeScore.homeScore, away: fixture.halfTimeScore.awayScore },
    referee:
      (fixture.matchOfficials ?? []).find((official) => official.role === REFEREE)?.name.display ??
      null,
  };
}
