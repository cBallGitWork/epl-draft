import type { PlMoment } from "../../football/premierleague/moments";
import type { Club, Fixture } from "../../football/types";

// What the match-day desk is handed: plain data, joined by the script, read by the pure builders beside this file.

export type Side = "home" | "away";

export interface ReportClub {
  code: number;
  /** The name the paper prints, e.g. "Tottenham Hotspur". */
  name: string;
  /** The one short form the writer may also use, e.g. "Spurs"; null when there is none. */
  short: string | null;
  /** Named only when the club's staff list has exactly one manager. */
  manager: string | null;
}

/** One man in the match, with his club always. */
export interface ReportMan {
  code: number;
  name: string;
  side: Side;
  started: boolean;
  /** The clock labels he came on and went off, as printed. */
  onAt: string | null;
  offAt: string | null;
  injuredOff: boolean;
  /** The line he was named in: G, D, M or F. */
  line: string | null;
  minutes: number;
  saves: number;
  /** Used to choose who earns a line; never printed. */
  expectedGoals: number;
  expectedAssists: number;
  /** Before this match, this season. */
  startsBefore: number;
  matchesBefore: number;
  yellowsBefore: number;
  /** This season including this match. */
  goalsSeason: number;
  /** The league side that holds him, and whether he was in its eleven. */
  holder: { team: string; fielded: boolean } | null;
  /** His league points for this match; null when the period holds two of his matches or none were priced. */
  points: number | null;
  /** The club's own word on his fitness, published after the match. */
  fitness: string | null;
}

export interface SideFigures {
  shots: number;
  onTarget: number;
  corners: number;
  clearChances: number;
  clearChancesScored: number;
  possession: number;
}

export interface ReportMatchInput {
  fixture: Fixture;
  home: ReportClub;
  away: ReportClub;
  halfTime: { home: number; away: number } | null;
  referee: string | null;
  moments: readonly PlMoment[];
  men: readonly ReportMan[];
  figures: { home: SideFigures; away: SideFigures } | null;
  videoId: string | null;
}

export interface ReportDayInput {
  /** London calendar day, `2026-09-19`. */
  day: string;
  gameweek: number;
  matches: readonly ReportMatchInput[];
  /** Every fixture of the season, for the table and what comes next. */
  season: readonly Fixture[];
  clubs: readonly Club[];
  /** Each club's place by the strength ratings, strongest first, by FPL club code. */
  standing: { attack: ReadonlyMap<number, number>; defence: ReadonlyMap<number, number> };
}
