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

/** One player in the week's eleven, with the fact that got him there and the
 *  manager who owns him — which is most of the point. */
export interface Pick {
  playerName: string;
  /** FPL's season-stable code, for the portrait. */
  playerCode: number;
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
  picks: Pick[];
  /** e.g. "1-4-4-2", counted from the selection. */
  shape: string;
}
