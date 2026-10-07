import type { PublishedStory, StoryKind } from "./story";
import { londonDayOf } from "../time";

// The rolling paper's running order and the ways a story leaves it; the writer and the app both compose with it.

/** How many stories the paper carries before the oldest fall off: about two gameweeks of coverage. */
export const MAX_PAPER_STORIES = 24;

/** What a newly filed story retires, by kind, within its own period: a tie report ends the call and the predictions. */
const SUPERSEDES: Partial<Record<StoryKind, readonly StoryKind[]>> = {
  "tie-report": ["tie-call", "predictions"],
};

/** The kind's standing within one day of one period, higher first: reporting, then columns, then back pages. */
const KIND_WEIGHT: Record<StoryKind, number> = {
  // Team news sits with the top reports: the one thing on the page a reader can still act on.
  // Safe without a clock: a presser's window closes at the next lock, so report day has none to lead with.
  presser: 95,
  // Just behind the presser it is derived from: what a manager will do about what he said.
  "predicted-xi": 92,
  // The sides as locked: filed at the deadline, when the pressers and the predictions are spent.
  sheets: 94,
  "tie-report": 90,
  // Above the team sheets: filed after the whistle, when the sheets can no longer be acted on.
  "match-report": 96,
  "draft-report": 95,
  "tie-call": 78,
  news: 70,
  "fixture-preview": 65,
  predictions: 55,
  // Once a season, the week before the first lock: above the weekly column it comes before.
  "season-rankings": 60,
  eleven: 40,
  // Tuesday's one column, above the Monday set it follows and below anything that happened.
  "bin-xi": 45,
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
      // Today's paper first; kind weight ranks only within a day.
      compareDay(b, a) ||
      KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] ||
      compareFiled(b, a) ||
      // One run stamps every story with one instant; dated slugs (`gw5-presser-2026-09-18`) then sort newest first.
      b.slug.localeCompare(a.slug),
  );
}

/** Kinds the front page does not print; each article keeps its own page. */
const OFF_THE_FRONT: readonly StoryKind[] = ["news", "wire"];

/** The paper as the front page prints it. */
export function frontPage(stories: readonly PublishedStory[], now: string): PublishedStory[] {
  return composePaper(stories, now).filter((story) => !OFF_THE_FRONT.includes(story.kind));
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
  // An unreadable date on either side keeps the story.
  if (Number.isNaN(at) || Number.isNaN(clock)) return false;
  return at < clock;
}

/** Columns that run one edition per gameweek, so a later period's replaces the last. Never the presser: a week
 *  holds two, keyed by day and possibly a period apart; it expires at the kickoff it previewed instead. */
const EDITIONS: readonly StoryKind[] = ["eleven", "power-ranking", "dodgers", "wire", "predictions", "sheets", "bin-xi"];

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
