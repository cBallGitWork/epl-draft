import { type StoryExtras, normalizeExtras } from "./extras";
import { type EditionTie, normalizeTie, once } from "./published";

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
  | "predicted-xi"
  | "news";

/** Every kind, as data. `normalizeStory` refuses a story whose kind is not here,
 *  and the paper's page table is checked against it — a kind missing from either
 *  fails silently, with a green typecheck and a green build. */
export const STORY_KINDS: readonly StoryKind[] = [
  "match-report", "fixture-preview",
  "tie-call", "tie-report", "predictions", "eleven", "power-ranking",
  "wire", "dodgers", "presser", "predicted-xi", "news",
];

export type { StoryExtras } from "./extras";

/** A player the page can print a picture of.
 *
 *  The FPL `code` and not the id: a portrait path keys off the season-stable
 *  code, and this is written to disk in `paper.json` — CODE_RULES §3 forbids
 *  persisting the per-season id. `clubId` is this season's, and is only ever
 *  used to reach a crest at render, never persisted as identity. */
export interface StoryFace {
  code: number;
  name: string;
  clubId: number;
  /** The roster slot he was filed in, for the one thing the picture needs it
   *  for: a goalkeeper's kit is a different shirt, and the shirt is the rung
   *  `PlayerImage` falls to when he has no photograph. Fantrax's own letter —
   *  the SLOT and never a position off the player. */
  position: string | null;
}

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
  /** CI files with its environment's league and the app serves its own, and
   *  both number periods from the same Friday — this is the whole rehearsal gate. */
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
  /** The columnist's own name, where it is not the house correspondent's. */
  reporter?: string;
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
  /** The man the story is about, so the page has a face to print beside it.
   *
   *  **Chosen by the DESK from the facts, never by the writer.** It is stamped
   *  in `dispatch.file()` from the same numbers the brief was built out of — the
   *  highest-scoring man in a tie, in a fixture, or in the eleven — so it cannot
   *  disagree with the prose and a model cannot invent a footballer into the
   *  picture slot. Null for a story with no man in it, which is ordinary: a
   *  power ranking is about ten managers and a wire column about a market. */
  face: StoryFace | null;
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

  // Every field or none. A face with no code is a portrait we cannot fetch and
  // a face with no name is a caption we cannot write, so a partial one is not a
  // face — it prints as no picture rather than as a broken one.
  const face =
    raw.face !== null &&
    typeof raw.face === "object" &&
    typeof raw.face.code === "number" &&
    typeof raw.face.name === "string" &&
    raw.face.name !== "" &&
    typeof raw.face.clubId === "number"
      ? {
          code: raw.face.code,
          name: raw.face.name,
          clubId: raw.face.clubId,
          position: typeof raw.face.position === "string" ? raw.face.position : null,
        }
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
    ...(typeof raw.reporter === "string" && raw.reporter !== "" ? { reporter: raw.reporter } : {}),
    headline: raw.headline,
    deck: typeof raw.deck === "string" ? raw.deck : "",
    body: typeof raw.body === "string" ? raw.body : "",
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects.filter((s): s is string => typeof s === "string" && s !== "")
      : [],
    image,
    face,
    ties: once(Array.isArray(raw.ties) ? raw.ties.flatMap(normalizeTie) : [], (t) => `${t.homeTeamId}-${t.awayTeamId}`),
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
