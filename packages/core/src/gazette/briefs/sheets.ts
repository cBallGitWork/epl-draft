import type { Benching } from "../sheets/benchings";
import type { SheetChanges } from "../sheets/changes";
import type { Crossover } from "../sheets/crossovers";
import type { TeamFacts, TieFacts } from "../sheets/facts";
import type { StarterFlag } from "../sheets/flags";
import type { SheetMan } from "../sheets/sheet";

// The facts behind the team-news article, per head-to-head and per side. Every sentence the writer
// may print is already a line here; what a block may not be turned into is said beside it.

export interface SheetsBrief {
  gameweek: number;
  ties: readonly TieFacts[];
  /** A club's name as the paper prints it, by FPL club id. */
  clubName: (clubId: number) => string;
  /** Whether the sister model's projections covered this round; without them no benching is news. */
  projected: boolean;
}

export function buildSheetsBrief(brief: SheetsBrief): string {
  const sides = brief.ties.flatMap((tie) => [tie.home, tie.away]);
  const names = sides.map((team) => `${team.sheet.teamName} [${team.sheet.teamId}]`).join(", ");
  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. The lineup deadline has passed and every sheet below is locked.`,
    `THE SIDES (use these names EXACTLY; the id in brackets is what you return, never the name): ${names}`,
    brief.projected ? null : "No projections cover this round, so nobody's place on the bench is news in itself. Do not say anyone should have started.",
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
    team.lastWrote === null ? null : `LAST ROUND YOU WROTE about this side: "${team.lastWrote}" Do not reuse its angle, its opening or its phrases.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function changes(changes: SheetChanges | null): string {
  if (changes === null) return "FIRST SHEET: there is no earlier sheet to compare with. Do not write about changes or debuts.";
  if (changes.count === 0) {
    return changes.unchangedFor > 2
      ? `UNCHANGED: the same eleven for the ${ordinal(changes.unchangedFor)} round running.`
      : "UNCHANGED: the same eleven as last round.";
  }
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
    `BENCHED ABOVE A STARTER: ${man.player.name} (${man.slot}) is on the bench, projected above ${over.player.name} (${over.slot}), who starts.`,
    benching.best ? ` He is the side's highest-projected ${man.slot}.` : "",
    benching.again ? " He was on the bench last round too." : "",
    " State the order only, never a projected figure.",
  ].join("");
}

const STATUS: Record<string, string> = { d: "doubtful", i: "injured", s: "suspended", u: "unavailable", n: "unavailable" };

function flagged(flag: StarterFlag, brief: SheetsBrief): string {
  const name = `${flag.man.player.name} (${flag.man.slot})`;
  if (flag.kind === "no-fixture") return `STARTS WITH NO MATCH: ${name}. ${brief.clubName(flag.man.player.clubId)} do not play this round.`;
  if (flag.kind === "not-predicted") return `STARTS, NOT IN HIS CLUB'S PREDICTED ELEVEN: ${name}, left out of the predicted eleven for ${brief.clubName(flag.man.player.clubId)}.`;
  const status = STATUS[flag.man.player.status] ?? "a doubt";
  // Only a doubt's chance is news: an injured or suspended man's is always nought.
  const chance = flag.chance === null || flag.man.player.status !== "d" ? "" : `, ${flag.chance}% chance of playing`;
  return `STARTS, FPL LISTS HIM ${status.toUpperCase()}: ${name}${chance}. FPL's words: ${flag.news === "" ? "none given" : `"${flag.news}"`}`;
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

function ordinal(n: number): string {
  const words = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
  return words[n] ?? `${n}th`;
}
