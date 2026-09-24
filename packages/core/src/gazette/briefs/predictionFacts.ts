import { PREDICTIONS } from "../../config";
import type { PredictionCall } from "../predictions/pick";
import type { PredictionSide, SquadMan } from "../predictions/sides";

// One tie's facts for Lawro, worded and ranked. Squad-level only, and no figure of ours: the
// order of a side's men is our model's reading and is never printed.

/** The facts that matter most first, each with an id, capped for the tie. */
export function tieFacts(index: number, home: PredictionSide, away: PredictionSide, call: PredictionCall): string[] {
  const favourite = call.callsTeamId === home.teamId ? (call.instinct === null ? home : away) : call.instinct === null ? away : home;
  const underdog = favourite === home ? away : home;
  const sides = [
    { tag: `T${index}H`, side: home },
    { tag: `T${index}A`, side: away },
  ];
  const keyNames = (side: PredictionSide) => new Set(side.keyMen.map((man) => man.name));
  const facts = [
    call.instinct === null ? null : `- T${index}-gut: ${gutFact(call.instinct, favourite, underdog)}`,
    ...sides.map(({ tag, side }) => (side.keyMen.length === 0 ? null : `- ${tag}-key: ${side.name}'s main men, best first: ${side.keyMen.map(described).join("; ")}.`)),
    ...sides.flatMap(({ tag, side }) => side.doubts.filter((man) => keyNames(side).has(man.name)).map((man) => `- ${tag}-doubt: ${doubt(man, side.name)}`)),
    ...sides.map(({ tag, side }) => (side.form === null ? null : `- ${tag}-form: ${form(side)}`)),
    ...sides.map(({ tag, side }) => (side.arrivals.length === 0 ? null : `- ${tag}-in: ${side.name} signed ${side.arrivals.join(", ")}, arriving for this round.`)),
    ...sides.flatMap(({ tag, side }) => side.doubts.filter((man) => !keyNames(side).has(man.name)).map((man) => `- ${tag}-doubt: ${doubt(man, side.name)}`)),
    ...sides.map(({ tag, side }) => (side.hard === null ? null : `- ${tag}-hard: ${hard(side.hard, side.name)}`)),
  ];
  return facts.filter((fact): fact is string => fact !== null).slice(0, PREDICTIONS.factsPerTie);
}

/** The reason he goes against the favourite, in the brief's facts and nothing else. */
function gutFact(instinct: NonNullable<PredictionCall["instinct"]>, favourite: PredictionSide, underdog: PredictionSide): string {
  if (instinct === "doubt" && favourite.best !== null) return `${favourite.name}'s best man, ${described(favourite.best)}, ${state(favourite.best)}.`;
  if (instinct === "liverpool") {
    const men = (side: PredictionSide) => `${side.liverpool}${side.liverpool === 0 ? "" : ` (${side.liverpoolMen.join(", ")})`}`;
    return `Liverpool men in the squad: ${underdog.name} ${men(underdog)}, ${favourite.name} ${men(favourite)}. You played for Liverpool, and you may admit the bias.`;
  }
  const line = (side: PredictionSide) => [...side.backLine].sort((a, b) => (a.ease ?? 99) - (b.ease ?? 99)).slice(0, 4).map((man) => `${man.name} ${fixture(man)}`).join(", ");
  return `${underdog.name}'s back line has the kinder round: ${line(underdog)}. ${favourite.name}'s: ${line(favourite)}.`;
}

/** A man as the brief names him: positions, club and this round's fixture. */
function described(man: SquadMan): string {
  return `${man.name} (${man.positions.join(",")}, ${man.club}, ${fixture(man)})`;
}

function fixture(man: SquadMan): string {
  const one = (each: SquadMan["fixtures"][number]) => (each.home ? `home to ${each.opponent}` : `away at ${each.opponent}`);
  if (man.fixtures.length === 0) return "no game this round";
  if (man.fixtures.length === 1) return one(man.fixtures[0]);
  return `two games, ${man.fixtures.map(one).join(" and ")}`;
}

/** A blank is its own fact; anything else is one of the round's hardest for his line. */
function hard(man: SquadMan, side: string): string {
  if (man.fixtures.length === 0) return `${man.name} of ${side} has no game this round.`;
  return `${man.name} of ${side}: ${fixture(man)}, one of the hardest this round for his line. Say a hard one, never a rank.`;
}

/** Whose man he is, every time: a doubt read without its owner was once printed against the wrong side. */
function doubt(man: SquadMan, side: string): string {
  return `${side}'s ${man.name} (${man.club}) ${state(man)}.`;
}

/** FPL's own state and figure, with its note; no figure is FPL giving none, not a nought. */
function state(man: SquadMan): string {
  const { availability } = man;
  const word = availability.out ? `is ${availability.state === "doubt" ? "out" : availability.state}` : "is a doubt";
  const chance = availability.chance === null ? "" : `, and FPL gives him ${availability.chance} per cent`;
  const note = availability.news === "" ? "" : `. FPL's note: ${availability.news.replace(/\s+-\s+/g, ", ")}`;
  return `${word}${chance}${note}`;
}

function form(side: PredictionSide): string {
  const f = side.form as NonNullable<PredictionSide["form"]>;
  const record = `${side.name} are ${ordinal(f.rank)}: won ${f.won}, drawn ${f.drawn}, lost ${f.lost}, ${f.points} points.`;
  const last =
    f.last === null
      ? ""
      : ` Gameweek ${f.last.gameweek}: ${f.last.result === "W" ? "beat" : f.last.result === "L" ? "lost to" : "drew with"} ${f.last.opponent} ${f.last.pointsFor}-${f.last.pointsAgainst}.`;
  return `${record}${last}${f.run === "" ? "" : ` Form, oldest first: ${f.run}.`}`;
}

function ordinal(rank: number): string {
  const tens = rank % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][rank % 10] ?? "th";
  return `${rank}${suffix}`;
}
