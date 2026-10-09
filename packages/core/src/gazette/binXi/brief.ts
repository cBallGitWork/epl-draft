import { capital, howMany, listed } from "../../format";
import { storylinesBlock } from "../briefs/storylines";
import { pts } from "../matchups/stories";
import { numeral } from "../reports/minutes";
import type { StoryThread } from "../ledger";
import type { BinMan, BinXi } from "./select";

// What the Bin XI's writer is told: the eleven and the bench grouped by club, each man's week in
// words, how he came to be unowned, and the one comparison the desk makes. xG and xA stay out: the
// model copies a brief's labels, and they print only as figures in the desk's box.

/** One of his club's matches in the period, from his club's side. */
export interface BinMatch {
  opponent: string;
  home: boolean;
  scored: number;
  conceded: number;
}

/** The desk's extras on a man the selection never reads. Null is a read that did not carry it. */
export interface BinExtras {
  cleanSheet: boolean;
  saves: number | null;
  tacklesWon: number | null;
  interceptions: number | null;
  clearances: number | null;
}

export interface BinBriefInput {
  gameweek: number;
  side: BinXi;
  /** Each of the league's sides' points this period; null where Fantrax gave none. */
  sides: readonly (number | null)[];
  club: (clubId: number) => string;
  matches: (clubId: number) => readonly BinMatch[];
  extras: (man: BinMan) => BinExtras;
  /** Positive facts about his place in the league, already worded: "dropped by X in gameweek 3". */
  history: (man: BinMan) => readonly string[];
  /** Nobody drafted him, once a draft has completed. */
  undrafted: (man: BinMan) => boolean;
  /** "injured", "suspended", "a doubt", or null for fit. */
  status: (man: BinMan) => string | null;
  /** FPL codes of last week's Bin XI. */
  lastWeek: ReadonlySet<number>;
  /** Clubs with no match in the period, so nobody reads an absence as a snub. */
  blanked: readonly string[];
  threads: readonly StoryThread[];
}

/** The desk's standfirst: what the piece is, and the one comparison, in the house's numerals. */
export function binStandfirst(gameweek: number, total: number, sides: readonly (number | null)[]): string {
  const { fewer, more, scored } = beaten(total, sides);
  const against =
    scored === 0 ? ""
    : fewer === scored ? ", more than any side in the league"
    : more === scored ? ", fewer than every side in the league"
    : fewer === 0 ? ", level with the league's lowest side"
    : `, more than ${numeral(fewer)} of the league's ${numeral(scored)} sides`;
  return `The best eleven nobody in the league has scored ${pts(total)} in gameweek ${gameweek}${against}.`;
}

/** How many of the sides Fantrax scored finished below the total, and how many above it. */
function beaten(total: number, sides: readonly (number | null)[]): { fewer: number; more: number; scored: number } {
  const scored = sides.filter((points): points is number => points !== null);
  return { fewer: scored.filter((points) => points < total).length, more: scored.filter((points) => points > total).length, scored: scored.length };
}

export function buildBinBrief(input: BinBriefInput): string {
  const { side } = input;
  const { fewer, scored } = beaten(side.total, input.sides);
  const comparison = scored === 0 ? "" : ` ${fewer} of the league's ${howMany(scored, "side")} scored fewer.`;
  return [
    `THE BIN XI, gameweek ${input.gameweek}: the best eleven men nobody in the league has, lining up ${side.shape}. The side, each man's points and the key stats are printed beside your column. You write the case for it.`,
    `THE DESK'S NUMBER: the eleven scored ${pts(side.total)} between them.${comparison}`,
    ["THE ELEVEN, by club:", ...byClub(side.xi, input)].join("\n"),
    side.bench.length === 0
      ? null
      : ["THE BENCH, picked for what they did without the goals or assists to show for it:", ...byClub(side.bench, input)].join("\n"),
    undraftedLine([...side.xi, ...side.bench], input.undrafted),
    input.blanked.length === 0 ? null : `NO MATCH THIS GAMEWEEK: ${input.blanked.join(", ")}.`,
    storylinesBlock(input.threads),
  ]
    .filter((block): block is string => block !== null)
    .join("\n\n");
}

/** Said once rather than on every man, or the column repeats it. */
function undraftedLine(men: readonly BinMan[], undrafted: (man: BinMan) => boolean): string | null {
  const nobody = men.filter(undrafted);
  if (nobody.length === 0) return null;
  return nobody.length === men.length ? "UNDRAFTED: every man above." : `UNDRAFTED: ${sentence(nobody.map((man) => man.name))}.`;
}

function byClub(men: readonly BinMan[], input: BinBriefInput): string[] {
  const clubs = [...new Set(men.map((man) => man.clubId))];
  return clubs.flatMap((clubId) => [
    `${input.club(clubId)} (${input.matches(clubId).map(result).join("; ") || "no match"}):`,
    ...men.filter((man) => man.clubId === clubId).map((man) => `- ${line(man, input)}`),
  ]);
}

function result(match: BinMatch): string {
  const verb = match.scored > match.conceded ? "beat" : match.scored < match.conceded ? "lost to" : "drew with";
  return `${verb} ${match.opponent} ${match.scored}-${match.conceded} ${match.home ? "at home" : "away"}`;
}

function line(man: BinMan, input: BinBriefInput): string {
  const extras = input.extras(man);
  const did = [
    counted(man.goals, "a goal", "goals"),
    counted(man.assists, "an assist", "assists"),
    extras.cleanSheet ? "a clean sheet" : null,
    counted(extras.saves, "a save", "saves"),
  ].filter((part): part is string => part !== null);
  const play = [
    shots(man),
    counted(man.chancesCreated, "a chance created", "chances created"),
    counted(extras.tacklesWon, "a tackle won", "tackles won"),
    counted(extras.interceptions, "an interception", "interceptions"),
    counted(extras.clearances, "a clearance", "clearances"),
  ].filter((part): part is string => part !== null);
  const status = input.status(man);
  return [
    `${man.name}, ${input.club(man.clubId)}, ${man.position}: ${pts(man.points)}. ${howMany(man.minutes, "minute")}${man.started ? "" : " off the bench"}.`,
    did.length === 0 ? null : `${sentence(did)}.`,
    play.length === 0 ? null : `${sentence(play)}.`,
    ...input.history(man).map((fact) => `${fact}.`),
    input.lastWeek.has(man.code) ? "In last week's Bin XI too." : null,
    status === null ? null : `Now ${status}.`,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");
}

/** "a goal", "2 goals"; nothing for none, and nothing where the read did not carry it. */
function counted(value: number | null, one: string, many: string): string | null {
  return value === null || value === 0 ? null : value === 1 ? one : `${value} ${many}`;
}

function shots(man: BinMan): string | null {
  const taken = counted(man.shots, "a shot", "shots");
  return taken === null || !man.shotsOnTarget ? taken : `${taken}, ${man.shotsOnTarget} on target`;
}

function sentence(parts: readonly string[]): string {
  return capital(listed(parts));
}
