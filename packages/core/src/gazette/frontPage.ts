import type { PublishedStory, StoryKind } from "./story";

// The rolling paper's running order and the ways a story leaves it; the writer and the app both compose with it.

/** How many stories the paper carries before the oldest fall off: about two gameweeks of coverage. */
export const MAX_PAPER_STORIES = 24;

/** The kind's standing among stories filed at one instant, higher first: reporting, then team news, then columns. */
const KIND_WEIGHT: Record<StoryKind, number> = {
  // Team news sits with the top reports: the one thing on the page a reader can still act on.
  // Safe without a clock: a presser's window closes at the next lock, so report day has none to lead with.
  presser: 95,
  // Just behind the presser it is derived from: what a manager will do about what he said.
  "predicted-xi": 92,
  // The sides as locked: filed at the deadline, when the pressers and the predictions are spent.
  sheets: 94,
  // Above the team sheets: filed after the whistle, when the sheets can no longer be acted on.
  "match-report": 96,
  "draft-report": 95,
  predictions: 55,
  // Once a season, the week before the first lock: above the weekly column it comes before.
  "season-rankings": 60,
  // A trade is news: below the reports and team news, above the columns.
  trade: 90,
  // Tuesday's one column, below anything that happened.
  "bin-xi": 45,
};

/** The paper in print order: expired dropped, superseded retired, a story still leading first, the rest newest filed
 *  first. First story is the splash. */
export function composePaper(stories: readonly PublishedStory[], now: string): PublishedStory[] {
  const current = stories.filter((story) => !expired(story, now));

  const alive = current.filter((story) => {
    const retiredBy = current.some(
      (other) => other !== story && (subjectRetires(other, story) || editionRetires(other, story)),
    );
    return !retiredBy;
  });

  // The Line-Ups lead until the lock, then the most recent filing does (Craig, 9 Oct 2026); one run stamps every story
  // with one instant, so kind breaks that tie, and dated slugs (`gw5-presser-2026-09-18`) then sort newest first.
  return [...alive].sort(
    (a, b) =>
      Number(leads(b, now)) - Number(leads(a, now)) ||
      compareFiled(b, a) ||
      KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] ||
      b.slug.localeCompare(a.slug),
  );
}

/** Whether a story still holds the lead it was filed with; an unreadable instant on either side holds none. */
function leads(story: PublishedStory, now: string): boolean {
  if (story.leadsUntil === undefined) return false;
  const until = Date.parse(story.leadsUntil);
  const clock = Date.parse(now);
  return !Number.isNaN(until) && !Number.isNaN(clock) && clock < until;
}

function expired(story: PublishedStory, now: string): boolean {
  if (story.expiresAt === null) return false;
  const at = Date.parse(story.expiresAt);
  const clock = Date.parse(now);
  // An unreadable date on either side keeps the story.
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at < clock;
}

/** Columns that run one edition per gameweek, so a later period's replaces the last. Never the presser: a week
 *  holds two, keyed by day and possibly a period apart; it expires at the kickoff it previewed instead. */
const EDITIONS: readonly StoryKind[] = ["predictions", "sheets", "bin-xi"];

function editionRetires(newer: PublishedStory, older: PublishedStory): boolean {
  return newer.kind === older.kind && EDITIONS.includes(newer.kind) && newer.period > older.period;
}

/** A fresher story of the same kind sharing a subject key replaces the earlier telling. */
function subjectRetires(newer: PublishedStory, older: PublishedStory): boolean {
  if (newer.kind !== older.kind) return false;
  if (compareFiled(newer, older) <= 0) return false;
  return newer.subjects.some((subject) => older.subjects.includes(subject));
}

function compareFiled(a: PublishedStory, b: PublishedStory): number {
  // An unparseable filing instant sorts oldest.
  const at = Date.parse(a.filedAt);
  const bt = Date.parse(b.filedAt);
  return (Number.isNaN(at) ? 0 : at) - (Number.isNaN(bt) ? 0 : bt);
}
