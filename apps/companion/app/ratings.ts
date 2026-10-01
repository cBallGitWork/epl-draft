import { marksOf, readRatingStore, type Fixture } from "@epl/core";
import ratingsFile from "../../../data/ratings/26-27.json";

// Our marks out of ten, as `npm run ratings` files them after each settled match day, read by FPL's per-season fixture id.

const store = readRatingStore(ratingsFile);

/** Where the mark comes from, on hover wherever it prints: ours, not Fantrax's or FPL's. */
export const RATING_TITLE = "Our rating out of ten: his league points, weighed by the opponent and by the chances missed, errors and extras the league does not score";

/** Every man's marks this season by FPL code, the unrated cameos left out. */
export function seasonMarks(): Map<number, number[]> {
  return new Map(
    Object.keys(store.marks).map((code) => [Number(code), [...marksOf(store, Number(code)).values()].filter((mark) => mark !== null)]),
  );
}

/** His marks by fixture id; a match not in the map was never rated. */
export function playerMarks(code: number, fixtures: readonly Fixture[]): Map<number, number | null> {
  const byCode = marksOf(store, code);
  return new Map(fixtures.flatMap((f) => (byCode.has(f.code) ? [[f.id, byCode.get(f.code) ?? null] as const] : [])));
}
