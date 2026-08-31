import type { EditionKind, PublishedEdition, PublishedStory, StoryKind } from "@epl/core";
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
  return JSON.parse(text.trim().replace(/^```(?:json)?\n?|```$/g, "")) as Record<string, unknown>;
}

const ROUND_KIND: Record<EditionKind, StoryKind> = {
  preview: "round-preview",
  report: "round-report",
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
): PublishedStory {
  const story = normalizeStory({
    slug: `gw${edition.gameweek}-${ROUND_KIND[edition.kind]}`,
    kind: ROUND_KIND[edition.kind],
    leagueId: edition.leagueId,
    period: edition.period,
    gameweek: edition.gameweek,
    filedAt: edition.filedAt,
    expiresAt: edition.kind === "preview" ? expiresAt : null,
    edition: "",
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
