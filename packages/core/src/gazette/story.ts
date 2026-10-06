import { type StoryExtras, normalizeExtras } from "./extras";
import { type StoryFace, normalizeFace } from "./face";
import { type EditionTie, normalizeTie, once } from "./published";

// The rolling paper's stories as committed in `data/editions/paper.json`, validated at this edge.

/** What kind of story this is: it decides the voice, the brief and the place in the running order. */
export type StoryKind =
  | "match-report"
  | "draft-report"
  | "fixture-preview"
  | "tie-call"
  | "tie-report"
  | "predictions"
  | "season-rankings"
  | "eleven"
  | "power-ranking"
  | "wire"
  | "dodgers"
  | "presser"
  | "predicted-xi"
  | "sheets"
  | "news"
  | "bin-xi";

/** Every kind, as data: `normalizeStory` refuses any other, and a kind missing here fails silently. */
export const STORY_KINDS: readonly StoryKind[] = [
  "match-report", "draft-report", "fixture-preview",
  "tie-call", "tie-report", "predictions", "season-rankings", "eleven", "power-ranking",
  "wire", "dodgers", "presser", "predicted-xi", "sheets", "news", "bin-xi",
];

export type { StoryExtras } from "./extras";
export type { StoryFace } from "./face";


/** One filed story, as committed; a model helped write it, so `normalizeStory` keeps what survives. */
export interface PublishedStory {
  /** The writer's, never the model's: the dedupe key, the archive filename and the page anchor. */
  slug: string;
  kind: StoryKind;
  /** The league it was filed for; the app prints only its own league's stories. */
  leagueId: string;
  period: number;
  gameweek: number;
  /** ISO instant filed: printed, and the recency half of the running order. */
  filedAt: string;
  /** ISO instant after which it is not printed (a preview dies at its kickoff); null leaves by supersession or the cap. */
  expiresAt: string | null;
  /** Which named edition it went out under — "The Pink 'Un" — display copy. */
  edition: string;
  byline: string;
  /** The columnist's own name, stamped at filing; it wins over the kind's staff writer (`writerOf`). */
  reporter?: string;
  /** The wordplay headline. */
  headline: string;
  /** The same story in plain words, so the pun is never the only telling. */
  deck: string;
  /** Paragraphs, split on blank lines by whatever prints it. */
  body: string;
  /** The covered keys this story spends: the ledger's dedupe join and the subject half of supersession. */
  subjects: string[];
  /** The splash picture when CI drew one: a committed file under the app's public/. */
  image: { src: string; alt: string } | null;
  /** The man the story is about, chosen by the desk from the brief's facts, never by the writer; null when none. */
  face: StoryFace | null;
  ties?: EditionTie[];
  extras?: StoryExtras;
}

/** The paper file as committed: every story currently in print. */
export interface PublishedPaper {
  updatedAt: string;
  stories: PublishedStory[];
}

/** Coerce one story or refuse it: a malformed story is no story, never a thrown page. */
export function normalizeStory(parsed: unknown): PublishedStory | null {
  if (parsed === null || typeof parsed !== "object") return null;
  const raw = parsed as Partial<PublishedStory>;

  // Without any of these six it is no story; the filed instant is required, never coerced.
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

  const face = normalizeFace(raw.face);

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

/** The paper as the app and the writer read it: each story normalised, and only those about `leagueId`. */
export function normalizePaper(parsed: unknown, leagueId: string): PublishedStory[] {
  if (parsed === null || typeof parsed !== "object") return [];
  const raw = parsed as Partial<PublishedPaper>;
  if (!Array.isArray(raw.stories)) return [];

  const stories = raw.stories
    .map(normalizeStory)
    .filter((story): story is PublishedStory => story !== null && story.leagueId === leagueId);
  // One slug, one story: a repeat is a retry committed twice, and the later entry wins.
  return once([...stories].reverse(), (story) => story.slug).reverse();
}
