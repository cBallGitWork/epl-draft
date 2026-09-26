import type { Sheet, SheetMan } from "./sheet";

// Starters worth a line on sight: a club with no match this round, a man FPL lists as doubtful,
// and a man his club's predicted eleven leaves out. Each is a read, never a judgement.

export type StarterFlag =
  | { kind: "no-fixture"; man: SheetMan }
  | { kind: "doubt"; man: SheetMan; chance: number | null; news: string }
  | { kind: "not-predicted"; man: SheetMan };

export interface FlagInput {
  /** FPL club ids with a match in this round. */
  playing: ReadonlySet<number>;
  /** Whether his club's predicted eleven names him; null when we hold none for his club. */
  predicted: (man: SheetMan) => boolean | null;
}

/** In reading order: a blank first, because a starter with no match cannot score at all. */
export function starterFlags(sheet: Sheet, input: FlagInput): StarterFlag[] {
  const blank = sheet.starters.filter((man) => !input.playing.has(man.player.clubId));
  const playing = sheet.starters.filter((man) => input.playing.has(man.player.clubId));
  return [
    ...blank.map((man) => ({ kind: "no-fixture" as const, man })),
    ...playing
      .filter((man) => man.player.status !== "a")
      .map((man) => ({ kind: "doubt" as const, man, chance: man.player.chanceOfPlaying, news: man.player.news })),
    ...playing
      .filter((man) => man.player.status === "a" && input.predicted(man) === false)
      .map((man) => ({ kind: "not-predicted" as const, man })),
  ];
}
