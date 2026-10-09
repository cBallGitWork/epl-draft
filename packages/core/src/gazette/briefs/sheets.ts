import { SHEETS } from "../../config";
import type { Benching } from "../sheets/benchings";
import type { SheetChanges } from "../sheets/changes";
import type { Crossover } from "../sheets/crossovers";
import type { TeamFacts, TieFacts } from "../sheets/facts";
import type { StarterFlag } from "../sheets/flags";
import type { InForm } from "../sheets/form";
import { isBack, printName, type SheetMan } from "../sheets/sheet";

// The facts behind the team-news article, per head-to-head and per side. Every sentence the writer
// may print is already a line here; what a block may not be turned into is said beside it. No
// provider's sentence is carried: the writer copied them, their credits and their tense.

interface SheetsBrief {
  gameweek: number;
  ties: readonly TieFacts[];
  /** A club's name as the paper prints it, by FPL club id. */
  clubName: (clubId: number) => string;
  /** His club's match this gameweek in words, "at home to Everton"; null for none. */
  fixture: (clubId: number) => string | null;
}

export function buildSheetsBrief(brief: SheetsBrief): string {
  const sides = brief.ties.flatMap((tie) => [tie.home, tie.away]);
  const names = sides.map((team) => `${team.sheet.teamName} [${team.sheet.teamId}]`).join(", ");
  const allUnchanged = sides.every((team) => team.changes?.count === 0);
  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. The line-up deadline has passed.`,
    `THE SIDES (use these names EXACTLY; the id in brackets is what you return, never the name): ${names}`,
    allUnchanged ? "EVERY SIDE IS UNCHANGED from last gameweek, and the desk says so above the article. Do not say it again." : null,
    ...brief.ties.map((tie) => fixture(tie, brief, allUnchanged)),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function fixture(tie: TieFacts, brief: SheetsBrief, allUnchanged: boolean): string {
  return [
    `HEAD-TO-HEAD: ${tie.home.sheet.teamName} [${tie.home.sheet.teamId}] v ${tie.away.sheet.teamName} [${tie.away.sheet.teamId}]`,
    side(tie.home, brief, allUnchanged),
    side(tie.away, brief, allUnchanged),
    meets(tie, brief),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function side(team: TeamFacts, brief: SheetsBrief, allUnchanged: boolean): string {
  const man = (each: SheetMan) => `${printName(each.player)} (${each.slot}, ${where(each, brief)})`;
  const unchanged = team.changes?.count === 0;
  return [
    `SIDE ${team.sheet.teamName} [${team.sheet.teamId}]${team.formation === null ? "" : `, ${team.formation}`}`,
    `NAMED IN THE ELEVEN: ${team.sheet.starters.map(man).join("; ")}`,
    `BENCH: ${team.sheet.bench.length === 0 ? "nobody" : team.sheet.bench.map(man).join("; ")}`,
    unchanged ? null : changes(team.changes),
    debuts(team),
    ...notes(team, brief),
    // Unchanged is a clause at most, and after the news: it opened all four paragraphs of the first write.
    unchanged && !allUnchanged ? "UNCHANGED from last gameweek. Not the lead: the news first, and unchanged in a clause or not at all." : null,
    team.lastWrote === null ? null : `LAST GAMEWEEK YOU WROTE about this side: "${team.lastWrote}" Do not reuse its angle, its opening or its phrases.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** His club and its match: "Brighton & Hove Albion, away to Sunderland". */
function where(man: SheetMan, brief: SheetsBrief): string {
  const match = brief.fixture(man.player.clubId);
  return `${brief.clubName(man.player.clubId)}${match === null ? "" : `, ${match}`}`;
}

/** The side's news beyond its changes, weightiest first and only the few a paragraph can carry:
 *  a blank, the men who are out (together, as one fact), the doubts, form, a benching, and a man
 *  who might not start for his club. */
function notes(team: TeamFacts, brief: SheetsBrief): string[] {
  const of = <K extends StarterFlag["kind"]>(kind: K) => team.flags.filter((flag): flag is Extract<StarterFlag, { kind: K }> => flag.kind === kind);
  const out = of("out");
  const doubts = of("doubt");
  return [
    ...of("no-fixture").map((flag) => `NAMED, WITH NO MATCH: ${printName(flag.man.player)} (${flag.man.slot}). ${brief.clubName(flag.man.player.clubId)} do not play this gameweek.`),
    out.length === 0
      ? null
      : `NAMED BUT OUT THIS WEEKEND: ${out.map((flag) => `${printName(flag.man.player)} (${flag.man.slot}, ${where(flag.man, brief)}; ${flag.why}${flag.injury === null ? "" : `, ${flag.injury}`})`).join("; ")}. The side's biggest fact: lead with it, and say plainly that each man is out. No return date, no scan, never softened to a doubt.`,
    doubts.length === 0
      ? null
      : `NAMED BUT A DOUBT THIS WEEKEND: ${doubts.map((flag) => `${printName(flag.man.player)} (${flag.man.slot}, ${where(flag.man, brief)}${flag.injury === null ? "" : `; ${flag.injury}`})`).join("; ")}.`,
    ...team.form.map(inForm),
    ...team.benchings.map((benching) => benched(benching, team.changes?.count === 0)),
    ...of("may-not-start").map((flag) => `NAMED, BUT MIGHT NOT START FOR ${brief.clubName(flag.man.player.clubId).toUpperCase()}: ${printName(flag.man.player)} (${flag.man.slot}). Say he is named but might not start for his club, and no more.`),
  ]
    .filter((line) => line !== null)
    .slice(0, SHEETS.notes);
}

function changes(changes: SheetChanges | null): string {
  if (changes === null) return "FIRST SHEET: there is no earlier sheet to compare with. Do not write about changes or debuts.";
  const came = changes.in.map((each) => `${printName(each.man.player)} (${each.man.slot}, ${each.from === "bench" ? "from the bench" : "new to the squad since last gameweek"})`);
  const went = changes.out.map((each) => `${printName(each.man.player)} (${each.man.slot}, ${each.to === "bench" ? "dropped to the bench" : "no longer in the squad"})`);
  return [`CHANGES from last gameweek's sheet: ${changes.count}.`, `  IN: ${came.join(", ")}`, `  OUT: ${went.join(", ")}`].join("\n");
}

function debuts(team: TeamFacts): string | null {
  if (team.debuts === null) return null;
  return team.debuts.length === 0
    ? "DEBUTS: none. Do not use the word debut about this side."
    : `DEBUTS, a first start for this side: ${team.debuts.map((man) => printName(man.player)).join(", ")}`;
}

/** One span only: last time out when that holds a goal or an assist, else the gameweeks read. */
function benched(benching: Benching, unchanged: boolean): string {
  const { man, last } = benching;
  const lastTime = returns(last.goals, last.assists, 0);
  const span = lastTime !== "" ? `last time out: ${lastTime}` : `recently: ${returns(benching.goals, benching.assists, benching.cleanSheets)}`;
  return [
    `${benching.dropped ? "DROPPED, DESPITE HIS FORM" : "ON THE BENCH, DESPITE HIS FORM"}: ${printName(man.player)} (${man.slot}), ${span}.`,
    benching.dropped ? " He started last gameweek." : "",
    benching.again && !unchanged ? " He was on the bench last gameweek too." : "",
    " Say he is on the bench despite this, in one clause, and never why.",
  ].join("");
}

/** "2 goals, 1 assist, 1 clean sheet"; empty when there is nothing to count. */
function returns(goals: number, assists: number, cleanSheets: number): string {
  const count = (n: number, one: string, many: string) => (n > 0 ? `${n} ${n === 1 ? one : many}` : null);
  return [count(goals, "goal", "goals"), count(assists, "assist", "assists"), count(cleanSheets, "clean sheet", "clean sheets")].filter((each) => each !== null).join(", ");
}

function inForm(form: InForm): string {
  const did = returns(form.goals, form.assists, isBack(form.man.slot) ? form.cleanSheets : 0);
  const each = form.scoredEvery ? ", scoring in every game" : form.cleanEvery ? ", a clean sheet in every game" : "";
  return `IN FORM: ${printName(form.man.player)} (${form.man.slot}), recently: ${did}${each}.`;
}

function meets(tie: TieFacts, brief: SheetsBrief): string | null {
  if (tie.meets.length === 0) return null;
  const whose = (teamId: string) => (teamId === tie.home.sheet.teamId ? tie.home : tie.away).sheet.teamName;
  const names = (men: readonly SheetMan[]) => men.map((man) => `${printName(man.player)} (${man.slot}, ${brief.clubName(man.player.clubId)})`).join(", ");
  const lines = tie.meets.map((meet: Crossover) =>
    meet.kind === "facing"
      ? `- ${whose(meet.attackTeamId)}'s ${names(meet.attackers)} against ${whose(meet.defendTeamId)}'s ${names(meet.defenders)}, in ${brief.clubName(meet.fixture.homeClubId)} v ${brief.clubName(meet.fixture.awayClubId)}.`
      : `- Both sides start ${brief.clubName(meet.clubId)}'s defence: ${names(meet.home)} for ${tie.home.sheet.teamName}, ${names(meet.away)} for ${tie.away.sheet.teamName}.`,
  );
  return [
    "WHERE THE TWO SHEETS MEET ON THE PITCH. Weave the first of these into ONE of the two paragraphs as a clause of its own about its own two men, with the real match. Name the other side with its man, in the possessive, every time.",
    ...lines,
  ].join("\n");
}
