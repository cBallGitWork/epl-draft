import { ordinal } from "../../league/ordinal";
import { londonDate, londonTime } from "../../time";
import { availabilityWord } from "../briefs/predictionFacts";
import type { CallMan, LineRank, SeasonCalls, SeasonSide } from "./calls";

// Lawro's power rankings brief: the squads as drafted in the desk's order, in words. Withheld: every figure of ours,
// any man's points, how the order was reached, and anything about how the season ends.

export function buildSeasonBrief(input: { calls: SeasonCalls; locksAt: string; slotName: (slot: string) => string }): string {
  const { calls, slotName } = input;
  const of = calls.sides.length;
  const [top, bottom] = [calls.sides[0], calls.sides[of - 1]];
  const strength = top.strongest === null ? "" : ` Its strength: ${slotName(top.strongest.slot)}, ${rankWords(top.strongest, of, true)}.`;
  const shape = ["Nobody is clear of the rest.", "One squad is clear of the rest.", "Two squads are clear of the rest."][calls.clear] ?? "";

  return [
    `LAWRO'S POWER RANKINGS. The draft is done and nobody has kicked a ball: line-ups lock for the first time at ${londonTime(input.locksAt)} on ${londonDate(input.locksAt)}. You rank the ${of} squads as drafted, strongest first, as they stand today. The order below is made already: you write the reasons, never the order, and you never move a side.`,
    `THE ${of} MANAGERS, named exactly as here; the id in brackets is what you return, never the name: ${calls.sides.map((each) => `${each.name} [${each.teamId}]`).join(", ")}.`,
    "WHAT YOU KNOW IS THE SQUADS AS DRAFTED, with nobody signed or traded yet. You do not know who starts or who is on anybody's bench, and no man has a figure you may print.",
    `THE SQUADS AS DRAFTED, for your opening: ${shape} The strongest squad: ${top.name}.${strength} The weakest: ${bottom.name}.${weakWords(bottom, of, slotName)}`,
    [`YOUR RANKINGS, strongest first, one line a side in "table" in this order. The page prints each side's number beside your line, so never write it there. The words below are the desk's labels and never yours: several sides share one, so say each weak spot your own way, a different way every time.`, ...calls.sides.map((each) => sideBlock(each, of, slotName))].join("\n"),
  ].join("\n\n");
}

function sideBlock(side: SeasonSide, of: number, slotName: (slot: string) => string): string {
  const built = side.first ?? side.best;
  const facts = [
    built === null ? null : `- Built round: ${man(built)}${side.first === null ? "" : `, the first man they took, ${ordinal(side.first.overall ?? 0)} in the whole draft`}.`,
    side.weakness === null ? null : `- Weak spot: ${side.weakness.kind === "doubt" ? `${side.weakness.man.name} ${availabilityWord(side.weakness.man.availability)}` : `${slotName(side.weakness.slot)}, ${rankWords(side.weakness, of, false)}`}.`,
    side.weakness?.kind === "doubt" && side.weakness.man === side.first && side.best !== null ? `- Their best man otherwise: ${man(side.best)}.` : null,
    `- Open the line on ${side.lead === "man" || side.weakness === null ? "the man they are built round" : "the weak spot"}.`,
  ];
  return [`${side.place}. ${side.name} [${side.teamId}]`, ...facts.filter((fact): fact is string => fact !== null)].join("\n");
}

function weakWords(side: SeasonSide, of: number, slotName: (slot: string) => string): string {
  const weakness = side.weakness;
  if (weakness === null) return "";
  return weakness.kind === "doubt" ? ` ${weakness.man.name} ${availabilityWord(weakness.man.availability)}.` : ` Its weak spot: ${slotName(weakness.slot)}, ${rankWords(weakness, of, false)}.`;
}

function man(each: CallMan): string {
  return each.club === "" ? each.name : `${each.name} (${each.club})`;
}

/** A slot's standing among the league's sides, in words and never as a rank. */
function rankWords(line: LineRank, of: number, strongest: boolean): string {
  if (strongest) return line.rank === 1 ? "the best in the league" : line.rank <= 3 ? "among the best three in the league" : "the strongest part of the side";
  return line.rank === of ? "the weakest in the league" : line.rank > of - 3 ? "among the weakest three in the league" : "the weakest part of the side";
}
