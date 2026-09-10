// What the sister repo hands over, and nothing about how it is drawn.
//
// **Untrusted, like any provider payload.** It arrives as a committed JSON file
// rather than over a wire, which changes nothing: it is written by a different
// repo on a different schedule, and `map.ts` parses it rather than asserting it.
//
// Everything here is keyed on FPL's **season-stable `code`**. The exporter emits
// codes and never per-season element ids, because these files are persisted and
// CODE_RULES §3 forbids persisting an id that is recycled each August.

/** Where a file came from and when, in one shape across all of them.
 *
 *  `exportedAt` is when the export ran; each source's own `mtime` rides along,
 *  because "the export is fresh" and "what it was built from is fresh" are
 *  different claims and only the second one catches a stalled pipeline. */
export interface IntelManifest {
  season: string;
  /** The round an XI predicts. Null on a file that is not per-round. */
  gameweek: number | null;
  exportedAt: string;
  rows: number;
  sources: { path: string; mtime: string | null }[];
  /** How many squad numbers were cleared as collisions — see `squadNumber`. */
  numberCollisions?: number;
}

/** One man on a club's books, as the sister repo files him. */
export interface IntelPlayer {
  /** FPL's season-stable player code. */
  code: number;
  /** FPL's three-letter club label, e.g. "ARS". */
  clubCode: string;
  /** His real-life position — `CB`, `LB`, `DM`, `RW`.
   *
   *  **Null is a real answer and a common one.** The exporter sends null for
   *  every man whose position came from FPL's `element_type`, because that is
   *  FPL's fantasy classification and not a fact about the footballer — the same
   *  rule that keeps position out of the football layer entirely
   *  (`football/types.ts`). 146 of 651 were null on the first export. */
  position: string | null;
  /** Which provider settled the position, carried even when it is null so a
   *  screen can say WHY there is none rather than only that there is none. */
  positionSource: string | null;
  secondaryPositions: string[];
  canCover: string[];
  /** The sister's depth chart within his club and position: 1 first choice, 2
   *  second, 3 third, 4 fringe, and **0 unavailable** — a loan out of the league
   *  or a contract expired, not a knock. */
  depthTier: number | null;
  /** His shirt number, or null — **and a number here is not proof it is his
   *  alone.**
   *
   *  This used to say the exporter cleared a number that collided inside a club,
   *  giving it to whoever had the better claim, and that it cleared 111 on the
   *  first export. Whatever that pass did, it does not hold against the export in
   *  the tree: counted 10 Sep 2026, **20 of 20 clubs carry a duplicate somewhere
   *  in the squad** and **13 of 20 predicted elevens carry one among the eleven
   *  starters** — Villa two number 2s and two number 4s, Liverpool two 10s, City
   *  two 18s.
   *
   *  It goes unnoticed because every reader of it is a TABLE, where the name in
   *  the same row carries the identification and a repeat costs nothing. It
   *  stopped being harmless for one afternoon, when a pitch drew eleven identical
   *  kits and asked the number to tell them apart; `squadNumbers` was written to
   *  drop a collided number from both men, and went again when the number came
   *  off the shirt. Write it back — the rule is a wrong one is worse than none —
   *  before putting this field anywhere it has to identify somebody on its own. */
  squadNumber: number | null;
  status: string;
  expectedReturnGw: number | null;
  /** His position bucketed into a pitch line — `GK`, `CB`, `FB`, `DM`, `CM`,
   *  `AM`, `WF`, `CF`. The sister repo's own bucketing, not ours: it owns the
   *  football taxonomy and a second copy here is a second thing to be wrong.
   *  Null exactly where `position` is. */
  line: string | null;
}

export interface IntelSquads {
  manifest: IntelManifest;
  players: IntelPlayer[];
}

/** One man in a predicted eleven. */
export interface IntelStarter {
  code: number;
  /** How sure the source is, 0–1. Carried so a board can show the doubt rather
   *  than printing a prediction as a team sheet. */
  prob: number;
}

/** One club's predicted eleven and the shape it is predicted to play. */
export interface IntelClubXi {
  /** `4-2-3-1`, `3-4-3`, `3-4-2-1`, `4-3-3`. */
  formation: string;
  /** How many men the formation puts in each line, keyed as `line` is. Summing
   *  to eleven is the sister's own assertion; `map.ts` checks it again, because
   *  we take this over a wire. */
  slots: Record<string, number> | null;
  starters: IntelStarter[];
}

export interface IntelXi {
  manifest: IntelManifest;
  /** When the SOURCE fetched its prediction — not when we exported it. A
   *  prediction is stale when the source is stale, whatever we did afterwards. */
  fetchedAt: string | null;
  source: string | null;
  /** By FPL club code as a string, because a JSON object's keys are strings. */
  clubs: Record<string, IntelClubXi>;
}

/** One man's share of a club's set pieces — 0.53 of its penalties, not "first
 *  choice". A share is what the source measures; it orders the same way and says
 *  more. */
export interface IntelTaker {
  code: number;
  share: number;
}

/** Who takes a CLUB's set pieces.
 *
 *  **Club-scoped, and that is the whole point.** The first version of this read
 *  a rank off each player, which is a fact about a PLAYER and travels with him:
 *  Manchester City's penalty order came out led by a man who earned his rank at
 *  Everton. This is FFScout's own per-club page, so a signing arrives with no
 *  set-piece history at all — which is the truth about him at his new club.
 *
 *  A piece nobody takes is absent rather than empty. */
export interface IntelClubPieces {
  penalties?: IntelTaker[];
  freeKicks?: IntelTaker[];
  corners?: IntelTaker[];
}

export interface IntelSetPieces {
  manifest: IntelManifest;
  source: string | null;
  /** By FPL club code as a string, because a JSON object's keys are strings. */
  clubs: Record<string, IntelClubPieces>;
}

/** One player's line in a match the sister repo has logged.
 *
 *  **Everything FPL's fixture list cannot say.** That read gives the scoresheet —
 *  scorers, assisters, cards, bonus, bps — for all 380 matches and carries no
 *  minute, no line-up and no position. This carries those and repeats none of it.
 *
 *  Keyed on FPL's season-stable `code`, like every other file here. */
export interface IntelMatchPlayer {
  code: number;
  side: "home" | "away";
  started: boolean;
  /** His real position in THIS match — `DC`, `AMC`, `FWL`. Null for a man who
   *  did not start: `SUB` and `BENCH` are not positions, and the football layer
   *  refuses a classification that is not one. */
  position: string | null;
  minutes: number | null;
  /** The minute he came on, and the minute he went off. Null is a real answer
   *  for a man who played the whole match and for one who never came on — the
   *  two are told apart by `minutes`, not by these. */
  onAt: number | null;
  offAt: number | null;
  /** SofaScore's out of ten. Theirs and labelled as theirs. */
  rating: number | null;
}

/** A goal or a card, with the minute — the one thing FPL publishes nowhere.
 *
 *  **An own goal arrives as a plain `goal` and the consumer must reconcile.**
 *  Counted across all 20 logged matches on 4 Sep 2026: 17 name only men FPL also
 *  calls scorers, and the three that do not are exactly the three in FPL's
 *  `own_goals` lists. A screen trusting this alone would credit an own goal to
 *  the wrong side. FPL's fixture block is the discriminator. */
export interface IntelMatchEvent {
  kind: "goal" | "card";
  code: number;
  minute: number;
}

/** One side's shape and its match figures. Every figure is null where the
 *  source took no measurement — never nought, which would be a reading. */
export interface IntelMatchSide {
  formation: string | null;
  stats: Record<string, number | null>;
}

export interface IntelMatch {
  /** FPL's per-season fixture id. **The one place this export keys on an id
   *  rather than a code**, and it is safe for the reason the match ROUTE gives
   *  about its own URL: a fixture belongs to one season and nowhere else, so
   *  there is nothing for a stable key to outlive. */
  fplFixtureId: number;
  matchId: string;
  halfTime: { home: number | null; away: number | null };
  /** 2 of 20 on 4 Sep 2026. Null is the common answer and prints a dash. */
  referee: string | null;
  home: IntelMatchSide;
  away: IntelMatchSide;
  players: IntelMatchPlayer[];
  events: IntelMatchEvent[];
}

export interface IntelMatches {
  manifest: IntelManifest;
  fixtures: IntelMatch[];
}
