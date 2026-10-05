import { ordinal } from "../../league/ordinal";
import type { TableLine } from "../../league/tableLines";
import { londonDate, londonTime } from "../../time";
import { availabilityWord } from "../briefs/predictionFacts";
import type { BoldCall, CallMan, LineRank, SeasonCalls, SeasonSide } from "./calls";

// Lawro's season brief: every call already made, in words. Withheld: every figure of ours, any man's points, how
// often a side finished anywhere, and anybody's line-up.

export interface SeasonSchedule {
  /** The first and last gameweeks played head to head, those inside with no fixtures, and those with two. */
  from: number;
  to: number;
  empty: readonly number[];
  doubles: readonly number[];
}

export function buildSeasonBrief(input: {
  calls: SeasonCalls;
  schedule: SeasonSchedule;
  /** The lines across the table as the league drew them (`tableLines`): what each cut is for. */
  lines: readonly TableLine[];
  locksAt: string;
  slotName: (slot: string) => string;
}): string {
  const { calls, schedule, slotName } = input;
  const side = (teamId: string) => calls.sides.find((each) => each.teamId === teamId);
  const name = (teamId: string) => side(teamId)?.name ?? teamId;
  // Semicolons between, because a side's name may hold a comma.
  const list = (teamIds: readonly string[]) => teamIds.map(name).join("; ");
  const of = calls.sides.length;
  const strength = (each: SeasonSide | undefined) => (each?.strongest == null ? "" : ` Their strength: ${slotName(each.strongest.slot)}, ${rankWords(each.strongest, of, true)}.`);
  const { title, out, spoon } = calls;
  const playoffs = calls.through.length + calls.playIn.length;

  return [
    `LAWRO'S SEASON PREDICTIONS. The draft is done and nobody has kicked a ball: line-ups lock for the first time at ${londonTime(input.locksAt)} on ${londonDate(input.locksAt)}. ${season(schedule, playoffs > 0)} Every call below is made already. You write the reasons, never the order: never move a side, never hedge a call, and never make the case for a side to finish anywhere else.`,
    `THE ${of} MANAGERS, named exactly as here; the id in brackets is what you return, never the name: ${calls.sides.map((each) => `${each.name} [${each.teamId}]`).join(", ")}.`,
    "WHAT YOU KNOW IS THE SQUADS AS DRAFTED, with no signing and no trade in them all season, which nobody in this league will manage. You do not know who starts or who is on anybody's bench, and no man has a figure you may print.",
    input.lines.length === 0 ? null : `THE LINES ACROSS THE TABLE, as the league drew them: ${input.lines.map((line) => `under ${ordinal(line.under)}, ${line.label}`).join("; ")}.`,
    `THE LEAGUE AS DRAFTED: ${["Nobody is clear at the top.", "One side is clear at the top.", "Two sides are clear at the top."][calls.clear] ?? ""}`,
    `THE TITLE: ${name(title.teamId)}, top.${strength(side(title.teamId))} The nearest to them: ${name(title.runnerUp)}, second, ${title.close ? "and it is close" : "and it is not close"}.`,
    playoffs === 0
      ? null
      : `THE PLAYOFFS, straight in: ${list(calls.through)}.${calls.playIn.length === 0 ? "" : ` Playing in for the last place: ${list(calls.playIn)}.`}${out === null ? "" : ` ${ordinal(playoffs + 1)} and missing out: ${name(out.teamId)}, ${out.close ? "and only just" : "and not by a little"}.`}`,
    `THE WOODEN SPOON: ${name(spoon.teamId)}, ${ordinal(of)}.${weakWords(side(spoon.teamId), of, slotName)} ${ordinal(of - 1)}: ${name(spoon.ninth)}, ${spoon.close ? "and it is close between them" : "and well clear of them"}.`,
    calls.bold === null ? null : `THE BOLD CALL: ${bold(calls.bold, name)}`,
    [`YOUR TABLE, top to bottom, one line a side in "table" in this order. The page prints each side's place beside your line, so never write it there.`, ...calls.sides.map((each) => sideBlock(each, of, slotName))].join("\n"),
  ]
    .filter((block): block is string => block !== null)
    .join("\n\n");
}

function season(schedule: SeasonSchedule, playoffs: boolean): string {
  const gaps = schedule.empty.length === 0 ? "" : `, none in gameweek ${schedule.empty.join(" or ")}`;
  const doubles = schedule.doubles.length === 0 ? "" : `, two each in gameweek ${schedule.doubles.join(" and ")}`;
  return `Head to head from gameweek ${schedule.from} to gameweek ${schedule.to}${gaps}${doubles}${playoffs ? ", then the playoffs" : ""}.`;
}

function sideBlock(side: SeasonSide, of: number, slotName: (slot: string) => string): string {
  const built = side.first ?? side.best;
  const facts = [
    built === null ? null : `- Built round: ${man(built)}${side.first === null ? "" : `, the first man they took, ${ordinal(side.first.overall ?? 0)} in the whole draft`}.`,
    side.weakness === null ? null : `- Weak spot: ${side.weakness.kind === "doubt" ? `${side.weakness.man.name} ${availabilityWord(side.weakness.man.availability)}` : `${slotName(side.weakness.slot)}, ${rankWords(side.weakness, of, false)}`}.`,
    side.weakness?.kind === "doubt" && side.best !== null && side.first !== null ? `- Their best man otherwise: ${man(side.best)}.` : null,
    `- Open the line on ${side.lead === "man" || side.weakness === null ? "the man they are built round" : "the weak spot"}.`,
  ];
  return [`${side.place}. ${side.name} [${side.teamId}]`, ...facts.filter((fact): fact is string => fact !== null)].join("\n");
}

function weakWords(side: SeasonSide | undefined, of: number, slotName: (slot: string) => string): string {
  const weakness = side?.weakness;
  if (weakness == null) return "";
  return weakness.kind === "doubt" ? ` ${weakness.man.name} ${availabilityWord(weakness.man.availability)}.` : ` Their weak spot: ${slotName(weakness.slot)}, ${rankWords(weakness, of, false)}.`;
}

function bold(call: BoldCall, name: (teamId: string) => string): string {
  if (call.kind === "first-misses") return `${name(call.teamId)} took the first man of the whole draft, ${man(call.man)}, and you have them missing the playoffs, ${ordinal(call.place)}.`;
  const among = call.among === "first" ? `the first ${call.of} men taken` : `the ${call.of} men taken in the first half of the draft`;
  return `${man(call.man)}, taken by ${name(call.teamId)} as the ${ordinal(call.man.overall ?? 0)} man of the draft, will outscore ${call.outscores} of ${among}.`;
}

function man(each: CallMan): string {
  return each.club === "" ? each.name : `${each.name} (${each.club})`;
}

/** A slot's standing among the league's sides, in words and never as a rank. */
function rankWords(line: LineRank, of: number, strongest: boolean): string {
  if (strongest) return line.rank === 1 ? "the best in the league" : line.rank <= 3 ? "among the best three in the league" : "the strongest part of the side";
  return line.rank === of ? "the weakest in the league" : line.rank > of - 3 ? "among the weakest three in the league" : "the weakest part of the side";
}
