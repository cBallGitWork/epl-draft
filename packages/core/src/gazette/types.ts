import type { Availability } from "../football/playerState";

// The paper's sections as facts; the words are the app's. A builder with nothing to report returns null, never a shell.

/** One player on one side of a deal, with his position: a swap cannot be read without it. */
export interface DealSide {
  playerName: string;
  teamId: string | null;
  /** Fantrax's letters, "D" or "F,M"; absent on a deal built from anything but the transaction feed. */
  position?: string | null;
  /** His real club, "ARS"; optional like the position. */
  club?: string | null;
  /** The same club in full, "Arsenal", for a letter; optional like the position. */
  clubName?: string | null;
}

/** A deal told as one story: a claim and its drop, or both halves of a trade, share one `setId`. */
export interface Deal {
  setId: string;
  kind: "claim" | "trade" | "lineup" | "unknown";
  /** Who gained, and what. Empty for a straight drop. */
  inbound: DealSide[];
  /** Who lost, and what. Empty for a claim off the wire that cost nobody. */
  outbound: DealSide[];
  /** Fantrax's own string, verbatim; `fantraxTime` prints it in London. */
  processedAt: string | null;
  period: number | null;
  /** How a claim was made, off the claim itself; null for a trade or a bare drop. */
  via?: "waivers" | "free agency" | null;
}

/** A footballer somebody must think about: the football layer's whole availability, plus whose problem he is. */
export interface AvailabilityNote extends Availability {
  playerName: string;
  /** First name and surname, for a letter; `playerName` is the short one, for a row. */
  fullName: string;
  /** FPL's `news_added`, ISO: the doubt's own date. Null when a note carries no stamp. */
  newsAt: string | null;
  /** Whose problem it is. Null when nobody in the league holds him. */
  teamId: string | null;
}

/** When the lineup locks next. The commissioner's deadline, never FPL's. */
export interface Deadline {
  period: number;
  /** The period's first kickoff, ISO, which the lock is measured back from; not the period boundary. */
  at: string;
  /** When lineups lock: `at` less `LINEUP_LOCK_LEAD_MINUTES`, a house rule no API publishes. */
  locksAt: string;
}

/** One player in the week's eleven, with the fact that got him there and the manager who owns him. */
export interface Pick {
  /** His Fantrax id, the key of draft picks, rosters and the transaction log. */
  fantraxId: string;
  playerName: string;
  /** FPL's season-stable code, for the portrait. */
  playerCode: number;
  /** His club, for the kit and crest fallbacks: FPL's per-season id, never persisted. */
  clubId: number;
  position: string;
  ownerTeamId: string;
  ownerName: string;
  /** Whether his own manager started him; a reserve in the team of the week is the page's best story. */
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
  /** Every pick, strongest first. */
  picks: Pick[];
  /** The same eleven in its lines, keeper first; `shape` is counted from these, so printed and drawn agree. */
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

/** A head-to-head result, winner first, built only from two Fantrax totals for a period with no football left. */
export interface StoryResult {
  winner: StorySide;
  loser: StorySide;
  /** Points between them, always above zero (a draw is not one of these), rounded to the hundredth. */
  margin: number;
}

/** One story the paper can run, as facts; `stories.ts` orders the kinds, and the first is the lead. */
export type Story =
  | { kind: "squeaker"; result: StoryResult }
  /** The owner's own defeat that week; null when he won, drew, or his match cannot be reported. */
  | { kind: "bench"; pick: Pick; lost: StoryResult | null }
  | { kind: "rout"; result: StoryResult }
  /** The managers in the deal, in its order; always two or more, or the trade is not offered as a lead. */
  | { kind: "trade"; deal: Deal; sides: string[] };
