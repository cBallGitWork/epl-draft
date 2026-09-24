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
  // One of the men who matter most against one of the round's hardest: Craig's "good narrative".
  const star = (side: PredictionSide) => side.hard !== null && keyNames(side).has(side.hard.name);
  const facts = [
    call.instinct === null ? null : `- T${index}-gut: ${gutFact(call.instinct, favourite, underdog)}`,
    ...sides.map(({ tag, side }) => (side.keyMen.length === 0 ? null : `- ${tag}-key: ${side.name}'s main men, best first: ${side.keyMen.map(described).join("; ")}.`)),
    ...sides.map(({ tag, side }) => (side.hard !== null && star(side) ? `- ${tag}-hard: ${hard(side.hard, side.name, true)}` : null)),
    ...sides.flatMap(({ tag, side }) => side.doubts.filter((man) => keyNames(side).has(man.name)).map((man) => `- ${tag}-doubt: ${doubt(man, side.name)}`)),
    ...sides.map(({ tag, side }) => (side.form === null ? null : `- ${tag}-form: ${form(side)}`)),
    ...sides.map(({ tag, side }) => (side.arrivals.length === 0 ? null : `- ${tag}-in: ${side.name} signed ${side.arrivals.join(", ")}, arriving for this round.`)),
    ...sides.flatMap(({ tag, side }) => side.doubts.filter((man) => !keyNames(side).has(man.name)).map((man) => `- ${tag}-doubt: ${doubt(man, side.name)}`)),
    ...sides.map(({ tag, side }) => (side.hard === null || star(side) ? null : `- ${tag}-hard: ${hard(side.hard, side.name, false)}`)),
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
  const one = (each: SquadMan["fixtures"][number]) =>
    `${each.home ? `home to ${each.opponent}` : `away at ${each.opponent}`}${each.standing === null ? "" : `, ${each.standing}`}`;
  if (man.fixtures.length === 0) return "no game this round";
  if (man.fixtures.length === 1) return one(man.fixtures[0]);
  return `two games, ${man.fixtures.map(one).join(" and ")}`;
}

/** A blank is its own fact; anything else is one of the round's hardest for his line, and the
 *  story of the tie when he is one of the side's main men. */
function hard(man: SquadMan, side: string, star: boolean): string {
  if (man.fixtures.length === 0) return `${man.name} of ${side} has no game this round.`;
  const hardest = `${fixture(man)}, one of the hardest this round for his line. Say a hard one, never a rank.`;
  return star ? `${side}'s ${man.name}, one of their main men, is ${hardest} A big man against a hard one is often the story of a tie.` : `${man.name} of ${side}: ${hardest}`;
}

/** Whose man he is, every time: a doubt read without its owner was once printed against the wrong side. */
function doubt(man: SquadMan, side: string): string {
  return `${side}'s ${man.name} (${man.club}) ${state(man)}.`;
}

/** How likely he is to play, in words and never FPL's figure (Craig: "dont say percentages"), and
 *  what is wrong with him, from FPL's note with its figure taken out. */
function state(man: SquadMan): string {
  const { availability } = man;
  const note = availability.news.replace(/\s*-?\s*\d+\s*% chance of playing/giu, "").replace(/\s+-\s+/gu, ", ").trim();
  return `${availabilityWord(availability)}${note === "" ? "" : `. FPL's note: ${note}`}`;
}

/** FPL publishes 0, 25, 50, 75 or 100; the brief says what those mean. */
function availabilityWord(availability: SquadMan["availability"]): string {
  if (availability.state === "injured" || availability.state === "suspended" || availability.state === "unavailable") {
    return `is ${availability.state}`;
  }
  if (availability.out) return "is out";
  if (availability.chance === null || availability.chance === 50) return "is a doubt";
  return availability.chance > 50 ? "is a slight doubt" : "is a big doubt";
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
