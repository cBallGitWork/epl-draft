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

/** Whether any of a club's matches this round has kicked off.
 *
 *  The question four views were asking of the stats and getting wrong. FPL's
 *  live endpoint carries a row for **every** player in the league from the
 *  round's first whistle — 600 of them on 22 Aug 2026, 569 on zero minutes —
 *  so the presence of a stat line says the round has started, never that this
 *  man's match has. A view that read it as the latter drew every player as
 *  played from the Friday night on, and the fixture it should have been
 *  printing instead never appeared again until the round closed.
 *
 *  Asked of the fixtures because that is where the answer lives, and phrased as
 *  the round rather than the man on purpose: a named substitute whose match is
 *  over has kicked off in every sense a screen cares about — his nought is
 *  final, and offering him a fixture chip would promise football that has
 *  already been played.
 *
 *  Undefined is false: a blank gameweek and an unresolved slot both have no
 *  match to have started. */
export function kickedOff(opposition: readonly Opposition[] | undefined): boolean {
  return opposition?.some((against) => against.fixture.status !== "upcoming") ?? false;
}

/** Whether every match a club has this round is finished; false with none, so a blank is never "over". */
export function matchesOver(opposition: readonly Opposition[] | undefined): boolean {
  if (opposition === undefined || opposition.length === 0) return false;
  return opposition.every((against) => against.fixture.status === "finished");
}

/** The next `count` matches a club has, soonest first.
 *
 *  A single chip answers "who has he got this week", which is the wrong question
 *  for anyone deciding whether to hold a player through a bad one. A run of five
 *  is what turns FPL's difficulty rating from a colour into an argument.
 *
 *  Over the whole season's fixtures rather than a snapshot's round, because the
 *  answer is by definition in rounds nobody is looking at. Which matches are
 *  still to come is read off `status`, which is FPL's own statement, rather than
 *  off a clock this layer has no business holding.
 *
 *  Ordered by kickoff with undated last — a postponement keeps its "upcoming"
 *  status and loses its date, and a match with no time must not sort ahead of
 *  Saturday's. */
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

  mine.sort((a, b) => {
    if (a.kickoff === b.kickoff) return a.id - b.id;
    if (!a.kickoff) return 1;
    if (!b.kickoff) return -1;
    return a.kickoff.localeCompare(b.kickoff);
  });

  const run: Opposition[] = [];
  for (const fixture of mine) {
    if (run.length === count) break;
    const home = fixture.homeClubId === clubId;
    const opponent = clubs.get(home ? fixture.awayClubId : fixture.homeClubId);
    // A fixture naming a club we do not have is FPL's inconsistency to explain,
    // not ours to invent an opponent for — the same rule `oppositionByClub`
    // applies, and it must not silently shorten the run either, so it does not
    // count towards it.
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

/** How a fixture is written wherever one appears: `BRE (H)`, `ARS (A)`.
 *
 *  Craig, 2 Sep 2026, as a site-wide rule: "just have BRE (H) instead of v BRE,
 *  or @" — and "(A) instead of at". Four screens were spelling the same fact
 *  three different ways (`v BRE`, `@ BRE`, and a bare `H`/`A` chip beside the
 *  club), which is exactly the drift a shared function exists to stop.
 *
 *  **The bracket is the convention every printed fixture list uses**, which is
 *  the argument for it over `v` and `@`: those two carry the same information at
 *  the cost of reading as different KINDS of thing — a preposition before the
 *  name and a symbol before the name — while `(H)` and `(A)` are one shape with
 *  one letter changed, and a column of them scans in a way a column of mixed
 *  `v`/`@` does not.
 *
 *  A double gameweek is both fixtures joined, because both are real and picking
 *  one would print a confident wrong opponent. A blank one is null rather than a
 *  dash: the caller decides what nothing looks like in its own row. */
export function fixtureLabel(opposition: readonly Opposition[] | undefined): string | null {
  if (opposition === undefined || opposition.length === 0) return null;
  return opposition
    .map((match) => `${match.club.shortName} (${match.home ? "H" : "A"})`)
    .join(" · ");
}
