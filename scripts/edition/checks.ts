import type { Assignment, PublishedStory } from "@epl/core";

// What a filed story is checked for before it is committed. `strangers` and `CARGO` warn and never refuse; the banned
// list sends a column back once (`sendBack` in `voice/house.ts`).

/** The kinds whose substance lives in `extras` rather than the body, and which member carries it. A kind absent from
 *  this table legitimately files without extras. */
export const CARGO: Partial<Record<Assignment["kind"], "ranks" | "teamNews" | "sheets" | "reports" | "draft">> = {
  "match-report": "reports",
  "draft-report": "draft",
  "season-rankings": "ranks",
  // The Team Sheet IS its rows; the body only introduces them.
  presser: "teamNews",
  sheets: "sheets",
};

/** Every written surface of a filed story, as one string to check names in: the body, the tie lines and every
 *  cargo row's written member, never the row itself, whose ids would read as names. */
export function prose(story: PublishedStory): string {
  const extras = story.extras ?? {};
  const parts: unknown[] = [
    // Not the headline: it is title case, so every ordinary word in it would report as a stranger.
    story.deck,
    story.body,
    ...(story.ties ?? []).map((tie) => tie.line),
    ...lines(extras.ranks),
    // The Team Sheet's rows are the article: the club's line, each man's note and the quote it carries.
    ...lines(extras.teamNews),
    ...(extras.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.note)),
    ...(extras.teamNews ?? []).map((row) => row.quote?.text),
    // Team news is its paragraphs; the elevens under them are printed from Fantrax.
    ...(extras.sheets ?? []).flatMap((tie) => [tie.home.line, tie.away.line]),
    ...(extras.reports ?? []).flatMap((r) => [r.standfirst, r.account, ...r.sections.flatMap((s) => [s.head, s.pitch, s.stake])]),
    ...(extras.draft?.matchups ?? []).flatMap((m) => [m.standfirst, ...m.paragraphs]),
  ];
  // Each part on its own line, which the check reads as a sentence opening.
  return parts.filter((part): part is string => typeof part === "string").join("\n");
}

/** The same with the headline, which is what the banned list reads: the headline is where "bank" did its damage. */
export function headlineAndProse(story: PublishedStory): string {
  return `${story.headline}\n${prose(story)}`;
}

/** Each cargo row's written `line`, or the row itself where it is a string; anything else is dropped, not stringified. */
function lines(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (typeof row === "string") return [row];
    if (row === null || typeof row !== "object") return [];
    const line = (row as Record<string, unknown>).line;
    return typeof line === "string" ? [line] : [];
  });
}
