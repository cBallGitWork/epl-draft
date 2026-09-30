import { banned } from "../banned";
import { REPORT_FPL } from "./words";
import type { MatchDesk } from "./desk";
import { REPORT_NEVER } from "./style";
import { isGoal } from "./timeline";

// The day's headline: the writer offers several, the desk strikes those that break a rule, and the fan picks one or none
// (sports desk, 28 Sep 2026). A pun that needs the report to explain it, or is untrue, is worse than a plain line.

const WORDS = 8;
const TABLOID = /\b(?:sinks?|stuns?|rocks?|hammers?|thrash(?:es)?|crush(?:es)?|smash(?:es)?|stun|blitz(?:es)?|romp(?:s)?|sweep(?:s)? aside)\b/iu;

/** Why a candidate is struck, or null when it may go to the fan. `names` are the proper nouns the facts carry. */
export function strike(headline: string, names: readonly string[]): string | null {
  if (headline.trim() === "") return "empty";
  if (headline.split(/\s+/u).length > WORDS) return "over eight words";
  if (/,|;|:/u.test(headline)) return "two clauses";
  if (/\bas\b/iu.test(headline)) return "an 'as' clause";
  if (TABLOID.test(headline)) return "a tabloid verb";
  if (banned(headline, [...REPORT_NEVER, ...REPORT_FPL]).length > 0) return "a banned phrase";
  const proper = (headline.match(/(?<!^)\b\p{Lu}[\p{L}'’-]+/gu) ?? [])
    .map((word) => word.replace(/['’]s$/u, ""))
    .filter((word) => !names.some((name) => name.includes(word)));
  if (proper.length > 0) return `a name the facts do not carry: ${proper[0]}`;
  return null;
}

/** The candidates that survive the desk, in the writer's order. */
export function survivors(candidates: readonly string[], names: readonly string[]): string[] {
  return candidates.filter((c) => strike(c, names) === null);
}

/** What the pun writer is handed: the lead match only, its names, its score and the moment that decided it. */
export function punBrief(desk: MatchDesk, story: string): string {
  const { match, events, opening } = desk;
  const goals = events.filter(isGoal);
  return [
    `THE STORY: ${story === "" ? opening : story}.`,
    `THE RESULT: ${match.home.name} ${match.fixture.homeScore}-${match.fixture.awayScore} ${match.away.name}. What decided it: ${opening}.`,
    `THE CLUBS: ${[match.home, match.away].map((c) => [c.name, ...c.shorts].join(" / ")).join("; ")}.`,
    `THE GOALS: ${goals.map((g) => `${g.man?.name ?? "own goal"} (${g.man === null ? "" : match[g.man.side].name}) ${g.phrases[0] ?? g.minute}${g.other === null ? "" : `, made by ${g.other.name}`}`).join("; ") || "none"}.`,
    `THE OTHER MEN IN THE STORY: ${desk.nominees.map((n) => `${n.man.name} (${match[n.man.side].name})`).join("; ")}.`,
  ].join("\n");
}
