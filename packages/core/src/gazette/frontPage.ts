import type { PublishedStory, StoryKind } from "./story";
import { londonDayOf } from "../time";

// The running order of the rolling paper, and the three ways a story leaves it.
//
// One function, two consumers: the writer composes before it persists — so the
// committed paper IS the print order and the app never re-decides it — and the
// app composes what it read, so a paper written by an older writer still prints
// in today's order. Pure: `now` is injected, never read.

/** How many stories the paper carries before the oldest fall off the back.
 *  Roughly two rounds of full coverage — reports, columns and news for the
 *  round in view with the previous round still findable below it. Git history
 *  keeps everything older; the paper is a paper, not an archive. */
export const MAX_PAPER_STORIES = 24;

/** What a newly filed story retires, by kind, within its own period. A tie
 *  report is the round's last word: it confirms or corrects the mid-round call
 *  on its own tie, and its existence proves the football has stopped — which
 *  makes the predictions column it marks history too, whichever tie files
 *  first. A table row, not code branches, so the next supersession is one line. */
const SUPERSEDES: Partial<Record<StoryKind, readonly StoryKind[]>> = {
  "tie-report": ["tie-call", "predictions"],
};

/** The kind's standing in the running order — higher leads. Scale, not hue:
 *  within a period the reporting outranks the columns, the columns outrank the
 *  back pages, and the argument for each band is the reader's question it
 *  answers ("what happened" before "what do we think" before "where do we
 *  stand"). Recency breaks ties within a band; the PERIOD outranks all of it,
 *  because a paper that leads with last week is not a paper. */
const KIND_WEIGHT: Record<StoryKind, number> = {
  // **Team news leads, above the reports.** It sat at 68 under a comment saying
  // it was "the most actionable thing in the paper, a deadline away", which the
  // number flatly contradicted — every report and every wire item outranked it,
  // and Craig found it buried: "this should be the top article for today, its
  // the major piece of the day".
  //
  // The argument, and it is the band rule rather than an exception to it: a
  // report is about football already played and a result nobody can change,
  // while team news is the only thing on the page a reader can still ACT on. He
  // reads it to pick a side before the lock. "What happened" outranks "what do
  // we think", and "what do I do in the next few hours" outranks both.
  //
  // Safe across the week without a clock: a presser's signal window closes at
  // the next lock, so on report day there is no fresh one to lead with.
  presser: 95,
  // An hour behind the presser and derived from it: the news is what a manager
  // said, this is what somebody predicts he will do about it.
  "predicted-xi": 92,
  // The sides as locked: filed at the deadline, when the pressers and the predictions are spent.
  sheets: 94,
  "tie-report": 90,
  // Above the team sheets (Craig, 28 Sep 2026: "reports lead over team sheets, it's the newer news"): filed after the
  // whistle, when the sheets filed at the lock can no longer be acted on.
  "match-report": 96,
  "tie-call": 78,
  news: 70,
  "fixture-preview": 65,
  predictions: 55,
  eleven: 40,
  "power-ranking": 35,
  dodgers: 30,
  wire: 25,
};

/** The paper in print order: expired dropped, superseded retired, the rest
 *  ranked. First story is the splash. */
export function composePaper(stories: readonly PublishedStory[], now: string): PublishedStory[] {
  const current = stories.filter((story) => !expired(story, now));

  const alive = current.filter((story) => {
    const retiredBy = current.some(
      (other) =>
        other !== story &&
        (kindRetires(other, story) || subjectRetires(other, story) || editionRetires(other, story)),
    );
    return !retiredBy;
  });

  return [...alive].sort(
    (a, b) =>
      b.period - a.period ||
      // Today's paper first. Kind weight ranks WITHIN a day, which is the only
      // place it was ever an argument — across days it buried a fresh column
      // under a three-day-old report.
      compareDay(b, a) ||
      KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] ||
      compareFiled(b, a) ||
      // **A firing stamps every story it files with ONE instant**, so `filedAt`
      // ties far more often than it looks — five tie-reports from one run are
      // all the same second, and so were Thursday's and Friday's Team Sheets.
      // The tie used to fall through to whatever was commissioned first, which
      // put Thursday's ahead of Friday's. Slugs carry the date where a story has
      // one (`gw5-presser-2026-09-18`), so descending is recency; where they do
      // not it is at least stable, which arbitrary order was not.
      b.slug.localeCompare(a.slug),
  );
}

/** The London day a story was filed on, `""` when unreadable so it sorts last. */
function dayKey(iso: string): string {
  return londonDayOf(iso) ?? "";
}

// An unreadable instant sorts oldest, as it does in `compareFiled`.
function compareDay(a: PublishedStory, b: PublishedStory): number {
  return dayKey(a.filedAt).localeCompare(dayKey(b.filedAt));
}

function expired(story: PublishedStory, now: string): boolean {
  if (story.expiresAt === null) return false;
  const at = Date.parse(story.expiresAt);
  const clock = Date.parse(now);
  // An unreadable date on either side is "cannot be shown to be expired", and a
  // story is kept until something shows it should go.
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at < clock;
}

/** The columns that run ONE EDITION PER ROUND, so last round's is replaced
 *  rather than stacked beside this round's.
 *
 *  **Not every kind.** A tie-report and a news item are about a SUBJECT — five
 *  ties and two stories from the wire, each its own piece — and `subjectRetires`
 *  already keeps those honest within a round. These are editions of one
 *  standing column, and the paper printed two Power Rankings, two Points Dodgers
 *  and two Teams of the Week side by side because nothing said so.
 *
 *  **The presser is NOT here**, and was until it ate Thursday's column. A week
 *  holds two of them and they are not editions of each other — they are keyed by
 *  DAY. Worse, the two need not share a period: Thursday's is filed before the
 *  round rolls over and Friday's after, so this retired one by the other. Team
 *  news expires at the kickoff it previewed instead. */
const EDITIONS: readonly StoryKind[] = ["eleven", "power-ranking", "dodgers", "wire", "predictions", "sheets"];

function editionRetires(newer: PublishedStory, older: PublishedStory): boolean {
  return newer.kind === older.kind && EDITIONS.includes(newer.kind) && newer.period > older.period;
}

function kindRetires(newer: PublishedStory, older: PublishedStory): boolean {
  return (
    newer.period === older.period &&
    (SUPERSEDES[newer.kind] ?? []).includes(older.kind) &&
    compareFiled(newer, older) >= 0
  );
}

/** The "Sunday's paper covers Sunday" mechanic: a fresher story of the same
 *  kind that spends one of the same subject keys replaces the earlier telling
 *  rather than stacking beside it. */
function subjectRetires(newer: PublishedStory, older: PublishedStory): boolean {
  if (newer.kind !== older.kind) return false;
  if (compareFiled(newer, older) <= 0) return false;
  return newer.subjects.some((subject) => older.subjects.includes(subject));
}

function compareFiled(a: PublishedStory, b: PublishedStory): number {
  // Unparseable filing instants sort as oldest — a story that cannot say when
  // it was filed never wins a recency argument.
  const at = Date.parse(a.filedAt);
  const bt = Date.parse(b.filedAt);
  return (Number.isNaN(at) ? 0 : at) - (Number.isNaN(bt) ? 0 : bt);
}
