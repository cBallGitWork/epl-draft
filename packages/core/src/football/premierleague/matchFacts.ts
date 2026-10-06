import type { RawPlFixture } from "./raw";

// The fixture's own furniture: ground, gate, half-time score and referee, off either the gameweek or the detail read.
// Only the detail read carries the referee and the half-time score.

/** Where a match was played, who watched, and who refereed. */
export interface PlMatchFacts {
  /** `"Portman Road"`. Null for a fixture the feed has not grounded. */
  ground: string | null;
  /** `"Ipswich"` — the town, not the club. */
  city: string | null;
  /** The gate, published after the match: null is ordinary before then, and never a nought. */
  attendance: number | null;
  /** The interval score, home first; detail read only, and null before half time. */
  halfTime: { home: number; away: number } | null;
  /** The referee's name as the feed prints it. Null on the gameweek read, and before one is appointed. */
  referee: string | null;
}

/** The referee's role, matched rather than taken by position: the two assistants carry no `role` at all. */
const REFEREE = "MAIN";

export function plMatchFacts(fixture: RawPlFixture): PlMatchFacts {
  return {
    ground: fixture.ground?.name ?? null,
    city: fixture.ground?.city ?? null,
    // `??`, not `||`: a falsy guard would turn a gate of nought into "we do not know".
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
