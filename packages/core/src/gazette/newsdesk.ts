import { type FixtureStake, bothSides } from "./relevance";
import type { StoryKind } from "./story";
import type { TieState } from "./tieState";

// What is newsworthy THIS firing. The cron decides when the desk looks; this
// decides what it files, from what is new since the covered-keys were last
// spent — so a re-fired schedule finds nothing and exits, and a skipped one
// catches up on the next look.
//
// The running order is an editor's argument, in the `stories.ts` tradition:
// the round's own word first (report, then preview — each is the whole round);
// then the perishable (a tie newly decided is a call that goes stale the
// moment the next score moves); then the meat (match reports, biggest stakes
// first); then the look-ahead (a preview piece can wait an hour, tonight's
// kickoff notwithstanding). The cap in the orchestrator takes from the top.

export interface Assignment {
  kind: StoryKind;
  /** The covered-key this assignment spends when it files. */
  key: string;
  /** The story's slug — addressable, ours, never the model's. */
  slug: string;
  /** Join handle back to the round's fixtures, this session only. */
  fixtureId?: number;
  tie?: { homeTeamId: string; awayTeamId: string };
}

export interface DeskTie {
  homeTeamId: string;
  awayTeamId: string;
  state: TieState;
}

export interface DeskState {
  gameweek: number;
  period: number;
  /** The round's three questions, answered at the edge as the writer already
   *  answers them: finished is the last whistle gone, locked is lineups
   *  locked, started is a first ball kicked. */
  finished: boolean;
  locked: boolean;
  started: boolean;
  /** Every fixture of the round, most-consequential first (`fixtureStakes`). */
  stakes: readonly FixtureStake[];
  ties: readonly DeskTie[];
}

/** Fixtures per round that earn their own report. Four of ten: below the
 *  fourth the headcount thins to fixtures the round-report's tie lines already
 *  cover, and a paper that reports every match is a wire service. */
export const MATCH_REPORTS_PER_ROUND = 4;

/** How close a kickoff must be before a preview piece files. Half a day: the
 *  Team Sheet's Friday sweep catches the weekend, and this catches tonight's
 *  game that can swing an open tie. */
export const PREVIEW_WINDOW_HOURS = 12;

export function newsdesk(
  desk: DeskState,
  covered: (key: string) => boolean,
  now: string,
): Assignment[] {
  const out: Assignment[] = [];
  const want = (assignment: Assignment) => {
    if (!covered(assignment.key)) out.push(assignment);
  };

  if (desk.finished) {
    want(round("round-report", desk.gameweek));
  } else if (desk.locked && !desk.started) {
    want(round("round-preview", desk.gameweek));
  }

  // Calls only while the round is being played: after the last whistle the
  // report owns every verdict, and before the first there is nothing to call.
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

  // The stakes arrive ranked, so "the four that earn a report" is a slice —
  // and it is the ROUND's four, not the firing's: a fixture outside the four
  // never files however quiet the day, which is what keeps the paper a paper.
  for (const stake of desk.stakes.slice(0, MATCH_REPORTS_PER_ROUND)) {
    if (!stake.finished || stake.men === 0) continue;
    want({
      kind: "match-report",
      key: `match:gw${desk.gameweek}:${stake.key}`,
      slug: `gw${desk.gameweek}-match-${stake.key}`,
      fixtureId: stake.fixtureId,
    });
  }

  if (desk.started && !desk.finished) {
    for (const stake of desk.stakes) {
      if (stake.finished || !upcoming(stake.kickoff, now)) continue;
      // Tonight's game is a piece when an OPEN tie has men on both sides of
      // it — the margin is the brief's colour, not the trigger's business.
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

  return out;
}

function round(kind: "round-report" | "round-preview", gameweek: number): Assignment {
  return { kind, key: `${kind}:gw${gameweek}`, slug: `gw${gameweek}-${kind}` };
}

function upcoming(kickoff: string | null, now: string): boolean {
  if (kickoff === null) return false;
  const at = Date.parse(kickoff);
  const clock = Date.parse(now);
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at > clock && at - clock <= PREVIEW_WINDOW_HOURS * 60 * 60 * 1000;
}
