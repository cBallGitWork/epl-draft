import type {
  PublishedStory,
  StoryFace,
  StoryKind,
  ThreadUpdate,
} from "@epl/core";
import { ANTHROPIC_MESSAGES_URL, MODEL_TIMEOUT_MS, normalizeStory } from "@epl/core";

// The one API call, and the shape a filed column takes in the rolling paper.

const MODEL = process.env.GAZETTA_MODEL ?? "claude-opus-4-8";
/** The model for the calls that read rather than write: a judge, a fan's read-back, a line edit. */
const HELPER_MODEL = process.env.GAZETTA_HELPER_MODEL ?? "claude-sonnet-5";

/** What a call is for: the writer's prose, or a helper's reading of it. */
export type Tier = "writer" | "helper";

/** Tokens a call cost, the cached prefix counted apart: read from cache at a fraction of the price, or written to it. */
export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}
const MAX_TOKENS = 8000;

/** One call, by fetch. No SDK: CODE_RULES §2 says no dependency a small local
 *  function would cover, and this is twenty lines. `maxTokens` is for a call that
 *  thinks at length before it answers, whose thinking spends the same budget. */
export async function writeColumn(
  system: string,
  brief: string,
  onUsage?: (usage: Usage) => void,
  tier: Tier = "writer",
  maxTokens = MAX_TOKENS,
): Promise<Record<string, unknown>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set. The column is written in CI, never on Vercel.");

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: tier === "helper" ? HELPER_MODEL : MODEL,
      max_tokens: maxTokens,
      // The voice is long and the same on every call of a firing, so it is cached: a repeat reads it at a fraction of the price.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: brief }],
    }),
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: { type?: string; text?: string }[];
    usage?: Usage;
  };
  if (body.usage !== undefined) onUsage?.(body.usage);
  // A truncated column is a JSON parse away from garbage, and the parse would
  // fail with a message about a bracket rather than about a limit.
  if (body.stop_reason !== "end_turn") throw new Error(`Stopped on ${body.stop_reason}, not a finished column.`);

  const text = body.content?.find((block) => block.type === "text")?.text ?? "";
  const fenced = __objectIn(text);
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

/** The reply from its first brace to its last: a sentence or a fence around the JSON is chatter,
 *  not a broken column. */
export function __objectIn(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end < start ? text.trim() : text.slice(start, end + 1);
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
  /** The columnist's own name, where it is not the kind's staff writer's. */
  reporter?: string;
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
    reporter: meta.reporter,
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
      lineups: column.lineups,
      sheets: column.sheets,
      record: column.record,
      skit: column.skit,
      reports: column.reports,
      bin: column.bin,
      draft: column.draft,
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
