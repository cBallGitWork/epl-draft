import { clubById, fixturesInOrder } from "./selectors";
import type { Club, Fixture, FootballSnapshot } from "./types";

// Who each club plays in the round a snapshot describes.
//
// A squad screen shows fifteen players from a dozen clubs, and the question
// under every one of their names is the same: who has he got this week. That is
// a football fact — the fixture list is fixed for everyone, whoever is running
// the fantasy league — so it is answered here and never inferred from the
// league layer.

/** One club's match this round, from that club's point of view. */
export interface Opposition {
  /** Who they play. */
  club: Club;
  /** Whether the club being asked about is at home. */
  home: boolean;
  /** FPL's 1–5 difficulty for the club being asked about — his side of the
   *  fixture, not the opponent's. Null when FPL published none. */
  difficulty: number | null;
  fixture: Fixture;
}

/** Every club's fixtures this round, keyed by club id.
 *
 *  A list per club rather than one fixture, because both edges are real: a blank
 *  gameweek leaves a club with none and a double gives it two, and a view that
 *  assumed exactly one would print a confident wrong opponent in both cases.
 *
 *  Ordered by kickoff with undated last, so a double reads in the order it will
 *  be played. Clubs with no match are absent rather than present with an empty
 *  list — `get` answers undefined either way, and one spelling of absence is
 *  enough. */
export function oppositionByClub(snapshot: FootballSnapshot): Map<number, Opposition[]> {
  const clubs = clubById(snapshot);
  const byClub = new Map<number, Opposition[]>();

  function add(clubId: number, opponentId: number, home: boolean, fixture: Fixture): void {
    const opponent = clubs.get(opponentId);
    // A fixture naming a club this snapshot does not list is FPL's inconsistency
    // to explain, not ours to invent an opponent for.
    if (!opponent) return;
    const against: Opposition = {
      club: opponent,
      home,
      difficulty: home ? fixture.homeDifficulty : fixture.awayDifficulty,
      fixture,
    };
    const rows = byClub.get(clubId);
    if (rows) rows.push(against);
    else byClub.set(clubId, [against]);
  }

  for (const fixture of fixturesInOrder(snapshot)) {
    add(fixture.homeClubId, fixture.awayClubId, true, fixture);
    add(fixture.awayClubId, fixture.homeClubId, false, fixture);
  }

  return byClub;
}

