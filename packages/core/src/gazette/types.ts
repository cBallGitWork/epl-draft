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
  /** ISO instant, as the league states it. */
  at: string;
}
