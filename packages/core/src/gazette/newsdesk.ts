import { binXiDue } from "./binXi/due";
import { PREDICTED_XI, TEAM_SHEET } from "../config";
import { dueBeforeLock, dueFrom, predictionsDue } from "./predictions/due";
import { weekdayOfDay } from "../time";
import type { StoryKind } from "./story";

// What is due this firing: whatever is new since its covered-key was spent, so a re-fired cron files nothing.
// The paper files seven weekly kinds: match and draft reports, Bin XI, the Team Sheet, the elevens, the draft sheets at
// the deadline, and Lawro.

export interface Assignment {
  kind: StoryKind;
  /** The covered-key this assignment spends when it files. */
  key: string;
  /** The story's slug — addressable, ours, never the model's. */
  slug: string;
  /** The London day a match-day report, a draft report or a Team Sheet is about. */
  day?: string;
  /** A draft report's cut-off: after Saturday's matches, or the end of the gameweek. */
  cutoff?: "saturday" | "gameweek";
  /** The round a look-ahead story is about, which between rounds is not FPL's current one. */
  round?: { period: number; gameweek: number };
}

export interface DeskState {
  gameweek: number;
  period: number;
  /** The last whistle has gone. */
  finished: boolean;
  /** The round's lineup deadline has passed, so every sheet in it is fixed and may be printed. */
  locked: boolean;
  /** The period's pairings; none is a period the league has no fixtures in, which has no round to write up. */
  ties: readonly { homeTeamId: string; awayTeamId: string }[];
  /** The London days of the round ahead's press conferences; empty until the export lands. */
  pressers: readonly string[];
  /** The predicted elevens, when the export holds the round ahead; keyed by the caller. */
  lineups: { key: string; slug: string } | null;
  /** The round the Team Sheet and the elevens preview, when the calendar places it. */
  ahead: { period: number; gameweek: number } | null;
  /** The next round to lock, and when, which is when Lawro's column is due. */
  next: { period: number; gameweek: number; locksAt: string } | null;
  /** The season's first head-to-head period and its lock, once the draft is complete; Lawro's season column is due until then. */
  season: { period: number; gameweek: number; locksAt: string } | null;
  /** The London days whose every match has settled, each a match-day report (`reports/due.ts`). */
  reportDays: readonly { key: string; slug: string; day: string }[];
  /** The draft reports due: after Saturday, and at the end of the gameweek (`matchups/due.ts`). */
  draftReports: readonly { key: string; slug: string; cutoff: "saturday" | "gameweek"; day: string }[];
}

/** A once-a-round story's covered-key and slug: filed once per gameweek, and its URL says which. */
export function roundSlot(kind: string, gameweek: number): { key: string; slug: string } {
  return { key: `${kind}:gw${gameweek}`, slug: `gw${gameweek}-${kind}` };
}

export function newsdesk(
  desk: DeskState,
  covered: (key: string) => boolean,
  now: string,
): Assignment[] {
  const out: Assignment[] = [];
  const want = (assignment: Assignment) => {
    if (!covered(assignment.key)) out.push(assignment);
  };

  // The round's write-ups need fixtures: the real league's period 5, before its first, has none.
  const fixtured = desk.ties.length > 0;

  if (fixtured) {
    // A match-day report as each day's football settles, then one draft report once the gameweek ends.
    for (const day of desk.reportDays) want({ kind: "match-report", ...day });
    for (const due of desk.draftReports) {
      if (due.cutoff === "gameweek") want({ kind: "draft-report", key: due.key, slug: due.slug, cutoff: due.cutoff, day: due.day });
    }
  }

  if (desk.finished && fixtured) {
    // Tuesday's Bin XI, the round's best eleven nobody has, filed before Wednesday's waivers.
    if (binXiDue(now)) want({ kind: "bin-xi", ...roundSlot("bin-xi", desk.gameweek) });
  }

  // The sheets from the deadline until the last whistle: a 12:15 lock and a 12:30 kickoff fall inside one cron's delay.
  if (desk.locked && !desk.finished && fixtured) {
    want({ kind: "sheets", ...roundSlot("sheets", desk.gameweek) });
  }

  // The Team Sheet, outside the finished and lock gates: one column per press-conference day, Thursday's and Friday's.
  const about = desk.ahead === null ? {} : { round: desk.ahead };
  const next = desk.next;
  if (next !== null) {
    const slot = roundSlot("presser", next.gameweek);
    for (const day of desk.pressers) {
      const from = weekdayOfDay(day) === TEAM_SHEET.thursday.weekday ? TEAM_SHEET.thursday : TEAM_SHEET.from;
      if (dueFrom(day, from, next.locksAt, now)) {
        want({ kind: "presser", key: `${slot.key}:${day}`, slug: `${slot.slug}-${day}`, day, ...about });
      }
    }
  }

  // The elevens predict the round ahead, so they sit outside the gates above, and wait for Friday's pressers.
  if (desk.lineups !== null && desk.next !== null && dueBeforeLock(desk.next.locksAt, now, PREDICTED_XI.filing)) {
    want({ kind: "predicted-xi", key: desk.lineups.key, slug: desk.lineups.slug, ...about });
  }

  // Lawro's predictions: the evening before the gameweek, and only once the last one is done.
  if (desk.next !== null && desk.finished && predictionsDue(desk.next.locksAt, now)) {
    const { period, gameweek } = desk.next;
    want({ kind: "predictions", ...roundSlot("predictions", gameweek), round: { period, gameweek } });
  }

  // Lawro's season predictions: once, from the end of the draft until the season's first lock.
  if (desk.season !== null && Date.parse(now) < Date.parse(desk.season.locksAt)) {
    const { period, gameweek } = desk.season;
    want({ kind: "season-rankings", ...roundSlot("season-rankings", gameweek), round: { period, gameweek } });
  }

  return out;
}
