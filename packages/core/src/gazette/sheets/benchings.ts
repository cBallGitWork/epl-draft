import { SHEETS } from "../../config";
import { sitsFor, type Sheet, type SheetMan } from "./sheet";

// A benched man the projections say should have started: he is projected above the weakest
// starter in his own slot. The paper states the order, never the sister model's FPL-scale number.

/** The sister model's reading for a man this round; null where it has none. */
export interface Projected {
  points: number;
  /** Chance he starts for his club, 0 to 1; null where the model gives none. */
  start: number | null;
}

export interface Benching {
  man: SheetMan;
  /** The starter in his slot he is projected above. */
  over: SheetMan;
  /** Projected highest of everyone this side holds in his slot. */
  best: boolean;
  /** He sat on this side's last sheet too. */
  again: boolean;
}

export function benchings(sheet: Sheet, projected: (code: number) => Projected | null, before: Sheet | undefined): Benching[] {
  const reading = (man: SheetMan) => projected(man.player.code);
  const found = sheet.bench.flatMap((man) => {
    const his = reading(man);
    if (his === null || (his.start ?? 0) < SHEETS.benchStart) return [];
    const rivals = sheet.starters
      .filter((starter) => starter.slot === man.slot)
      .flatMap((starter) => {
        const theirs = reading(starter);
        return theirs === null ? [] : [{ starter, points: theirs.points }];
      })
      .sort((a, b) => a.points - b.points);
    const weakest = rivals[0];
    if (weakest === undefined || his.points - weakest.points < SHEETS.benchMargin) return [];
    const slot = [...sheet.starters, ...sheet.bench].filter((other) => other.slot === man.slot && other !== man);
    return [{
      margin: his.points - weakest.points,
      benching: {
        man,
        over: weakest.starter,
        best: slot.every((other) => (reading(other)?.points ?? -Infinity) < his.points),
        again: before !== undefined && sitsFor(before, man.fantraxId),
      },
    }];
  });
  return found
    .sort((a, b) => b.margin - a.margin)
    .slice(0, SHEETS.benchings)
    .map((each) => each.benching);
}
