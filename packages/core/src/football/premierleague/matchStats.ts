import { plMatchMetrics } from "./map";
import type { RawPlMatchStats } from "./rawStats";

// Championship Manager's Match Stats board, against Opta's own metric names.
//
// **The board is `cm9900/22.jpg` and the rows are its rows** — Shots On Goal,
// On Target, Off Target, Corners, Free Kicks, Throw-Ins, Fouls, Offsides, Passes
// Completed, Tackles Won, Headers Won, Yellow Cards, Red Cards. Thirteen, in that
// order, and all thirteen are answerable from one `/stats/match` call: counted
// 10 Sep 2026 against the recorded fixture and a live round.
// `docs/ui/reference/README.md` binds the citation — a CM claim names a numbered
// shot and never a memory.
//
// **Opta's names are not English and the table is the only honest place to say
// so.** `fk_foul_lost` is fouls COMMITTED and `fk_foul_won` is fouls WON, which
// is the pair most likely to be wired up backwards; `total_throws` includes the
// keeper's, which CM's "Throw-Ins" did not.
//
// **A metric worth nought is absent from the payload**, which inverts DESIGN §7's
// "absence is —, never 0". `plMatchMetrics` already implements that defaulting
// and this file inherits it: red cards appear on 1 of 40 team-sides because there
// was exactly one red card.

/** One row of the board: a label and the two sides' figures. */
export interface MatchStatRow {
  /** Stable and ours, so a caller can single a row out without matching prose.
   *  The two card rows are the reason it exists — CM prints their LABELS in
   *  yellow and red, and a component testing `label === "Yellow Cards"` would
   *  break on a word. */
  key: string;
  label: string;
  home: number;
  away: number;
  /** A percentage rather than a count. **This is a reading we derived**, which
   *  is DESIGN §3's cyan slot exactly — and CM's own board agrees: its three
   *  percentage rows are the three it prints in cyan. */
  percent: boolean;
}

/** A metric name, or a numerator over a denominator that may take more than one
 *  metric to build. `over` is SUMMED, which is what lets aerials — published as
 *  won and lost with no total — use the same shape as passes. */
type Source = string | { of: string; over: string[] };

const ROWS: { key: string; label: string; source: Source }[] = [
  { key: "shots", label: "Shots On Goal", source: "total_scoring_att" },
  { key: "onTarget", label: "On Target", source: "ontarget_scoring_att" },
  { key: "offTarget", label: "Off Target", source: "shot_off_target" },
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
  // Opta publishes aerials won and lost rather than a total, so the denominator
  // is their sum. There is no `total_aerial`.
  { key: "headers", label: "Headers Won", source: { of: "aerial_won", over: ["aerial_won", "aerial_lost"] } },
  { key: "yellowCards", label: "Yellow Cards", source: "total_yel_card" },
  { key: "redCards", label: "Red Cards", source: "total_red_card" },
];

/** A whole percentage, or nought when the side did none of the thing.
 *
 *  **Nought and not a dash**, which is the one place this file departs from the
 *  app's grammar and does it deliberately: a side with no tackles attempted won
 *  none, and the row is about a proportion of a real denominator rather than a
 *  figure the provider withheld. A dash here would read as "we do not know". */
function share(of: number, over: number): number {
  return over === 0 ? 0 : Math.round((of / over) * 100);
}

function figure(metric: (name: string) => number, source: Source): number {
  if (typeof source === "string") return metric(source);
  const over = source.over.reduce((sum, name) => sum + metric(name), 0);
  return share(metric(source.of), over);
}

/** The board for one match, home side first.
 *
 *  Null when the payload carries no stats for either side — which IS an absence
 *  and may not be drawn as thirteen noughts. `plMatchMetrics` answers null for a
 *  side they have nothing on, and one side missing is as unusable as both: a
 *  board is a comparison.
 *
 *  The team ids are the Premier League's own, which is what `/stats/match` keys
 *  its `data` on — `RawPlTeamScore.team.id`, and the same ids `PlTeamSheet`
 *  carries. Pure: no clock, no network (CODE_RULES §5). */
export function plMatchBoard(
  stats: RawPlMatchStats,
  homeTeamId: number,
  awayTeamId: number,
): MatchStatRow[] | null {
  const home = plMatchMetrics(stats, homeTeamId);
  const away = plMatchMetrics(stats, awayTeamId);
  if (home === null || away === null) return null;

  return ROWS.map(({ key, label, source }) => ({
    key,
    label,
    home: figure(home, source),
    away: figure(away, source),
    percent: typeof source !== "string",
  }));
}
