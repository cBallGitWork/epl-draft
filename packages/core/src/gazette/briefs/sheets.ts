import type { Benching } from "../sheets/benchings";
import type { SheetChanges } from "../sheets/changes";
import type { Crossover } from "../sheets/crossovers";
import type { TeamFacts, TieFacts } from "../sheets/facts";
import type { StarterFlag } from "../sheets/flags";
import type { InForm } from "../sheets/form";
import { SHEETS } from "../../config";
import { sentences } from "../predictions/prose";

/** The listing in a reporter's word, never its source's. */
const STATUS: Record<string, string> = { d: "a doubt", i: "injured", s: "suspended", u: "unavailable", n: "unavailable" };

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });
import type { SheetMan } from "../sheets/sheet";

// The facts behind the team-news article, per head-to-head and per side. Every sentence the writer
// may print is already a line here; what a block may not be turned into is said beside it.

export interface SheetsBrief {
  gameweek: number;
  ties: readonly TieFacts[];
  /** A club's name as the paper prints it, by FPL club id. */
  clubName: (clubId: number) => string;
}

export function buildSheetsBrief(brief: SheetsBrief): string {
  const sides = brief.ties.flatMap((tie) => [tie.home, tie.away]);
  const names = sides.map((team) => `${team.sheet.teamName} [${team.sheet.teamId}]`).join(", ");
  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. The line-up deadline has passed and every sheet below is locked.`,
    `THE SIDES (use these names EXACTLY; the id in brackets is what you return, never the name): ${names}`,
    "SOURCES STAY OFF THE PAGE. Nothing here is to be credited to anyone: never write projected, projection, prediction, predicted, model, FPL, Fantrax's news, or a percentage. Report it the way a reporter who knows the game would.",
    ...brief.ties.map((tie) => fixture(tie, brief)),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function fixture(tie: TieFacts, brief: SheetsBrief): string {
  return [
    `HEAD-TO-HEAD: ${tie.home.sheet.teamName} [${tie.home.sheet.teamId}] v ${tie.away.sheet.teamName} [${tie.away.sheet.teamId}]`,
    side(tie.home, brief),
    side(tie.away, brief),
    meets(tie, brief),
  ].join("\n\n");
}

function side(team: TeamFacts, brief: SheetsBrief): string {
  const man = (each: SheetMan) => `${each.player.name} (${each.slot}, ${brief.clubName(each.player.clubId)})`;
  return [
    `SIDE ${team.sheet.teamName} [${team.sheet.teamId}]${team.formation === null ? "" : `, ${team.formation}`}`,
    `NAMED IN THE ELEVEN: ${team.sheet.starters.map(man).join("; ")}`,
    `BENCH: ${team.sheet.bench.length === 0 ? "nobody" : team.sheet.bench.map(man).join("; ")}`,
    changes(team.changes),
    debuts(team),
    ...notes(team, brief),
    team.lastWrote === null ? null : `LAST GAMEWEEK YOU WROTE about this side: "${team.lastWrote}" Do not reuse its angle, its opening or its phrases.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** The side's news beyond its changes, weightiest first and only the few a paragraph can carry:
 *  a blank, then form, fitness, a benching, and a man who might not start for his club. */
function notes(team: TeamFacts, brief: SheetsBrief): string[] {
  const flags = (kind: StarterFlag["kind"]) => team.flags.filter((flag) => flag.kind === kind).map((flag) => flagged(flag, brief));
  return [
    ...flags("no-fixture"),
    ...team.form.map(inForm),
    ...flags("news"),
    ...flags("unavailable"),
    ...team.benchings.map(benched),
    ...flags("may-not-start"),
  ].slice(0, SHEETS.notes);
}

function changes(changes: SheetChanges | null): string {
  if (changes === null) return "FIRST SHEET: there is no earlier sheet to compare with. Do not write about changes or debuts.";
  if (changes.count === 0) return "UNCHANGED from last gameweek. Say unchanged and never count the gameweeks.";
  const came = changes.in.map((each) => `${each.man.player.name} (${each.man.slot}, ${each.from === "bench" ? "from the bench" : "new to the squad since last gameweek"})`);
  const went = changes.out.map((each) => `${each.man.player.name} (${each.man.slot}, ${each.to === "bench" ? "dropped to the bench" : "no longer in the squad"})`);
  return [`CHANGES from last gameweek's sheet: ${changes.count}.`, `  IN: ${came.join(", ")}`, `  OUT: ${went.join(", ")}`].join("\n");
}

function debuts(team: TeamFacts): string | null {
  if (team.debuts === null) return null;
  return team.debuts.length === 0
    ? "DEBUTS: none. Do not use the word debut about this side."
    : `DEBUTS, a first start for this side: ${team.debuts.map((man) => man.player.name).join(", ")}`;
}

function benched(benching: Benching): string {
  const { man, last } = benching;
  const lastTime = returns(last.goals, last.assists, BACK.has(man.slot) && last.minutes > 0 ? last.cleanSheets : 0);
  const over = returns(benching.goals, benching.assists, benching.cleanSheets);
  return [
    `${benching.dropped ? "DROPPED, DESPITE HIS FORM" : "BENCHED, DESPITE HIS FORM"}: ${man.player.name} (${man.slot}) is ${benching.dropped ? "dropped to the bench after starting last gameweek" : "on the bench"}.`,
    lastTime === "" ? "" : ` Last time out: ${lastTime}.`,
    over === "" ? "" : ` Over his last ${benching.rounds} gameweeks: ${over}.`,
    benching.again ? " He was benched last gameweek too." : "",
    " Say he is benched despite that, and never why.",
  ].join("");
}

/** "2 goals, 1 assist, 1 clean sheet"; empty when there is nothing to count. */
function returns(goals: number, assists: number, cleanSheets: number): string {
  const count = (n: number, one: string, many: string) => (n > 0 ? `${n} ${n === 1 ? one : many}` : null);
  return [count(goals, "goal", "goals"), count(assists, "assist", "assists"), count(cleanSheets, "clean sheet", "clean sheets")].filter((each) => each !== null).join(", ");
}

const BACK = new Set(["G", "D"]);

function flagged(flag: StarterFlag, brief: SheetsBrief): string {
  const name = `${flag.man.player.name} (${flag.man.slot})`;
  const club = brief.clubName(flag.man.player.clubId);
  if (flag.kind === "no-fixture") return `NAMED, WITH NO MATCH: ${name}. ${club} do not play this gameweek.`;
  if (flag.kind === "unavailable") return `NAMED, BUT IS ${(STATUS[flag.man.player.status] ?? "a doubt").toUpperCase()}: ${name}. Say so plainly, and nothing about why.`;
  if (flag.kind === "may-not-start") return `NAMED, BUT MIGHT NOT START FOR ${club.toUpperCase()}: ${name}. Say he is named but might not start for ${club}, and no more.`;
  const reported = flag.story.at === null ? "" : ` (reported ${DAY.format(flag.story.at)})`;
  const listed = flag.man.player.status === "a" ? "AND IN THE NEWS" : `BUT ${(STATUS[flag.man.player.status] ?? "a doubt").toUpperCase()}, IN THE NEWS`;
  return `NAMED, ${listed}${reported}: ${name}. ${sentences(decoded(flag.story.content)).slice(0, SHEETS.newsSentences).join(" ")} Say what it means for this weekend in your own plain words, without quoting it.`;
}

function inForm(form: InForm): string {
  const did = returns(form.goals, form.assists, BACK.has(form.man.slot) ? form.cleanSheets : 0);
  const every = form.scoredEvery ? `, scoring in each` : form.cleanEvery ? `, a clean sheet in each` : "";
  return `IN FORM: ${form.man.player.name} (${form.man.slot}, named): ${did} in his last ${form.rounds} gameweeks${every}.`;
}

function meets(tie: TieFacts, brief: SheetsBrief): string {
  if (tie.meets.length === 0) return "WHERE THE SHEETS MEET: nowhere this gameweek. Leave \"between\" empty.";
  const whose = (teamId: string) => (teamId === tie.home.sheet.teamId ? tie.home : tie.away).sheet.teamName;
  const names = (men: readonly SheetMan[]) => men.map((man) => `${man.player.name} (${man.slot})`).join(", ");
  const lines = tie.meets.map((meet: Crossover) =>
    meet.kind === "facing"
      ? `- ${whose(meet.attackTeamId)}'s ${names(meet.attackers)} against ${whose(meet.defendTeamId)}'s ${names(meet.defenders)}, in ${brief.clubName(meet.fixture.homeClubId)} v ${brief.clubName(meet.fixture.awayClubId)}.`
      : `- Both start from ${brief.clubName(meet.clubId)}'s ${meet.kind}: ${names(meet.home)} for ${tie.home.sheet.teamName}, ${names(meet.away)} for ${tie.away.sheet.teamName}.`,
  );
  return ["WHERE THE SHEETS MEET, for \"between\" (one sentence, the first of these unless another reads plainer):", ...lines].join("\n");
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };

/** Fantrax's news keeps its HTML entities; a brief is plain text, and "&amp;" would be copied. */
function decoded(text: string): string {
  return text.replace(/&(?:amp|quot|#39|apos|lt|gt|nbsp);/g, (entity) => ENTITIES[entity] ?? entity);
}
