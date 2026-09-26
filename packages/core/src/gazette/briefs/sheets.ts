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
  /** Whether this round had numbers to rate the benches by; without them no benching is news. */
  projected: boolean;
}

export function buildSheetsBrief(brief: SheetsBrief): string {
  const sides = brief.ties.flatMap((tie) => [tie.home, tie.away]);
  const names = sides.map((team) => `${team.sheet.teamName} [${team.sheet.teamId}]`).join(", ");
  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. The line-up deadline has passed and every sheet below is locked.`,
    `THE SIDES (use these names EXACTLY; the id in brackets is what you return, never the name): ${names}`,
    "SOURCES STAY OFF THE PAGE. Nothing here is to be credited to anyone: never write projected, projection, prediction, predicted, model, FPL, Fantrax's news, or a percentage. Report it the way a reporter who knows the game would.",
    brief.projected ? null : "Nobody's place on the bench is news in itself this round. Do not say anyone should have started.",
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
    `STARTS: ${team.sheet.starters.map(man).join("; ")}`,
    `BENCH: ${team.sheet.bench.length === 0 ? "nobody" : team.sheet.bench.map(man).join("; ")}`,
    changes(team.changes),
    debuts(team),
    ...team.benchings.map(benched),
    ...team.flags.map((flag) => flagged(flag, brief)),
    ...team.form.map(inForm),
    team.lastWrote === null ? null : `LAST ROUND YOU WROTE about this side: "${team.lastWrote}" Do not reuse its angle, its opening or its phrases.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function changes(changes: SheetChanges | null): string {
  if (changes === null) return "FIRST SHEET: there is no earlier sheet to compare with. Do not write about changes or debuts.";
  if (changes.count === 0) return "UNCHANGED from last round. Say unchanged and never count the rounds.";
  const came = changes.in.map((each) => `${each.man.player.name} (${each.man.slot}, ${each.from === "bench" ? "from the bench" : "new to the squad since last round"})`);
  const went = changes.out.map((each) => `${each.man.player.name} (${each.man.slot}, ${each.to === "bench" ? "to the bench" : "no longer in the squad"})`);
  return [`CHANGES from last round's sheet: ${changes.count}.`, `  IN: ${came.join(", ")}`, `  OUT: ${went.join(", ")}`].join("\n");
}

function debuts(team: TeamFacts): string | null {
  if (team.debuts === null) return null;
  return team.debuts.length === 0
    ? "DEBUTS: none. Do not use the word debut about this side."
    : `DEBUTS, a first start for this side: ${team.debuts.map((man) => man.player.name).join(", ")}`;
}

function benched(benching: Benching): string {
  const { man, over } = benching;
  return [
    `ON THE BENCH, AND HE MIGHT HAVE STARTED: ${man.player.name} (${man.slot}) sits while ${over.player.name} (${over.slot}) starts.`,
    benching.best ? ` He had the strongest case of anyone this side holds in the ${man.slot} slot.` : "",
    benching.again ? " He sat last round too." : "",
    " You may say he might have started. Never say why, or on what.",
  ].join("");
}

function flagged(flag: StarterFlag, brief: SheetsBrief): string {
  const name = `${flag.man.player.name} (${flag.man.slot})`;
  const club = brief.clubName(flag.man.player.clubId);
  if (flag.kind === "no-fixture") return `STARTS WITH NO MATCH: ${name}. ${club} do not play this round.`;
  if (flag.kind === "unavailable") return `STARTS, BUT IS ${(STATUS[flag.man.player.status] ?? "a doubt").toUpperCase()}: ${name}. Say so plainly, and nothing about why.`;
  if (flag.kind === "may-not-start") return `STARTS, BUT MIGHT NOT START FOR ${club.toUpperCase()}: ${name}. Say he might not start for his club, and no more.`;
  const reported = flag.story.at === null ? "" : ` (reported ${DAY.format(flag.story.at)})`;
  return `STARTS, IN THE NEWS${reported}: ${name}. ${sentences(decoded(flag.story.content)).slice(0, SHEETS.newsSentences).join(" ")} Say what it means for this weekend in your own plain words, without quoting it.`;
}

function inForm(form: InForm): string {
  const where = form.starts ? "starts" : "on the bench";
  const did = [
    form.goals > 0 ? `${form.goals} ${form.goals === 1 ? "goal" : "goals"}` : null,
    form.assists > 0 ? `${form.assists} ${form.assists === 1 ? "assist" : "assists"}` : null,
    form.cleanSheets > 0 && form.man.slot !== "M" && form.man.slot !== "F" ? `${form.cleanSheets} ${form.cleanSheets === 1 ? "clean sheet" : "clean sheets"}` : null,
  ].filter((each) => each !== null);
  const every = form.scoredEvery ? `, scoring in each` : form.cleanEvery ? `, a clean sheet in each` : "";
  return `IN FORM: ${form.man.player.name} (${form.man.slot}, ${where}): ${did.join(", ")} in his last ${form.rounds} rounds${every}.`;
}

function meets(tie: TieFacts, brief: SheetsBrief): string {
  if (tie.meets.length === 0) return "WHERE THE SHEETS MEET: nowhere this round. Leave \"between\" empty.";
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
