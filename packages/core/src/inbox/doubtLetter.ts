import type { AvailabilityNote } from "../gazette/types";
import { ailment, readNote } from "./notes";

// A doubt, written as the person sending it would write it (Craig, 25 Sep 2026: "if a player
// is out, write like a person"): your physio about your man, your scout about the opponent's,
// the club's own desk when nobody is signed in. Every fact is FPL's; only the sentence is ours.

/** Whose man he is: the reader's, his next opponent's, or the league's for a signed-out reader. */
export type Side = "mine" | "opponent" | "league";

/** One of a few ways of saying a thing, fixed by `key` so a refresh never rewords a letter. */
export function choose<T>(key: string, options: readonly T[]): T {
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

/** The letter's body. `who` is the squad he belongs to, by name. */
export function doubtLetter(note: AvailabilityNote, gameweek: number | null, side: Side, who: string): string {
  const reading = readNote(note.news);
  const name = note.fullName;
  const pick = <T>(options: readonly T[]) => choose(`${note.teamId}:${note.playerName}`, options);
  const round = gameweek === null ? "the next round" : `gameweek ${gameweek}`;
  const forRound = gameweek === null ? "" : ` for gameweek ${gameweek}`;
  const inRound = gameweek === null ? "" : ` in gameweek ${gameweek}`;
  const theirs = side !== "mine";

  if (reading.kind === "ban") {
    const until = reading.until === null ? "" : ` until ${reading.until}`;
    return theirs
      ? `${who} will be without ${name}${forRound}. He's suspended${until}.`
      : `This is to confirm that ${name} is suspended and misses ${round}.${until === "" ? "" : ` The ban runs${until}.`}`;
  }
  if (reading.kind === "move") {
    return theirs ? `${name} ${reading.clause}, so ${who} have lost him.` : `${name} ${reading.clause}, so he's no longer available to you.`;
  }
  if (reading.kind === "other") {
    const state = note.out ? "is out" : "is a doubt";
    return theirs ? `${who} have news on ${name}${forRound}: ${reading.text}.` : `${name} ${state}${forRound}: ${reading.text}.`;
  }

  const has = ailment(reading.complaint);
  const outlook = reading.outlook === "unknown" ? null : reading.outlook;
  const back = outlook !== null && "back" in outlook ? outlook.back : null;
  const chance = note.chance ?? (outlook !== null && "chance" in outlook ? outlook.chance : null);

  if (note.out) {
    if (back !== null) {
      return theirs
        ? pick([
            `${who} will be without ${name}${forRound}. He ${has} and is expected back around ${back}.`,
            `${name} misses ${round} for ${who}. He ${has} and should be back around ${back}.`,
          ])
        : pick([
            `${name} ${has} and misses ${round}. We expect him back around ${back}.`,
            `${name} ${has}, so he's out${forRound}. He should be back around ${back}.`,
          ]);
    }
    return theirs
      ? pick([
          `${who} will be without ${name}${forRound}. He ${has} and there's no date yet for his return.`,
          `${name} won't play for ${who}${inRound}. He ${has} and there's no return date yet.`,
        ])
      : pick([
          `${name} ${has} and won't be fit${forRound}. We can't put a date on his return yet.`,
          `${name} ${has} and misses ${round}. There's no date for his return yet.`,
        ]);
  }
  if (chance === null) {
    return theirs ? `${who} have a doubt over ${name}${forRound}: he ${has}.` : `${name} ${has} and is a doubt${forRound}.`;
  }
  return theirs
    ? pick([
        `${who} have a doubt over ${name}${forRound}. He ${has} and is ${chance}% to play.`,
        `${name} is ${chance}% to play for ${who}${inRound}. He ${has}.`,
      ])
    : pick([
        `${name} ${has}. He's ${chance}% to play${inRound}, and we'll know more nearer the deadline.`,
        `${name} ${has} and is ${chance}% to play${inRound}. We'll have a clearer picture nearer the deadline.`,
      ]);
}

/** Who signs it: your physio, the FA or the transfer desk for your man; your scout for theirs. */
export function doubtFrom(note: AvailabilityNote, side: Side, who: string): string {
  if (side === "opponent") return "Your scout";
  if (note.state === "suspended") return "The FA";
  if (note.state === "unavailable") return "The transfer desk";
  return side === "mine" ? "Your physio" : `${possessive(who)} physio`;
}

/** "test1's", and "Rovers'" for a name already ending in s. */
function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}
