import type { Availability } from "../football/playerState";

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
/** One player on one side of a deal.
 *
 *  Carries his position because a swap cannot be read without it: a defender for
 *  a forward is a different piece of business from a defender for a defender,
 *  and two names alone do not say which. */
export interface DealSide {
  playerName: string;
  teamId: string | null;
  /** Fantrax's letters — "D", or "F,M" for a man eligible at two.
   *
   *  Optional rather than nullable, and the distinction is deliberate: the
   *  transaction feed is the only source that carries it, so a `Deal` built from
   *  anywhere else genuinely has no opinion — which is a different thing from a
   *  row that carried the field empty. Views print nothing in both cases. */
  position?: string | null;
  /** His real club, "ARS". Optional for the same reason as the position. */
  club?: string | null;
  /** The same club in full, "Arsenal", for a letter. Optional for the same reason. */
  clubName?: string | null;
}

export interface Deal {
  setId: string;
  kind: "claim" | "trade" | "lineup" | "unknown";
  /** Who gained, and what. Empty for a straight drop. */
  inbound: DealSide[];
  /** Who lost, and what. Empty for a claim off the wire that cost nobody. */
  outbound: DealSide[];
  /** Fantrax's own string, verbatim. It carries no offset, so it is shown as
   *  they wrote it rather than reinterpreted into a timezone we guessed. */
  processedAt: string | null;
  period: number | null;
  /** How a claim was made, off the claim itself; null for a trade or a bare drop. */
  via?: "waivers" | "free agency" | null;
}

/** A footballer somebody is going to have to think about.
 *
 *  **The football layer's own answer, plus whose problem he is.** It carried its
 *  own `news` and `chance` copied out of `Availability` and dropped the rest, so
 *  every reader of a note could say a man was a doubt and none of them could say
 *  he was SUSPENDED — `availability()` computed `state`, `label` and `out`, threw
 *  them away through `isDoubtful`'s boolean, and the inbox then guessed "out"
 *  back from a chance of nought. A ban carries no chance at all, so a banned man
 *  read as merely carrying a note. */
export interface AvailabilityNote extends Availability {
  playerName: string;
  /** His first name and surname — `first_name second_name`, not the shirt's
   *  `web_name`. A squad list wants the short one and a letter about him wants
   *  the whole thing: "Millar is out" is a row, "Anthony Millar is out" is what
   *  a person writing to you would call him (Craig, 17 Sep 2026: *"use players
   *  first name and surname in email fields"*). Both are carried because both
   *  are wanted, in different places. */
  fullName: string;
  /** When FPL attached the line, ISO — `news_added`, and it is the doubt's own
   *  date rather than one we invented.
   *
   *  **This file and `inbox/items.ts` both used to say FPL publishes no "as of"
   *  for a doubt**, and the inbox dated every injury to its round on the
   *  strength of it. It is not true and was never probed: `news_added` is
   *  non-null on **198 of the 198** elements carrying a `news` string, counted
   *  live on 17 Sep 2026. So a doubt is an event with a timestamp like any
   *  other item on the screen, and the blue block can print it.
   *
   *  Null anyway for a note FPL somehow carries without a stamp — the count says
   *  that does not happen today, and a field that is always present is still not
   *  a field to assume. */
  newsAt: string | null;
  /** Whose problem it is. Null when nobody in the league holds him. */
  teamId: string | null;
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
  /** His Fantrax id — the league layer's own, which is what draft picks, rosters
   *  and the transaction log are all keyed by. Carried so pedigree can be looked
   *  up beside a pick rather than folded into it: where a man was drafted has no
   *  bearing on whether he belongs in the week's eleven, and putting it on the
   *  selection would imply otherwise. */
  fantraxId: string;
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
  /** Fantrax's points for him this period, at the slot he filled; null when Fantrax has not priced him. */
  points: number | null;
  /** The football's own ranking, which breaks a tie on points. Never shown as points. */
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

/** One side of a head-to-head, as the paper names it. */
export interface StorySide {
  teamId: string;
  name: string;
  points: number;
}

/** A head-to-head the paper can report, winner named first.
 *
 *  Built only from two totals Fantrax has actually given for a period with no
 *  football left in it. A dash is not a nought and a match still being played is
 *  not a result, so neither ever becomes one of these. */
export interface StoryResult {
  winner: StorySide;
  loser: StorySide;
  /** Points between them, always above zero — a draw names no winner and is not
   *  one of these. Rounded to the hundredth: the totals are Fantrax's own
   *  decimals, and the difference of two of them in binary floating point is not
   *  always the number a person would write down. */
  margin: number;
}

/** One story the paper can run.
 *
 *  Facts and not sentences, on the same split the rest of this folder keeps:
 *  what is true is core's business and what the paper SAYS is the app's. The
 *  four kinds are an editor's running order, and `stories.ts` carries the
 *  argument for the order they are in — the first is the lead and the rest are
 *  the page's other headlines, which is why this is not called `Lead`.
 *
 *  It was, until the paper ran more than one of them. */
export type Story =
  | { kind: "squeaker"; result: StoryResult }
  /** `lost` is the owner's own defeat that week, when he had one. Null is
   *  ordinary: he may have won anyway, or drawn, or his match may not be one we
   *  can report. */
  | { kind: "bench"; pick: Pick; lost: StoryResult | null }
  | { kind: "rout"; result: StoryResult }
  /** `sides` are the managers who made it, in the order the deal names them, and
   *  there are always at least two — a trade that cannot name both sides is not
   *  offered as a lead at all. Carried rather than left to be re-derived from
   *  `deal.inbound`, because the guarantee and the derivation would then live in
   *  different packages and only one of them would know about the other. */
  | { kind: "trade"; deal: Deal; sides: string[] };
