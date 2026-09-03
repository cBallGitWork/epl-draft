import { type StoryExtras, normalizeExtras } from "./extras";
import { type EditionTie, isTie, once } from "./published";

// The rolling paper: prose as a stack of stories rather than one column a round.
//
// `published.ts` records the original contract — facts are live, prose is
// published — and this file is its successor's shape: published prose now
// ACCUMULATES. A story is filed when something happened, joins the stack in
// `data/editions/paper.json`, and leaves it by expiry, supersession or the cap
// (`frontPage.ts` owns all three). Still commit-based, still validated at this
// edge from both directions, still never reaching a clock or the network.

/** What kind of story this is. The kind decides its voice, its brief and its
 *  place in the running order, so the list is ours — and every member here is
 *  one the newsdesk can assign and the page can print.
 *
 *  `table` and `numbers` were drafted as a Statto column over the sidebar
 *  charts and are deliberately NOT here: nothing files them, and a kind in
 *  this union that no desk writes reads as supported when it is not
 *  (CODE_RULES §2 — if it is not used this phase it is not committed this
 *  phase). The charts print as facts and need no prose to stand up. The idea
 *  is kept in the plan, not in the type. */
export type StoryKind =
  | "round-preview"
  | "match-report"
  | "fixture-preview"
  | "tie-call"
  | "tie-report"
  | "predictions"
  | "eleven"
  | "power-ranking"
  | "wire"
  | "dodgers"
  | "presser"
  | "studio"
  | "news";

const STORY_KINDS: readonly StoryKind[] = [
  "round-preview", "match-report", "fixture-preview",
  "tie-call", "tie-report", "predictions", "eleven", "power-ranking",
  "wire", "dodgers", "presser", "studio", "news",
];

export type { StoryExtras } from "./extras";

/** One filed story, as committed.
 *
 *  Every field is optional-shaped at the edge (`normalizeStory`) because this
 *  arrives as JSON a model helped write: the schema is a request, not a
 *  guarantee, and the page renders whatever survives rather than throw. */
export interface PublishedStory {
  /** Ours, computed by the writer, never the model's — it is the dedupe key,
   *  the archive filename and the anchor the front page links to. */
  slug: string;
  kind: StoryKind;
  /** Same reason `PublishedEdition` carries it: CI files with its environment's
   *  league and the app serves its own, and both number periods from the same
   *  Friday — this is the whole rehearsal gate. */
  leagueId: string;
  period: number;
  gameweek: number;
  /** ISO instant filed. Shown — a reader is entitled to know how old an
   *  opinion is — and the recency half of the running order. */
  filedAt: string;
  /** ISO instant after which the story is not printed, stamped by the writer
   *  from facts (a preview dies at its kickoff). Null means it leaves by
   *  supersession or the cap instead. */
  expiresAt: string | null;
  /** Which named edition it went out under — "The Pink 'Un" — display copy. */
  edition: string;
  byline: string;
  /** The wordplay headline. */
  headline: string;
  /** The same story in plain words, so the pun is never the only telling. */
  deck: string;
  /** Paragraphs, split on blank lines by whatever prints it. */
  body: string;
  /** The covered-keys this story spends — the ledger's join for dedupe and the
   *  subject half of supersession. */
  subjects: string[];
  /** The splash picture, when CI generated one. A committed file under the
   *  app's public/, referenced here and rendered only through the newsprint
   *  treatment. */
  image: { src: string; alt: string } | null;
  ties?: EditionTie[];
  extras?: StoryExtras;
}

/** The paper file as committed: every story currently in print. */
export interface PublishedPaper {
  updatedAt: string;
  stories: PublishedStory[];
}

/** Coerce one story or refuse it. Refusal is ordinary — a malformed story is
 *  "there is no such story", never a thrown page. */
export function normalizeStory(parsed: unknown): PublishedStory | null {
  if (parsed === null || typeof parsed !== "object") return null;
  const raw = parsed as Partial<PublishedStory>;

  // The six that decide whether this is a story at all: unmatchable to a
  // round, unattributable to a league, unaddressable, undated, or with nothing
  // to print — each reads as "no story". The dateline is REQUIRED, not
  // coerced: journalism leads at all times now, and the filed instant is the
  // whole honesty of an opinion printed under moving scores — a story that
  // cannot say when it was filed is not printable in a rolling paper.
  if (typeof raw.slug !== "string" || raw.slug === "") return null;
  if (!STORY_KINDS.includes(raw.kind as StoryKind)) return null;
  if (typeof raw.leagueId !== "string" || raw.leagueId === "") return null;
  if (typeof raw.period !== "number" || typeof raw.gameweek !== "number") return null;
  if (typeof raw.headline !== "string" || raw.headline === "") return null;
  if (typeof raw.filedAt !== "string" || raw.filedAt === "") return null;

  const image =
    raw.image !== null &&
    typeof raw.image === "object" &&
    typeof raw.image.src === "string" &&
    raw.image.src !== "" &&
    typeof raw.image.alt === "string"
      ? { src: raw.image.src, alt: raw.image.alt }
      : null;

  return {
    slug: raw.slug,
    kind: raw.kind as StoryKind,
    leagueId: raw.leagueId,
    period: raw.period,
    gameweek: raw.gameweek,
    filedAt: raw.filedAt,
    expiresAt: typeof raw.expiresAt === "string" && raw.expiresAt !== "" ? raw.expiresAt : null,
    edition: typeof raw.edition === "string" ? raw.edition : "",
    byline: typeof raw.byline === "string" ? raw.byline : "",
    headline: raw.headline,
    deck: typeof raw.deck === "string" ? raw.deck : "",
    body: typeof raw.body === "string" ? raw.body : "",
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects.filter((s): s is string => typeof s === "string" && s !== "")
      : [],
    image,
    ties: once(Array.isArray(raw.ties) ? raw.ties.filter(isTie) : [], (t) => `${t.homeTeamId}-${t.awayTeamId}`),
    extras: normalizeExtras(raw.extras),
  };
}

/** The paper as the app (and the writer, re-reading its own output) sees it:
 *  parsed, story-by-story survivable, and about ONE league — a story filed
 *  about any other league is not this paper, whatever else it claims. */
export function normalizePaper(parsed: unknown, leagueId: string): PublishedStory[] {
  if (parsed === null || typeof parsed !== "object") return [];
  const raw = parsed as Partial<PublishedPaper>;
  if (!Array.isArray(raw.stories)) return [];

  const stories = raw.stories
    .map(normalizeStory)
    .filter((story): story is PublishedStory => story !== null && story.leagueId === leagueId);
  // One slug, one story: the slug is the archive name and the page anchor, and
  // a repeated one is a retry that got committed twice. Newest filing wins,
  // which is the opposite of `once` — a rewrite supersedes its draft.
  return once([...stories].reverse(), (story) => story.slug).reverse();
}
