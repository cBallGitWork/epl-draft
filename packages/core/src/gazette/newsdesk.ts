import { binXiDue } from "./binXi/due";
import { predictionsDue } from "./predictions/due";
import type { StoryKind } from "./story";
import type { TieState } from "./tieState";

// What is due this firing: whatever is new since its covered-key was spent, so a re-fired cron files nothing.
// The paper files seven weekly kinds (Craig, 1 Oct 2026): match and draft reports, Bin XI, the Team Sheet, the elevens,
// the draft sheets at the deadline, and Lawro.

export interface Assignment {
  kind: StoryKind;
  /** The covered-key this assignment spends when it files. */
  key: string;
  /** The story's slug — addressable, ours, never the model's. */
  slug: string;
  /** Join handle back to the round's fixtures, this session only. */
  fixtureId?: number;
  tie?: { homeTeamId: string; awayTeamId: string };
  /** The press-conference day, London, for the Team Sheet: Thursday's and Friday's are two editions of one kind. */
  day?: string;
  /** A draft report's cut-off: after Saturday's matches, or the end of the gameweek. */
  cutoff?: "saturday" | "gameweek";
  /** The round a look-ahead story is about, which between rounds is not FPL's current one. */
  round?: { period: number; gameweek: number };
}

export interface DeskTie {
  homeTeamId: string;
  awayTeamId: string;
  state: TieState;
}

export interface DeskState {
  gameweek: number;
  period: number;
  /** The last whistle has gone. */
  finished: boolean;
  /** The round's lineup deadline has passed, so every sheet in it is fixed and may be printed. */
  locked: boolean;
  /** The period's pairings; none is a period the league has no fixtures in, which has no round to write up. */
  ties: readonly DeskTie[];
  /** A round-up per press-conference day, keyed by the caller; empty until the export lands. */
  pressers: readonly { key: string; slug: string; day: string }[];
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
    // A match-day report as each day's football settles, then one draft report once the gameweek ends (Craig, 1 Oct 2026).
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

  // The Team Sheet, outside the finished and lock gates: the caller offers only days said after the last lock.
  const about = desk.ahead === null ? {} : { round: desk.ahead };
  for (const day of desk.pressers) {
    want({ kind: "presser", key: day.key, slug: day.slug, day: day.day, ...about });
  }

  // The elevens predict the round ahead, so they sit outside the gates above for the Team Sheet's reason.
  if (desk.lineups !== null) {
    want({ kind: "predicted-xi", key: desk.lineups.key, slug: desk.lineups.slug, ...about });
  }

  // Lawro's predictions: the evening before the round, and only once the last round is done.
  if (desk.next !== null && desk.finished && predictionsDue(desk.next.locksAt, now)) {
    const { period, gameweek } = desk.next;
    want({ kind: "predictions", ...roundSlot("predictions", gameweek), round: { period, gameweek } });
  }

  // Lawro's season predictions: once, from the end of the draft until the season's first lock (Craig, 5 Oct 2026).
  if (desk.season !== null && Date.parse(now) < Date.parse(desk.season.locksAt)) {
    const { period, gameweek } = desk.season;
    want({ kind: "season-rankings", ...roundSlot("season-rankings", gameweek), round: { period, gameweek } });
  }

  return out;
}
