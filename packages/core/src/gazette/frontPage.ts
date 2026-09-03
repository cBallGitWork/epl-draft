import type { PublishedStory, StoryKind } from "./story";

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
 *  makes the whole-round preview and the predictions column it marks history
 *  too, whichever tie files first. A table row, not code branches, so the next
 *  supersession is one line.
 *
 *  These three sat on `round-report` until 3 Sep 2026, when the single article
 *  about the whole league was replaced by one report per tie. */
const SUPERSEDES: Partial<Record<StoryKind, readonly StoryKind[]>> = {
  "tie-report": ["tie-call", "round-preview", "predictions"],
};

/** The kind's standing in the running order — higher leads. Scale, not hue:
 *  within a period the reporting outranks the columns, the columns outrank the
 *  back pages, and the argument for each band is the reader's question it
 *  answers ("what happened" before "what do we think" before "where do we
 *  stand"). Recency breaks ties within a band; the PERIOD outranks all of it,
 *  because a paper that leads with last week is not a paper. */
const KIND_WEIGHT: Record<StoryKind, number> = {
  "tie-report": 90,
  "match-report": 85,
  "tie-call": 78,
  news: 70,
  "fixture-preview": 65,
  "round-preview": 60,
  predictions: 55,
  studio: 50,
  presser: 45,
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
        (kindRetires(other, story) || subjectRetires(other, story)),
    );
    return !retiredBy;
  });

  return [...alive].sort(
    (a, b) =>
      b.period - a.period ||
      KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] ||
      compareFiled(b, a),
  );
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
