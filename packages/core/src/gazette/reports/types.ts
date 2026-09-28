import type { PlMoment } from "../../football/premierleague/moments";
import type { StoryLineup } from "./lineups";
import type { Club, Fixture } from "../../football/types";

// What the match-day desk is handed: plain data, joined by the script, read by the pure builders beside this file.

export type Side = "home" | "away";

export interface ReportClub {
  code: number;
  /** The name the paper prints, e.g. "Tottenham Hotspur". */
  name: string;
  /** The short forms the writer may also use, e.g. "Tottenham", "Spurs"; the first tags the key stats. Empty when the name is short. */
  shorts: string[];
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
  /** The league side that holds him, whether he was in its eleven, and where its head-to-head stands this period. */
  holder: { team: string; fielded: boolean; round: number | null; h2h: { opponent: string; us: number | null; them: number | null } | null } | null;
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
  /** Read from the match record, never recalled. */
  venue: string | null;
  attendance: number | null;
  lineups: { home: StoryLineup; away: StoryLineup } | null;
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
