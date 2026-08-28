import type { StoryResult } from "./types";

// The written paper: what a columnist filed, and whether it is about the round
// on screen.
//
// **The paper's facts are live and its prose is published, and the split is the
// whole design.** Everything countable on the front page updates on the app's
// thirty-second poll through the pure builders beside this file. Prose cannot
// work that way — a column rewritten every thirty seconds is not a column, and a
// sentence about a score that has since moved is worse than no sentence. So the
// writing happens twice a week, off the app entirely, and arrives as data.
//
// Nothing here reaches the network or a clock. This is the contract the writer
// must satisfy and the check the page makes before it prints a word.

/** Which column this is.
 *
 *  Two, because they are written at different moments about different things and
 *  only one of them can be wrong in an interesting way. `preview` goes out once
 *  lineups lock and predicts; `report` goes out once the football stops and
 *  reports. A page showing a preview after the round has been played would be
 *  printing a forecast as if it were news. */
export type EditionKind = "preview" | "report";

/** One paragraph-shaped piece of the column, keyed so a section that arrives
 *  empty simply does not print. */
export interface EditionSection {
  /** Stable and ours, not the writer's: `verdict`, `ties`, `eleven`. The page
   *  decides where each goes, so a writer inventing a key gets a section nobody
   *  renders rather than a page laid out by the model. */
  key: string;
  /** The newspaper heading over it, in the writer's words. */
  heading: string;
  /** Paragraphs, split on blank lines by whatever prints it. */
  body: string;
}

/** One tie, called or reported in a line. */
export interface EditionTie {
  /** Both team ids, so the page joins to its own names rather than printing the
   *  writer's copy of them — a name typed by a model is a name that goes stale
   *  the day somebody renames their team. */
  homeTeamId: string;
  awayTeamId: string;
  /** The columnist's line about it. */
  line: string;
  /** For a preview only: who he says wins. Null when he would not call it, which
   *  is a real answer and not a missing one. Never set on a report. */
  callsTeamId?: string | null;
}

/** A written edition, as committed.
 *
 *  Every field is optional-shaped at the edge (`normalizePublished`) because
 *  this arrives as JSON from a model: the schema is a request, not a guarantee,
 *  and the page must render whatever survives rather than throw. */
export interface PublishedEdition {
  kind: EditionKind;
  /** The Fantrax period the column is about. The page prints the column only
   *  when this matches the round in view — see `editionMatches`. */
  period: number;
  /** The gameweek, for the dateline. */
  gameweek: number;
  /** ISO instant the column was filed. Shown, because a reader is entitled to
   *  know how old an opinion is. */
  filedAt: string;
  /** The byline the column runs under. Copy, so it lives in the data rather than
   *  in a component. */
  byline: string;
  /** The wordplay headline. */
  headline: string;
  /** The same story in plain words, printed as the deck under the headline so
   *  the wordplay is never the only thing telling you what happened. */
  deck: string;
  /** The splash, in paragraphs. */
  intro: string;
  sections: EditionSection[];
  ties: EditionTie[];
}

/** Whether this column is about the round on screen.
 *
 *  The one check the page makes, and it is not decoration: an edition is
 *  committed to the repo and served until the next one replaces it, so on the
 *  Friday of the following week the newest column on disk is last week's. Printed
 *  unchecked, the paper would run a report of a round that finished eight days
 *  ago under a masthead dated today.
 *
 *  A mismatched edition is not an error and not a stale label — it is simply not
 *  this week's paper, so the page prints the facts and no column. */
export function editionMatches(
  edition: PublishedEdition | null,
  period: number | null,
  kind: EditionKind,
): boolean {
  return edition !== null && period !== null && edition.period === period && edition.kind === kind;
}

/** Coerce whatever was on disk into something a page can render.
 *
 *  Used by the writer before it commits and by the app when it reads, so a
 *  payload that would break the page cannot reach it from either direction.
 *  Absence is preserved as empty rather than invented: a column with no ties is
 *  a column with no ties, and the section for them does not print. */
export function normalizePublished(parsed: unknown): PublishedEdition | null {
  if (parsed === null || typeof parsed !== "object") return null;
  const raw = parsed as Partial<PublishedEdition>;

  // The four that decide whether this is an edition at all. A column with no
  // period cannot be matched to a round, and one with no headline has nothing to
  // print — both are "there is no edition", which is an ordinary state.
  if (raw.kind !== "preview" && raw.kind !== "report") return null;
  if (typeof raw.period !== "number" || typeof raw.gameweek !== "number") return null;
  if (typeof raw.headline !== "string" || raw.headline === "") return null;

  return {
    kind: raw.kind,
    period: raw.period,
    gameweek: raw.gameweek,
    filedAt: typeof raw.filedAt === "string" ? raw.filedAt : "",
    byline: typeof raw.byline === "string" ? raw.byline : "",
    headline: raw.headline,
    deck: typeof raw.deck === "string" ? raw.deck : "",
    intro: typeof raw.intro === "string" ? raw.intro : "",
    sections: Array.isArray(raw.sections) ? raw.sections.filter(isSection) : [],
    ties: Array.isArray(raw.ties) ? raw.ties.filter(isTie) : [],
  };
}

function isSection(value: unknown): value is EditionSection {
  const section = value as Partial<EditionSection>;
  return (
    typeof section?.key === "string" &&
    typeof section.heading === "string" &&
    typeof section.body === "string" &&
    section.body !== ""
  );
}

function isTie(value: unknown): value is EditionTie {
  const tie = value as Partial<EditionTie>;
  return (
    typeof tie?.homeTeamId === "string" &&
    typeof tie.awayTeamId === "string" &&
    typeof tie.line === "string" &&
    tie.line !== ""
  );
}

/** How the preview's calls turned out.
 *
 *  The whole reason a predictions column is worth printing: a pundit nobody
 *  marks is a pundit who never has to be right. Pure comparison, no writer
 *  involved — the previous week's calls against the results that came in, so the
 *  score is a fact about the football rather than a claim the column makes about
 *  itself.
 *
 *  Only ties he actually called are counted. Declining to call one is not a
 *  wrong answer, and folding it in as one would make silence the cheapest way to
 *  look right. */
export interface Marked {
  right: number;
  called: number;
}

export function markPreview(
  edition: PublishedEdition | null,
  results: readonly StoryResult[],
): Marked | null {
  if (edition === null || edition.kind !== "preview") return null;

  let right = 0;
  let called = 0;
  for (const tie of edition.ties) {
    const call = tie.callsTeamId;
    if (typeof call !== "string" || call === "") continue;

    // Only a tie that actually produced a result marks anything. A match still
    // being played is not a call he got wrong.
    const result = results.find(
      (played) =>
        (played.winner.teamId === tie.homeTeamId && played.loser.teamId === tie.awayTeamId) ||
        (played.winner.teamId === tie.awayTeamId && played.loser.teamId === tie.homeTeamId),
    );
    if (result === undefined) continue;

    called += 1;
    if (result.winner.teamId === call) right += 1;
  }

  return called === 0 ? null : { right, called };
}
