import { type FixtureStake, bothSides } from "./relevance";
import type { StoryKind } from "./story";
import type { TieState } from "./tieState";

// What is newsworthy THIS firing. The cron decides when the desk looks; this
// decides what it files, from what is new since the covered-keys were last
// spent — so a re-fired schedule finds nothing and exits, and a skipped one
// catches up on the next look.
//
// The running order is an editor's argument, in the `stories.ts` tradition:
// the round's own reporting first (a report per TIE once the football stops,
// then the preview); then the perishable (a tie newly decided is a call that
// goes stale the moment the next score moves); then the look-ahead (a preview
// piece can wait an hour, tonight's kickoff notwithstanding). The cap in the
// orchestrator takes from the top.
//
// **This is a DRAFT paper, so it does not report Premier League matches.**
// A finished round commissioned four `match-report`s until 16 Sep 2026 — the
// four biggest fixtures by stake — and Craig's ruling cut them: *"no more PREM
// match reports, we have that coverage"*. He is right about the coverage:
// `/prem/match/[id]` carries the scoresheet, the stats, the shot map and the
// average positions, which is more than a column can say and all of it true
// without a model. What the paper is about is the ten managers.
//
// **The kind itself is deliberately still alive.** `match-report` remains in
// `StoryKind`, `KIND_WEIGHT` and `paperPages.ts`, and its brief builder and
// voice are untouched. Nine of them are published in `paper.json` today, and
// `normalizeStory` refuses any story whose kind it does not know — so deleting
// the member would silently void filed history with a green typecheck and a
// green build. The kind stops being COMMISSIONED; it stays READABLE.
//
// **A finished round files a report per tie, and never one about the league.**
// It filed a single `round-report` until 3 Sep 2026 whose prompt said "SPREAD
// ACROSS THE LEAGUE… a paper about a whole league that only mentions two
// managers has failed", and Craig's ruling reversed exactly that: *"the back
// page is a league summary, dont do that, not the whole league in 1 article"*.
// A tie has two managers in it, which is how many a story can be about; five
// ties are five stories, and the front page's three ranks are what sort them.

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
  /** Deals in the wire's trailing window. Nought is a quiet week and files no
   *  column — the paper does not manufacture business. */
  dealsInWindow: number;
  /** Wire items that name a man somebody in the league holds, freshest first.
   *  Already triaged: an item with no stake in our league never reaches here. */
  news: readonly { key: string; slug: string }[];
}

/** The columns a finished round earns, in the order they are worth reading.
 *  The eleven and the rankings are what the league argues about.
 *
 *  It ended `"studio", "presser"` until 3 Sep 2026 — two invented-quote
 *  sketches, cut on Craig's ruling: *"this is rubbish, ditch."* */
const MONDAY_SET: StoryKind[] = ["eleven", "power-ranking", "dodgers"];

/** How many wire stories one firing may offer the cap. Two: the desk looks
 *  every half hour and a transfer-deadline afternoon would otherwise fill the
 *  paper with other people's news. */
const NEWS_PER_FIRING = 2;

/** How close a kickoff must be before a preview piece files. Half a day: the
 *  Team Sheet's Friday sweep catches the weekend, and this catches tonight's
 *  game that can swing an open tie. */
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

  if (desk.finished) {
    // One report per tie, in the order the ties are given — `desk.ties` arrives
    // from the period's pairings and the orchestrator's cap takes from the top,
    // so a busy firing reports the ties it has room for and the next one picks
    // up the rest. Each is its own covered-key, so none is written twice.
    for (const tie of desk.ties) {
      want({
        kind: "tie-report",
        key: `tie-report:p${desk.period}:${tie.homeTeamId}v${tie.awayTeamId}`,
        slug: `p${desk.period}-report-${tie.homeTeamId}v${tie.awayTeamId}`,
        tie: { homeTeamId: tie.homeTeamId, awayTeamId: tie.awayTeamId },
      });
    }
    // The Monday Club's set: the round's considered read. Each is its own
    // covered-key, so a column filed once is never queued again — which is what
    // lets the writer file the whole set in one firing when it has room, and
    // pick up whatever is left in the next one when it has not.
    for (const kind of MONDAY_SET) {
      want({ kind, key: `${kind}:gw${desk.gameweek}`, slug: `gw${desk.gameweek}-${kind}` });
    }
  } else if (desk.locked && !desk.started) {
    want(roundPreview(desk.gameweek));
    // The predictions column files in the same window as the preview and is
    // marked against the results a week later.
    want({ kind: "predictions", key: `predictions:gw${desk.gameweek}`, slug: `gw${desk.gameweek}-predictions` });
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

  // The look-ahead and the outside world come LAST, and the order is the whole
  // point of the cap: a tie that has just gone settled is perishable — the
  // next score can make the call moot and the tie's own report will own it within
  // hours — while a waiver trend and a BBC item keep. Queued above the calls,
  // a Saturday with one claim and two wire items bought a waiver column and
  // somebody else's transfer news while the paper's own story waited.
  //
  // The key is the ARTICLE — fragment stripped, so the same story re-listed as
  // it moves up the feed is not covered twice.
  for (const story of desk.news.slice(0, NEWS_PER_FIRING)) {
    want({ kind: "news", key: `news:${story.key}`, slug: story.slug });
  }

  // The wire is weekly and keys on the WINDOW rather than the round: it reports
  // trends across recent business, so a second firing in the same week has
  // nothing new to say however many deals landed.
  if (desk.dealsInWindow > 0) {
    want({ kind: "wire", key: `wire:through-gw${desk.gameweek}`, slug: `gw${desk.gameweek}-wire` });
  }

  return out;
}

function roundPreview(gameweek: number): Assignment {
  return {
    kind: "round-preview",
    key: `round-preview:gw${gameweek}`,
    slug: `gw${gameweek}-round-preview`,
  };
}

function upcoming(kickoff: string | null, now: string): boolean {
  if (kickoff === null) return false;
  const at = Date.parse(kickoff);
  const clock = Date.parse(now);
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at > clock && at - clock <= PREVIEW_WINDOW_HOURS * 60 * 60 * 1000;
}
