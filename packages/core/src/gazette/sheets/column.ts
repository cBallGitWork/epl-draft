import type { StorySheet, StorySheetSide } from "./cargo";
import type { TeamFacts, TieFacts } from "./facts";
import type { SheetMan } from "./sheet";

// The desk's half of the article: the headline, the deck, the printed elevens, and a plain line for
// any side whose paragraph failed the editor twice. Nothing here is written by the model.

/** A side's paragraph by team id, and each head-to-head's meeting line by `sheetsKey`. */
export type SheetsDraft = ReadonlyMap<string, string>;

export const sheetsKey = (homeTeamId: string, awayTeamId: string) => `${homeTeamId}-${awayTeamId}`;

export function assembleSheets(input: { gameweek: number; ties: readonly TieFacts[]; draft: SheetsDraft }): Record<string, unknown> {
  const { ties, draft } = input;
  const printed = (team: TeamFacts): StorySheetSide => ({
    teamId: team.sheet.teamId,
    formation: team.formation,
    line: draft.get(team.sheet.teamId) || plainLine(team),
    xi: team.sheet.starters.map(named),
    bench: team.sheet.bench.map(named),
  });
  const sheets: StorySheet[] = ties.map((tie) => ({
    home: printed(tie.home),
    away: printed(tie.away),
    between: tie.meets.length === 0 ? "" : (draft.get(sheetsKey(tie.home.sheet.teamId, tie.away.sheet.teamId)) ?? ""),
  }));
  return {
    headline: `Team news: Gameweek ${input.gameweek}`,
    deck: sheetsDeck(ties),
    body: "Every side as it stood at the deadline, by this week's head-to-heads.",
    sheets,
  };
}

/** "23 changes across ten sides, two debuts"; on the first round, only that it is the first. */
export function sheetsDeck(ties: readonly TieFacts[]): string {
  const teams = ties.flatMap((tie) => [tie.home, tie.away]);
  const sides = `${inWords(teams.length)} ${teams.length === 1 ? "side" : "sides"}`;
  if (teams.every((team) => team.changes === null)) return `The first sheets of the season, ${sides}.`;
  const changes = teams.reduce((sum, team) => sum + (team.changes?.count ?? 0), 0);
  const debuts = teams.reduce((sum, team) => sum + (team.debuts?.length ?? 0), 0);
  const made = changes === 0 ? `No changes across ${sides}` : `${inWords(changes)} ${changes === 1 ? "change" : "changes"} across ${sides}`;
  const clause = debuts === 0 ? "" : `, ${inWords(debuts)} ${debuts === 1 ? "debut" : "debuts"}`;
  return `${capital(made)}${clause}.`;
}

/** The fallback, and it says only what the facts say: "test31 make two changes: Saka and Isak come in." */
export function plainLine(team: TeamFacts): string {
  const name = team.sheet.teamName;
  const shape = team.formation === null ? "" : ` in a ${team.formation}`;
  const changes = team.changes;
  if (changes === null) return `${name} name their first sheet${shape}.`;
  if (changes.count === 0) return `${name} name the same eleven as last round${shape}.`;
  const came = changes.in.map((each) => named(each.man));
  return `${name} make ${inWords(changes.count)} ${changes.count === 1 ? "change" : "changes"}: ${listed(came)} ${came.length === 1 ? "comes" : "come"} in.`;
}

function named(man: SheetMan): string {
  return man.player.name;
}

/** "A", "A and B", "A, B and C". */
function listed(names: readonly string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Newspaper style: words to ten, figures after. */
function inWords(n: number): string {
  return WORDS[n] ?? String(n);
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
