// What a squad and its men are worth in one period: what they have scored, and
// what Fantrax reckons they will.
//
// Split out of `types.ts` when it crossed CODE_RULES' 300-line ceiling, and this
// is the half that came away whole — every type below is a number Fantrax puts
// on a team or on one of its players for a single period, and they share the one
// rule the app never breaks about those: **their numbers are authoritative and
// ours are labelled**. Nothing here may be computed by us and nothing here may
// be printed as anything but Fantrax's.

/** What one squad has scored in one period, according to Fantrax.
 *
 *  Theirs, and that is the whole point: they run the competition, their scoring
 *  system is a commissioner setting, and the real league scores five categories
 *  FPL does not publish at all. We read this number and never compute one — an
 *  engine of our own could only have produced a systematically wrong total for
 *  defenders, midfielders and keepers, and would have had to say so on screen. */
export interface LiveTeamScore {
  teamId: string;
  /** Null when Fantrax did not give a total. Absence is not nought. */
  points: number | null;
  /** Active players whose fixture has not finished, or null when unknown. Names
   *  nobody, so it is publishable even while the lineup gate is closed. */
  toPlay: number | null;
}

/** What Fantrax reckons a squad will score in a period nobody has played.
 *
 *  A separate type from `LiveTeamScore` and not a field on it, because a
 *  projection is a different claim from a score and the app has one rule it
 *  never breaks about those: their numbers are authoritative and ours are
 *  labelled. Nothing may print one of these as a total. */
export interface TeamProjection {
  teamId: string;
  /** Null when Fantrax projected nothing for this squad. Not nought: "they have
   *  not guessed" and "they guess nothing" are different claims. */
  points: number | null;
}

/** What one player scored in one period, priced at the ROSTER SLOT his manager
 *  chose — the only per-player number that agrees with the team total beside it.
 *
 *  Fantrax's stat tables price the same man at his default position instead, and
 *  48 of the pool's 622 players are eligible at two. Because the deeper slot pays
 *  strictly more, an optimal lineup always files those men off their default, so
 *  the disagreement is the normal case for the players who matter rather than an
 *  edge one. */
export interface LivePlayerPoints {
  fantraxId: string;
  /** His total. Nought is a real nought; a man with no football behind him is
   *  absent from the list instead. */
  points: number;
  categories: LivePlayerCategory[];
}

/** One category's contribution, in Fantrax's own identifiers.
 *
 *  Unnamed on purpose: what these ids are called is a league setting, published
 *  by `getLeagueInfo`, and the two leagues answer different vocabularies. The
 *  adapter that reads the scoring system names them; this one only carries them.
 */
export interface LivePlayerCategory {
  /** `"{groupId}#{categoryId}"`. */
  category: string;
  /** Points, theirs. Signed: cards and goals against arrive negative. */
  points: number;
}

/** One squad's priced players for one period. Entries and not a Map: this
 *  crosses a cache boundary, and a Map does not survive serialisation. */
export interface LiveSquadPoints {
  teamId: string;
  players: LivePlayerPoints[];
}

/** What Fantrax expects one squad's players to score this period.
 *
 *  **Their guess, and it is never a score.** `TeamProjection` is the same guess
 *  totalled; this is the men it is made of, so a screen can say what Fantrax
 *  reckons one of them will do rather than only what it reckons of his side.
 *
 *  **Everyone here is in the eleven**, on the same rule the live prices follow:
 *  Fantrax projects the ACTIVE section and nothing else. So a caller printing one
 *  of these numbers has said the man is fielded, which is exactly the fact the
 *  lineup gate withholds before a deadline — and the gate is the caller's to
 *  keep, because only the caller knows who is asking. */
export interface SquadProjection {
  teamId: string;
  players: PlayerProjection[];
}

export interface PlayerProjection {
  fantraxId: string;
  /** Fantrax's number for him. Nought is a real projection of nought; a man they
   *  have not guessed about is absent from the list instead. */
  points: number;
}
