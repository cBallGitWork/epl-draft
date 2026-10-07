import { plMatchMetrics } from "./map";
import type { RawPlMatchStats } from "./rawStats";

// Championship Manager's Match Stats board against Opta's own metric names, all off one `/stats/match` call.
// Opta omits a metric worth nought, so `plMatchMetrics` reads a missing one as 0.

/** One row of the board: a label and the two sides' figures. */
export interface MatchStatRow {
  /** Stable and ours, so a caller singles out a row (the two card rows) without matching its label. */
  key: string;
  label: string;
  home: number;
  away: number;
  /** A percentage rather than a count: a reading we derived. */
  percent: boolean;
}

/** A metric name, or a numerator over a SUMMED denominator, since aerials come as won and lost with no total. */
type Source = string | { of: string; over: string[] };

const ROWS: { key: string; label: string; source: Source; percent?: true }[] = [
  // Opta's own share to one decimal, so a percentage without being a ratio of ours.
  { key: "possession", label: "Possession", source: "possession_percentage", percent: true },
  { key: "shots", label: "Shots On Goal", source: "total_scoring_att" },
  { key: "onTarget", label: "On Target", source: "ontarget_scoring_att" },
  { key: "offTarget", label: "Off Target", source: "shot_off_target" },
  // The third kind of shot, so the three rows under Shots add up to it.
  { key: "blocked", label: "Blocked", source: "blocked_scoring_att" },
  { key: "corners", label: "Corners", source: "won_corners" },
  // Free kicks AWARDED to this side, which is the count CM shows beside fouls.
  { key: "freeKicks", label: "Free Kicks", source: "fk_foul_won" },
  { key: "throwIns", label: "Throw-Ins", source: "total_throws" },
  // And fouls CONCEDED. The two are one Opta pair read from opposite ends.
  { key: "fouls", label: "Fouls", source: "fk_foul_lost" },
  { key: "offsides", label: "Offsides", source: "total_offside" },
  {
    key: "passes",
    label: "Passes Completed",
    source: { of: "accurate_pass", over: ["total_pass"] },
  },
  { key: "tackles", label: "Tackles Won", source: { of: "won_tackle", over: ["total_tackle"] } },
  // There is no `total_aerial`: the denominator is won plus lost.
  { key: "headers", label: "Headers Won", source: { of: "aerial_won", over: ["aerial_won", "aerial_lost"] } },
  { key: "interceptions", label: "Interceptions", source: "interception" },
  { key: "clearances", label: "Clearances", source: "total_clearance" },
  { key: "saves", label: "Saves", source: "saves" },
  { key: "yellowCards", label: "Yellow Cards", source: "total_yel_card" },
  { key: "redCards", label: "Red Cards", source: "total_red_card" },
];

/** A whole percentage, nought when the side did none of the thing: a real proportion, never a withheld figure. */
function share(of: number, over: number): number {
  return over === 0 ? 0 : Math.round((of / over) * 100);
}

function figure(metric: (name: string) => number, source: Source): number {
  if (typeof source === "string") return Math.round(metric(source));
  const over = source.over.reduce((sum, name) => sum + metric(name), 0);
  return share(metric(source.of), over);
}

/** The board for one match, home first, keyed on the Premier League's team ids; null unless both sides have stats. */
export function plMatchBoard(
  stats: RawPlMatchStats,
  homeTeamId: number,
  awayTeamId: number,
): MatchStatRow[] | null {
  const home = plMatchMetrics(stats, homeTeamId);
  const away = plMatchMetrics(stats, awayTeamId);
  if (home === null || away === null) return null;

  return ROWS.map(({ key, label, source, percent }) => ({
    key,
    label,
    home: figure(home, source),
    away: figure(away, source),
    percent: percent ?? typeof source !== "string",
  }));
}
