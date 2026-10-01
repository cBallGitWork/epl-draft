import { binXiDue } from "./binXi/due";
import { predictionsDue } from "./predictions/due";
import { type FixtureStake, bothSides } from "./relevance";
import type { StoryKind } from "./story";
import type { TieState } from "./tieState";

// What is newsworthy this firing: whatever is new since its covered-key was spent, so a re-fired cron files nothing.
// The running order is the editor's: the round's own reporting, then the perishable calls, then the look-ahead.
// A finished round files a report per tie, never one about the whole league (Craig, 3 Sep 2026).

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
  /** A first ball has been kicked. */
  started: boolean;
  /** The round's lineup deadline has passed, so every sheet in it is fixed and may be printed. */
  locked: boolean;
  /** Every fixture of the round, most-consequential first (`fixtureStakes`). */
  stakes: readonly FixtureStake[];
  /** The period's pairings; none is a period the league has no fixtures in, which has no round to write up. */
  ties: readonly DeskTie[];
  /** Deals in the wire's trailing window; nought is a quiet week and files no column. */
  dealsInWindow: number;
  /** Wire items that name a man somebody in the league holds, freshest first. */
  news: readonly { key: string; slug: string }[];
  /** A round-up per press-conference day, keyed by the caller; empty until the export lands. */
  pressers: readonly { key: string; slug: string; day: string }[];
  /** The predicted elevens, when the export holds the round ahead; keyed by the caller. */
  lineups: { key: string; slug: string } | null;
  /** The round the Team Sheet and the elevens preview, when the calendar places it. */
  ahead: { period: number; gameweek: number } | null;
  /** The next round to lock, and when, which is when Lawro's column is due. */
  next: { period: number; gameweek: number; locksAt: string } | null;
  /** The London days whose every match has settled, each a match-day report (`reports/due.ts`). */
  reportDays: readonly { key: string; slug: string; day: string }[];
  /** The draft reports due: after Saturday, and at the end of the gameweek (`matchups/due.ts`). */
  draftReports: readonly { key: string; slug: string; cutoff: "saturday" | "gameweek"; day: string }[];
}

/** The columns a finished round earns, in the order they are worth reading. */
const MONDAY_SET: StoryKind[] = ["eleven", "power-ranking", "dodgers"];

/** Wire stories one firing may offer the cap, so a deadline-day afternoon cannot fill the paper with other people's news. */
const NEWS_PER_FIRING = 2;

/** A once-a-round story's covered-key and slug: filed once per gameweek, and its URL says which. */
export function roundSlot(kind: string, gameweek: number): { key: string; slug: string } {
  return { key: `${kind}:gw${gameweek}`, slug: `gw${gameweek}-${kind}` };
}

/** How close a kickoff must be before a preview piece files. */
const PREVIEW_WINDOW_HOURS = 12;

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
    // A match-day report as each day's football settles, then the draft report on the league's own match-ups.
    for (const day of desk.reportDays) want({ kind: "match-report", ...day });
    for (const due of desk.draftReports) want({ kind: "draft-report", key: due.key, slug: due.slug, cutoff: due.cutoff, day: due.day });
  }

  if (desk.finished && fixtured) {
    // One report per tie, each its own covered-key, so the cap takes what it has room for and the next firing the rest.
    for (const tie of desk.ties) {
      want({
        kind: "tie-report",
        key: `tie-report:p${desk.period}:${tie.homeTeamId}v${tie.awayTeamId}`,
        slug: `p${desk.period}-report-${tie.homeTeamId}v${tie.awayTeamId}`,
        tie: { homeTeamId: tie.homeTeamId, awayTeamId: tie.awayTeamId },
      });
    }
    for (const kind of MONDAY_SET) {
      want({ kind, ...roundSlot(kind, desk.gameweek) });
    }
    // Tuesday's Bin XI, the round's best eleven nobody has, filed before Wednesday's waivers.
    if (binXiDue(now)) want({ kind: "bin-xi", ...roundSlot("bin-xi", desk.gameweek) });
  }

  // The sheets from the deadline until the last whistle: a 12:15 lock and a 12:30 kickoff fall inside one cron's delay.
  if (desk.locked && !desk.finished && fixtured) {
    want({ kind: "sheets", ...roundSlot("sheets", desk.gameweek) });
  }

  // Calls only while the round is being played: after the last whistle the report owns every verdict.
  if (desk.started && !desk.finished) {
    for (const tie of desk.ties) {
      if (tie.state === "open") continue;
      want({
        kind: "tie-call",
        key: `tie-call:p${desk.period}:${tie.homeTeamId}v${tie.awayTeamId}`,
        slug: `p${desk.period}-call-${tie.homeTeamId}v${tie.awayTeamId}`,
        tie: { homeTeamId: tie.homeTeamId, awayTeamId: tie.awayTeamId },
      });
    }
  }

  if (desk.started && !desk.finished) {
    for (const stake of desk.stakes) {
      if (stake.finished || !upcoming(stake.kickoff, now)) continue;
      // Tonight's game is a piece when an open tie has men on both sides of it.
      const swings = stake.ties.some(
        (tie) =>
          bothSides(tie) &&
          desk.ties.some(
            (live) =>
              live.state === "open" &&
              live.homeTeamId === tie.homeTeamId &&
              live.awayTeamId === tie.awayTeamId,
          ),
      );
      if (!swings) continue;
      want({
        kind: "fixture-preview",
        key: `fixture-preview:gw${desk.gameweek}:${stake.key}`,
        slug: `gw${desk.gameweek}-preview-${stake.key}`,
        fixtureId: stake.fixtureId,
      });
    }
  }

  // The outside world after the calls, which go stale within hours; keyed on the article, fragment stripped.
  for (const story of desk.news.slice(0, NEWS_PER_FIRING)) {
    want({ kind: "news", key: `news:${story.key}`, slug: story.slug });
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

  // The wire keys on the window, so a second firing in the same week has nothing new to say.
  if (desk.dealsInWindow > 0 && fixtured) {
    want({ kind: "wire", key: `wire:through-gw${desk.gameweek}`, slug: `gw${desk.gameweek}-wire` });
  }

  return out;
}

function upcoming(kickoff: string | null, now: string): boolean {
  if (kickoff === null) return false;
  const at = Date.parse(kickoff);
  const clock = Date.parse(now);
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at > clock && at - clock <= PREVIEW_WINDOW_HOURS * 60 * 60 * 1000;
}
