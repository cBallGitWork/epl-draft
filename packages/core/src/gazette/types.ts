// The newspaper's sections, as facts. What they say in words is the app's
// business; what is true is this file's.
//
// Every builder is pure, and every one of them returns null rather than an empty
// shell when it has nothing to report. A section that cannot be filled is a
// section that does not run — an edition padded out with "no transactions this
// week" is a worse paper than a shorter one.

/** A deal somebody made, told as one story.
 *
 *  A claim and the drop that paid for it are one story, as are both halves of a
 *  trade — Fantrax files them as separate rows sharing a `setId`, and reading
 *  them apart is how you get a feed that says a manager signed a player and,
 *  separately and mysteriously, lost one. */
export interface Deal {
  setId: string;
  kind: "claim" | "trade" | "lineup" | "unknown";
  /** Who gained, and what. Empty for a straight drop. */
  inbound: { playerName: string; teamId: string | null }[];
  /** Who lost, and what. Empty for a claim off the wire that cost nobody. */
  outbound: { playerName: string; teamId: string | null }[];
  /** Fantrax's own string, verbatim. It carries no offset, so it is shown as
   *  they wrote it rather than reinterpreted into a timezone we guessed. */
  processedAt: string | null;
  period: number | null;
}

/** A footballer somebody is going to have to think about. */
export interface AvailabilityNote {
  playerName: string;
  /** Whose problem it is. Null when nobody in the league holds him. */
  teamId: string | null;
  /** FPL's own words, untruncated — Fantrax's equivalent arrives ellipsised. */
  news: string;
  /** 0–100, or null when FPL has no opinion. Null is not zero: "no comment" and
   *  "will not play" are different things to a manager picking a side. */
  chance: number | null;
}

/** When the lineup locks next. The commissioner's deadline, never FPL's. */
export interface Deadline {
  period: number;
  /** The period's first kickoff, ISO — the instant the lock is measured back
   *  from, and a fact about the football rather than about the league.
   *
   *  Deliberately NOT the period boundary, which is what this used to say. The
   *  two coincide only when the gameweek has a Friday night match; see
   *  `deadline.ts` for the periods where they are a day apart. */
  at: string;
  /** When lineups actually lock: `at` less `LINEUP_LOCK_LEAD_MINUTES`.
   *
   *  Derived by us, not read from anywhere, because the commissioner's lead is a
   *  house rule Fantrax publishes on its settings page and through no API. Kept
   *  beside `at` rather than replacing it so a view can show both and say which
   *  is which. */
  locksAt: string;
}

/** One player in the week's eleven, with the fact that got him there and the
 *  manager who owns him — which is most of the point. */
export interface Pick {
  playerName: string;
  /** FPL's season-stable code, for the portrait. */
  playerCode: number;
  /** His club, for the cut-out's kit and crest fallbacks. FPL's own per-season
   *  id, which is what a snapshot's clubs are keyed by — never persisted. */
  clubId: number;
  position: string;
  ownerTeamId: string;
  ownerName: string;
  /** Whether his own manager actually started him. A reserve in the team of the
   *  week is the best story on the page. */
  started: boolean;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  saves: number;
  /** How the selection was argued, kept so a reader can see the ranking is not
   *  arbitrary. Not fantasy points and never shown as them. */
  score: number;
}

export interface TeamOfTheWeek {
  /** Every pick, strongest first. The order the side was argued into being, and
   *  the order anything asking "who was the best of them" has to read. */
  picks: Pick[];
  /** The same eleven in its lines, keeper first. The same men in a second order
   *  rather than a second set: one is how they rank and the other is where they
   *  stand, and a pitch cannot be drawn from the first. `shape` is counted from
   *  this, so the formation printed and the formation drawn cannot disagree. */
  lines: TeamLine[];
  /** e.g. "1-4-4-2", counted from the lines. */
  shape: string;
}

export interface TeamLine {
  /** Fantrax's position letter for the whole line. */
  position: string;
  picks: Pick[];
}

/** One side of a head-to-head, as the front page names it. */
export interface LeadSide {
  teamId: string;
  name: string;
  points: number;
}

/** A head-to-head the paper can report, winner named first.
 *
 *  Built only from two totals Fantrax has actually given for a period with no
 *  football left in it. A dash is not a nought and a match still being played is
 *  not a result, so neither ever becomes one of these. */
export interface LeadResult {
  winner: LeadSide;
  loser: LeadSide;
  /** Points between them, always above zero — a draw names no winner and is not
   *  one of these. Rounded to the hundredth: the totals are Fantrax's own
   *  decimals, and the difference of two of them in binary floating point is not
   *  always the number a person would write down. */
  margin: number;
}

/** The story the edition leads on.
 *
 *  Facts and not sentences, on the same split the rest of this folder keeps:
 *  what is true is core's business and what the paper SAYS is the app's. The
 *  four kinds are an editor's running order, and `lead.ts` carries the argument
 *  for the order they are in. */
export type Lead =
  | { kind: "squeaker"; result: LeadResult }
  /** `lost` is the owner's own defeat that week, when he had one. Null is
   *  ordinary: he may have won anyway, or drawn, or his match may not be one we
   *  can report. */
  | { kind: "bench"; pick: Pick; lost: LeadResult | null }
  | { kind: "rout"; result: LeadResult }
  /** `sides` are the managers who made it, in the order the deal names them, and
   *  there are always at least two — a trade that cannot name both sides is not
   *  offered as a lead at all. Carried rather than left to be re-derived from
   *  `deal.inbound`, because the guarantee and the derivation would then live in
   *  different packages and only one of them would know about the other. */
  | { kind: "trade"; deal: Deal; sides: string[] };
