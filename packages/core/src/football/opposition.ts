import { clubById, fixturesInOrder, kickoffOrder } from "./selectors";
import type { Club, Fixture, FootballSnapshot } from "./types";

// Who each club plays in the round a snapshot describes: a football fact, never inferred from the league layer.

/** One club's match this round, from that club's point of view. */
export interface Opposition {
  /** Who they play. */
  club: Club;
  /** Whether the club being asked about is at home. */
  home: boolean;
  /** FPL's 1–5 difficulty for the club being asked about, not its opponent; null when FPL published none. */
  difficulty: number | null;
  fixture: Fixture;
}

/** Every club's fixtures this round by club id: none in a blank, two in a double, undated last.
 *  A club with no match is absent rather than an empty list. */
export function oppositionByClub(snapshot: FootballSnapshot): Map<number, Opposition[]> {
  const clubs = clubById(snapshot);
  const byClub = new Map<number, Opposition[]>();

  function add(clubId: number, opponentId: number, home: boolean, fixture: Fixture): void {
    const opponent = clubs.get(opponentId);
    // A fixture naming a club the snapshot does not list is skipped, never given an invented opponent.
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

/** Whether any of a club's matches this round has kicked off; false with none.
 *  Ask this, never the stats: FPL's live feed has a row for every player once the round's first match starts. */
export function kickedOff(opposition: readonly Opposition[] | undefined): boolean {
  return opposition?.some((against) => against.fixture.status !== "upcoming") ?? false;
}

/** Whether every match a club has this round is finished; false with none, so a blank is never "over". */
export function matchesOver(opposition: readonly Opposition[] | undefined): boolean {
  if (opposition === undefined || opposition.length === 0) return false;
  return opposition.every((against) => against.fixture.status === "finished");
}

/** A club's next `count` upcoming matches across the season, by kickoff with undated last; read from `status`, not a clock. */
export function nextFixtures(
  fixtures: readonly Fixture[],
  clubs: Map<number, Club>,
  clubId: number,
  count: number,
): Opposition[] {
  const mine = fixtures.filter(
    (f) =>
      f.status === "upcoming" && (f.homeClubId === clubId || f.awayClubId === clubId),
  );

  mine.sort(kickoffOrder);

  const run: Opposition[] = [];
  for (const fixture of mine) {
    if (run.length === count) break;
    const home = fixture.homeClubId === clubId;
    const opponent = clubs.get(home ? fixture.awayClubId : fixture.homeClubId);
    // An unknown opponent is skipped and does not count towards the run.
    if (!opponent) continue;
    run.push({
      club: opponent,
      home,
      difficulty: home ? fixture.homeDifficulty : fixture.awayDifficulty,
      fixture,
    });
  }
  return run;
}

/** How a fixture is written everywhere: `BRE (H)`, `ARS (A)`; a double joins both, a blank is null. */
export function fixtureLabel(opposition: readonly Opposition[] | undefined): string | null {
  if (opposition === undefined || opposition.length === 0) return null;
  return opposition
    .map((match) => `${match.club.shortName} (${match.home ? "H" : "A"})`)
    .join(" · ");
}
