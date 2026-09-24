import { PREDICTIONS } from "../../config";
import type { PredictionCall } from "../predictions/pick";
import type { PredictionSide, SquadMan } from "../predictions/sides";

// One tie's facts for Lawro, worded and ranked. Squad-level only, and no figure of ours: the
// order of a side's men is our model's reading and is never printed.

/** The tie's one story first, then a man for each side the story leaves out (the one with the easy
 *  game when there is one), their form on the pitch and in the table, the men who share a club or
 *  meet on the pitch, and one more: a signing or a doubt. Never a roll call. */
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
      if (covered.has(side)) return null;
      const easy = side.kind !== null && side.keyMen.some((man) => man.name === side.kind?.name) && !used.has(side.kind.name);
      const man = take(easy ? side.kind : fresh(side.keyMen));
      if (man === null) return null;
      const run = streak(man);
      return `- ${tag}-man: ${described(man)}, for ${side.name}${easy ? ", an easy one" : ""}.${run === null ? "" : ` He ${run}.`}`;
    }),
    ...sides.map(({ tag, side }) => {
      const man = take(fresh(side.keyMen.filter((each) => streak(each) !== null)));
      return man === null ? null : `- ${tag}-run: ${side.name}'s ${man.name} (${man.club}) ${streak(man)}.`;
    }),
    ...sides.map(({ tag, side }) => (side.form === null ? null : `- ${tag}-form: ${form(side)}`)),
    // On a gut call the reason is the story: only the men who meet on the pitch get another line.
    ...(call.instinct === null ? together(index, home, away) : together(index, home, away).slice(-1)),
    // Liverpool men are the whole story of a Liverpool call: nobody else gets a line.
    call.instinct === "liverpool" ? null : extra(sides, fresh),
  ];
  return facts.filter((fact): fact is string => fact !== null).slice(0, PREDICTIONS.factsPerTie);
}

/** What the tie is about, favourite first: a main man with an easy game (Craig: "focus on who has a
 *  very easy match up"), else one in form, else one gone quiet or back from a lay-off, else one with
 *  a difficult game, else one in doubt; null when none. */
function storyOf(sides: readonly PredictionSide[]): { side: PredictionSide; man: SquadMan; text: string } | null {
  const main = (side: PredictionSide, man: SquadMan | null | undefined) => (man != null && side.keyMen.some((each) => each.name === man.name) ? man : null);
  for (const side of sides) {
    const man = main(side, side.kind);
    if (man !== null) return { side, man, text: `${side.name}'s ${man.name}, one of their main men, has an easy one: ${fixture(man)}.` };
  }
  for (const side of sides) {
    const man = side.keyMen.find((each) => streak(each) !== null);
    if (man !== undefined) return { side, man, text: `${side.name}'s ${man.name} (${man.club}), one of their main men, ${streak(man)}.` };
  }
  for (const side of sides) {
    const man = main(side, side.hard?.fixtures.length === 0 ? null : side.hard);
    if (man !== null) return { side, man, text: `${side.name}'s ${man.name}, one of their main men, has a difficult one: ${fixture(man)}.` };
  }
  for (const side of sides) {
    const man = main(side, side.doubts[0]);
    if (man !== null) return { side, man, text: `${doubt(man, side.name)} One of their main men.` };
  }
  return null;
}

/** A man's last games in a sentence, when they say something: form, a quiet spell, or a return. */
export function streak(man: SquadMan): string | null {
  const games = man.recent;
  if (games.length < PREDICTIONS.recentGames) return null;
  const last = games[games.length - 1];
  const sum = (key: "goals" | "assists" | "cleanSheets" | "minutes") => games.reduce((total, game) => total + game[key], 0);
  const played = games.every((game) => game.minutes >= 60);
  if (games.every((game) => game.minutes === 0)) return man.availability.state === "fit" ? "is fit again after missing his last two games" : null;
  if (last.minutes === 0 && man.availability.state === "fit") return "missed last week and is fit again";
  if (games.every((game) => game.goals > 0)) return "scored in each of his last two games";
  const back = man.positions.some((position) => position === "G" || position === "D");
  if (back && games.every((game) => game.cleanSheets > 0)) return "kept a clean sheet in each of his last two games";
  if (sum("goals") + sum("assists") >= 2) return `has ${count(sum("goals"), "goal")} and ${count(sum("assists"), "assist")} in his last two games`;
  if (played && !back && sum("goals") + sum("assists") === 0) return "has gone quiet, no goal and no assist in his last two games";
  return null;
}

function count(figure: number, noun: string): string {
  return figure === 0 ? `no ${noun}` : figure === 1 ? `one ${noun}` : `${figure} ${noun}s`;
}

/** The one line beyond the story and the men: a man brought in, else a doubt. */
function extra(sides: readonly { tag: string; side: PredictionSide }[], fresh: (men: readonly (SquadMan | null)[]) => SquadMan | null): string | null {
  for (const { tag, side } of sides) {
    if (side.arrivals.length > 0) return `- ${tag}-in: ${side.name} brought in ${side.arrivals.join("; ")}, for this round.`;
  }
  for (const { tag, side } of sides) {
    const man = fresh(side.doubts);
    if (man !== null) return `- ${tag}-doubt: ${doubt(man, side.name)}`;
  }
  return null;
}

/** Men who share a club on one side, and a man on each side whose clubs meet this round: the two
 *  coincidences worth a line (Craig). Only among the men who matter most, so it is never a roll call. */
function together(index: number, home: PredictionSide, away: PredictionSide): (string | null)[] {
  const clubmates = [home, away].map((side) => {
    const byClub = new Map<string, string[]>();
    for (const man of side.keyMen) if (man.club !== "") byClub.set(man.club, [...(byClub.get(man.club) ?? []), man.name]);
    const shared = [...byClub].find(([, names]) => names.length > 1);
    return shared === undefined ? null : `- T${index}-club: ${side.name}'s ${shared[1].join(" and ")} both play for ${shared[0]}.`;
  });
  // A big game when each man's club is at an extreme in the other's view (Craig: "big match ups").
  const meeting = home.keyMen.flatMap((ours) =>
    away.keyMen.flatMap((theirs) => {
      const there = ours.fixtures.find((each) => each.opponent === theirs.club);
      if (there === undefined) return [];
      const big = there.standing !== null && theirs.fixtures.some((each) => each.opponent === ours.club && each.standing !== null);
      return [`${ours.name} (${home.name}, ${ours.club}) and ${theirs.name} (${away.name}, ${theirs.club}) play against each other this round${big ? ", in one of the big games of the weekend" : ""}.`];
    }),
  );
  return [...clubmates, meeting.length === 0 ? null : `- T${index}-meet: ${meeting[0]}`];
}

/** The reason he goes against the favourite, in the brief's facts and nothing else. */
function gutFact(instinct: NonNullable<PredictionCall["instinct"]>, favourite: PredictionSide, underdog: PredictionSide): string {
  if (instinct === "doubt" && favourite.best !== null) return `${favourite.name}'s best man, ${described(favourite.best)}, ${state(favourite.best)}.`;
  if (instinct === "liverpool") {
    // With their fixtures, so he praises their football: given names alone, he gave their club as the reason.
    const theirs = underdog.squad.filter((man) => man.liverpool).slice(0, 2).map(described).join("; ");
    return `Liverpool men in the squad: ${underdog.name} ${underdog.liverpool}, ${favourite.name} ${favourite.liverpool}. ${underdog.name}'s: ${theirs}. You back the side with more of them. Never admit a bias and never give their club as the reason: praise their football, as if it were obvious.`;
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
