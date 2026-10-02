// FPL's own price list, by FPL line (1 keeper … 4 forward): what a projection in FPL points was priced at.
// FPL's rules are fixed, so they are constants; our league's are read from Fantrax.

/** A goal, by line. */
export const FPL_GOAL: Readonly<Record<number, number>> = { 1: 10, 2: 6, 3: 5, 4: 4 };
export const FPL_ASSIST = 3;
/** A clean sheet over 60 minutes, by line; a forward earns none. */
export const FPL_CLEAN_SHEET: Readonly<Record<number, number>> = { 1: 4, 2: 4, 3: 1, 4: 0 };
/** Sixty minutes or more; under sixty earns half. */
export const FPL_FULL_APPEARANCE = 2;
/** What FPL docks a line for a match's goals conceded: a point for every two, keepers and defenders only. */
export function fplConceded(line: number, conceded: number): number {
  return line === 1 || line === 2 ? -Math.floor(conceded / 2) : 0;
}
