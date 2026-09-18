import type {
  EditionKind,
  PublishedEdition,
  PublishedStory,
  StoryFace,
  StoryKind,
  ThreadUpdate,
} from "@epl/core";
import { normalizeStory } from "@epl/core";

// The one API call, and the shape a filed column takes in the rolling paper.

const API = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.GAZETTA_MODEL ?? "claude-opus-4-8";
const MAX_TOKENS = 8000;

/** One call, by fetch. No SDK: CODE_RULES §2 says no dependency a small local
 *  function would cover, and this is twenty lines. */
export async function writeColumn(system: string, brief: string): Promise<Record<string, unknown>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set. The column is written in CI, never on Vercel.");

  const response = await fetch(API, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: brief }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: { type?: string; text?: string }[];
  };
  // A truncated column is a JSON parse away from garbage, and the parse would
  // fail with a message about a bracket rather than about a limit.
  if (body.stop_reason !== "end_turn") throw new Error(`Stopped on ${body.stop_reason}, not a finished column.`);

  const text = body.content?.find((block) => block.type === "text")?.text ?? "";
  const fenced = text.trim().replace(/^```(?:json)?\n?|```$/g, "");
  try {
    return JSON.parse(fenced) as Record<string, unknown>;
  } catch {
    // **A real newline inside a JSON string is not JSON.** The house style asks
    // for paragraphs separated by blank lines and the model occasionally
    // obliges literally, inside the quotes, where the spec requires `\n`. Two
    // of ten columns died that way on 2 Sep — good prose, thrown away on a
    // control character.
    //
    // So one repair and only one: escape the control characters that appear
    // INSIDE string literals, then parse again. It is deliberately not a
    // tolerant parser — a column whose braces are wrong is still a failure, and
    // a second exception here is the honest outcome.
    return JSON.parse(__escapeControlsInStrings(fenced)) as Record<string, unknown>;
  }
}

/** Escape raw newlines, tabs and carriage returns that sit inside a JSON string
 *  literal, leaving the ones between fields alone. Walks the text tracking
 *  whether it is inside quotes, which is enough to tell the two apart. */
export function __escapeControlsInStrings(json: string): string {
  const ESCAPES: Record<string, string> = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
  let out = "";
  let inString = false;
  let escaped = false;
  for (const character of json) {
    if (escaped) {
      out += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && inString) {
      out += character;
      escaped = true;
      continue;
    }
    if (character === '"') inString = !inString;
    out += inString && ESCAPES[character] !== undefined ? ESCAPES[character] : character;
  }
  return out;
}

const ROUND_KIND: Record<EditionKind, StoryKind> = {
  preview: "round-preview",
};

/** A round column, re-expressed as one story in the rolling paper.
 *
 *  The section headings are furniture the round prompts still write for the
 *  old shape; the story keeps every paragraph and lets them go. When the round
 *  kinds get their own prompts the model will write the story shape directly
 *  and this fold disappears with `latest.json`. */
export function storyOfEdition(
  edition: PublishedEdition,
  /** The covered-key this filing spends — also its one subject. */
  subject: string,
  /** When a preview stops being printable: the round's first kickoff. A report
   *  never expires on a clock. */
  expiresAt: string | null,
  /** The named edition it goes out under — display copy, stamped by the desk. */
  editionName: string,
): PublishedStory {
  const story = normalizeStory({
    slug: `gw${edition.gameweek}-${ROUND_KIND[edition.kind]}`,
    kind: ROUND_KIND[edition.kind],
    leagueId: edition.leagueId,
    period: edition.period,
    gameweek: edition.gameweek,
    filedAt: edition.filedAt,
    expiresAt: edition.kind === "preview" ? expiresAt : null,
    edition: editionName,
    byline: edition.byline,
    headline: edition.headline,
    deck: edition.deck,
    body: [edition.intro, ...edition.sections.map((section) => section.body)]
      .filter((paragraphs) => paragraphs !== "")
      .join("\n\n"),
    subjects: [subject],
    image: null,
    ties: edition.ties,
  });
  // The edition was already normalized, so a story built from it can only fail
  // normalization if this conversion is wrong — a bug, not bad model output.
  if (story === null) throw new Error("A normalized edition produced an unprintable story.");
  return story;
}

/** Everything ours about a filing; the model's part is only the words. */
export interface ColumnMeta {
  slug: string;
  kind: StoryKind;
  leagueId: string;
  period: number;
  gameweek: number;
  filedAt: string;
  expiresAt: string | null;
  edition: string;
  byline: string;
  /** The covered-key this filing spends — also its one subject. */
  subject: string;
  /** The man the page prints a picture of, picked by the desk from the facts
   *  (`assemble.faceOf`). Null for a kind with no man in it. It sits in the meta
   *  and not in the column deliberately: everything the model returned is read
   *  off `column` below, and the photograph is not the model's to choose. */
  face: StoryFace | null;
}

/** A rolling prose column (the `STORY_SHAPE` contract), stamped and validated
 *  into a story, with whatever storyline beats the model reported. */
export function storyOfColumn(
  column: Record<string, unknown>,
  meta: ColumnMeta,
): { story: PublishedStory; threads: ThreadUpdate[] } {
  const story = normalizeStory({
    slug: meta.slug,
    kind: meta.kind,
    leagueId: meta.leagueId,
    period: meta.period,
    gameweek: meta.gameweek,
    filedAt: meta.filedAt,
    expiresAt: meta.expiresAt,
    edition: meta.edition,
    byline: meta.byline,
    headline: column.headline,
    deck: column.deck,
    body: column.body,
    subjects: [meta.subject],
    image: null,
    face: meta.face,
    // The calls, for the kinds that make them.
    ties: column.ties,
    // **The cargo, nested.** Every column prompt asks for its structured part
    // at the TOP level — `quotes`, `ranks`, `quiz` — because that
    // is the shape a model reliably returns, and `PublishedStory` keeps them
    // under `extras`. Without this fold the sketches file a scene-setting
    // paragraph and no sketch, the rankings file an overview and no ranked list,
    // and the page renders exactly nothing of it — silently, since every
    // reader of `extras` treats absence as ordinary.
    extras: {
      quotes: column.quotes,
      ranks: column.ranks,
      quiz: column.quiz,
      teamNews: column.teamNews,
    },
  });
  if (story === null) throw new Error(`The ${meta.kind} did not come back in a printable shape.`);
  return { story, threads: threadUpdates(column.threads) };
}

/** The model reports at most a few beats; anything malformed is dropped, not
 *  fixed — the ledger is memory, and remembering garbage is worse than
 *  forgetting a beat. */
function threadUpdates(raw: unknown): ThreadUpdate[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((update): update is ThreadUpdate => {
      const beat = update as Partial<ThreadUpdate>;
      return (
        typeof beat?.subject === "string" && beat.subject !== "" &&
        typeof beat.beat === "string" && beat.beat !== "" &&
        (beat.status === undefined || beat.status === "open" || beat.status === "retired")
      );
    })
    .slice(0, 3);
}
