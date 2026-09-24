import { PREDICTIONS } from "../../config";
import type { PredictionCall } from "../predictions/pick";
import type { PredictionSide, SquadMan } from "../predictions/sides";

// One tie's facts for Lawro, worded and ranked. Squad-level only, and no figure of ours: the
// order of a side's men is our model's reading and is never printed.

/** The tie's one story first, then a man for each side the story leaves out, their form, and one
 *  more: a pick that gives a side nothing, a signing, or a doubt. Three men, never a roll call. */
export function tieFacts(index: number, home: PredictionSide, away: PredictionSide, call: PredictionCall): string[] {
  const favourite = call.callsTeamId === home.teamId ? (call.instinct === null ? home : away) : call.instinct === null ? away : home;
  const underdog = favourite === home ? away : home;
  const sides = [
    { tag: `T${index}H`, side: home },
    { tag: `T${index}A`, side: away },
  ];
  const story = call.instinct === null ? storyOf([favourite, underdog]) : null;
  const covered = new Set<PredictionSide>(
    story !== null ? [story.side] : call.instinct === "doubt" ? [favourite] : call.instinct === "liverpool" ? [home, away] : call.instinct === "defence" ? [home, away] : [],
  );
  const used = new Set(story === null ? [] : [story.man.name]);
  const fresh = (men: readonly (SquadMan | null)[]) => men.find((man): man is SquadMan => man !== null && !used.has(man.name)) ?? null;
  const take = (man: SquadMan | null) => {
    if (man !== null) used.add(man.name);
    return man;
  };
  const facts = [
    call.instinct === null ? null : `- T${index}-gut: ${gutFact(call.instinct, favourite, underdog)}`,
    story === null ? null : `- T${index}-story: ${story.text}`,
    ...sides.map(({ tag, side }) => {
      const man = covered.has(side) ? null : take(fresh(side.keyMen));
      return man === null ? null : `- ${tag}-man: ${described(man)}, for ${side.name}.`;
    }),
    ...sides.map(({ tag, side }) => (side.form === null ? null : `- ${tag}-form: ${form(side)}`)),
    // Liverpool men are the whole story of a Liverpool call: nobody else gets a line.
    call.instinct === "liverpool" ? null : extra(sides, fresh),
  ];
  return facts.filter((fact): fact is string => fact !== null).slice(0, PREDICTIONS.factsPerTie);
}

/** What the tie is about, favourite first: one of a side's main men against one of the round's
 *  hardest (Craig's "good narrative"), else a main man in doubt; null when neither. */
function storyOf(sides: readonly PredictionSide[]): { side: PredictionSide; man: SquadMan; text: string } | null {
  for (const side of sides) {
    const star = side.hard !== null && side.hard.fixtures.length > 0 && side.keyMen.some((man) => man.name === side.hard?.name) ? side.hard : null;
    if (star !== null) return { side, man: star, text: hard(star, side.name) };
  }
  for (const side of sides) {
    const doubtful = side.doubts.find((man) => side.keyMen.some((key) => key.name === man.name));
    if (doubtful !== undefined) return { side, man: doubtful, text: `${doubt(doubtful, side.name)} One of their main men, and the story of this tie.` };
  }
  return null;
}

/** The one line beyond the story and the men: a bad pick first, then a signing, then a doubt. */
function extra(sides: readonly { tag: string; side: PredictionSide }[], fresh: (men: readonly (SquadMan | null)[]) => SquadMan | null): string | null {
  for (const { tag, side } of sides) {
    const man = fresh([...side.doubts.filter((each) => each.availability.out), side.hard?.fixtures.length === 0 ? side.hard : null]);
    if (man !== null) return `- ${tag}-dud: ${dud(man, side.name)}`;
  }
  for (const { tag, side } of sides) {
    if (side.arrivals.length > 0) return `- ${tag}-in: ${side.name} signed ${side.arrivals.join(", ")} off the waiver list, arriving for this round. A signing is fair game.`;
  }
  for (const { tag, side } of sides) {
    const man = fresh(side.doubts.filter((each) => !each.availability.out));
    if (man !== null) return `- ${tag}-doubt: ${doubt(man, side.name)}`;
  }
  return null;
}

/** A man a side holds who gives them nothing this round: a pick to be scathing about. */
function dud(man: SquadMan, side: string): string {
  const why = man.fixtures.length === 0 ? "has no game this round" : state(man);
  return `${side}'s ${man.name} (${man.club}) ${why}. A pick that gives them nothing this round: be as rude about the pick as you like, never about the manager.`;
}

/** The reason he goes against the favourite, in the brief's facts and nothing else. */
function gutFact(instinct: NonNullable<PredictionCall["instinct"]>, favourite: PredictionSide, underdog: PredictionSide): string {
  if (instinct === "doubt" && favourite.best !== null) return `${favourite.name}'s best man, ${described(favourite.best)}, ${state(favourite.best)}.`;
  if (instinct === "liverpool") {
    const men = (side: PredictionSide) => `${side.liverpool}${side.liverpool === 0 ? "" : ` (${side.liverpoolMen.join(", ")})`}`;
    return `Liverpool men in the squad: ${underdog.name} ${men(underdog)}, ${favourite.name} ${men(favourite)}. You back the side with more of them. Never admit a bias and never say that is why: talk those men up as if it were obvious.`;
  }
  const line = (side: PredictionSide) => [...side.backLine].sort((a, b) => (a.ease ?? 99) - (b.ease ?? 99)).slice(0, 2).map((man) => `${man.name} ${fixture(man)}`).join(", ");
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

/** One of a side's main men against one of the round's hardest for his line: the story of a tie. */
function hard(man: SquadMan, side: string): string {
  return `${side}'s ${man.name}, one of their main men, is ${fixture(man)}, one of the hardest this round for his line. Say a hard one, never a rank. A big man against a hard one is often the story of a tie.`;
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
