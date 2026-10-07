import { listed } from "../../format";
import type { StorySheet, StorySheetMan, StorySheetSide } from "./cargo";
import type { TeamFacts, TieFacts } from "./facts";
import { printName, type SheetMan } from "./sheet";

// The desk's half of the article: the headline, the deck, the printed elevens, and a plain line for
// any side whose paragraph failed the editor twice. Nothing here is written by the model.

/** A side's paragraph by team id. */
export type SheetsDraft = ReadonlyMap<string, string>;

export function assembleSheets(input: {
  gameweek: number;
  ties: readonly TieFacts[];
  draft: SheetsDraft;
  /** His club's match this gameweek, "EVE (H)", by FPL club id; null for none. */
  against: (clubId: number) => string | null;
}): Record<string, unknown> {
  const { ties, draft } = input;
  const printed = (man: SheetMan): StorySheetMan => ({ name: man.player.name, code: man.player.code, slot: man.slot, against: input.against(man.player.clubId) });
  const side = (team: TeamFacts): StorySheetSide => ({
    teamId: team.sheet.teamId,
    formation: team.formation,
    line: draft.get(team.sheet.teamId) || plainLine(team),
    xi: team.sheet.starters.map(printed),
    bench: team.sheet.bench.map(printed),
  });
  const sheets: StorySheet[] = ties.map((tie) => ({
    home: side(tie.home),
    away: side(tie.away),
  }));
  return {
    headline: `Team news: Gameweek ${input.gameweek}`,
    deck: sheetsDeck(ties),
    body: standfirst(),
    sheets,
  };
}

/** What the piece is, said plainly. */
export function standfirst(): string {
  return "The deadline has passed. The line-ups, by head-to-head.";
}

/** "23 changes and two debuts"; "Every side unchanged"; on the first gameweek, that it is the first. */
export function sheetsDeck(ties: readonly TieFacts[]): string {
  const teams = ties.flatMap((tie) => [tie.home, tie.away]);
  if (teams.every((team) => team.changes === null)) return "The first line-ups of the season.";
  const changes = teams.reduce((sum, team) => sum + (team.changes?.count ?? 0), 0);
  const debuts = teams.reduce((sum, team) => sum + (team.debuts?.length ?? 0), 0);
  if (changes === 0) return "Every side unchanged.";
  const made = `${inWords(changes)} ${changes === 1 ? "change" : "changes"}`;
  return `${capital(made)}${debuts === 0 ? "" : ` and ${inWords(debuts)} ${debuts === 1 ? "debut" : "debuts"}`}.`;
}

/** The fallback, and it says only what the facts say: "test31 make two changes: Saka and Isak come in." */
export function plainLine(team: TeamFacts): string {
  const name = team.sheet.teamName;
  const shape = team.formation === null ? "" : ` in a ${team.formation}`;
  const out = team.flags.flatMap((flag) => (flag.kind === "out" ? [printName(flag.man.player)] : []));
  // Who cannot play leads the desk's line as it leads the writer's.
  const absent = out.length === 0 ? "" : ` ${listed(out)} ${out.length === 1 ? "is" : "are"} named but out this weekend.`;
  const changes = team.changes;
  if (changes === null) return `${name} name their first sheet${shape}.${absent}`;
  if (changes.count === 0) return absent === "" ? `${name} name the same eleven as last gameweek${shape}.` : `${name} are unchanged.${absent}`;
  const came = changes.in.map((each) => printName(each.man.player));
  return `${name} make ${inWords(changes.count)} ${changes.count === 1 ? "change" : "changes"}: ${listed(came)} ${came.length === 1 ? "comes" : "come"} in.${absent}`;
}




const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Newspaper style: words to ten, figures after. */
function inWords(n: number): string {
  return WORDS[n] ?? String(n);
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
