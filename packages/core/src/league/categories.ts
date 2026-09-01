// What the Team Stats board can rank a league by.
//
// The list is OURS, not Fantrax's, and the difference matters. Fantrax publishes
// 22 leaderboards because it publishes each category twice, once per position
// block; a reader does not think of "clean sheets kept by my goalkeeper" and
// "clean sheets kept by my defenders" as two things. So this is the twelve
// categories the game actually pays for, and `mapSeasonStats` does the adding.
//
// Craig, 1 Sep 2026, on why goals against is one entry and not two: "goals
// against is a def and keeper stat, so we can combine that." Saves and penalty
// saves stay keeper-only because only a keeper can record one — they are not
// combined, they simply have one half.

/** A category the board can rank by.
 *
 *  `key` is Fantrax's own caption, because that is what `mapSeasonStats` files
 *  the lines under; matching on a label we invented would break the moment we
 *  reworded one. `label` is what the menu says, and it is shorter than Fantrax's
 *  caption on purpose — a select on a 390px phone has about twenty characters.*/
export interface StatCategory {
  key: string;
  label: string;
  /** True when a low figure is the better one. Cards, own goals and goals
   *  against are the categories where topping the table is bad news, and a board
   *  that ranked them descending would put the worst side first under a heading
   *  that reads like a leaderboard. */
  lowIsGood?: boolean;
}

/** Ordered as a reader would look for them: what a squad did going forward,
 *  then what it did at the back, then what it did wrong. Not alphabetical —
 *  `Assists (Fantasy)` first and `Yellow Cards` last is an accident of the
 *  alphabet, not an order anybody wants to read. */
export const CATEGORIES: readonly StatCategory[] = [
  { key: "Minutes Played", label: "Minutes" },
  { key: "Goals", label: "Goals" },
  { key: "Assists (Official)", label: "Assists" },
  { key: "Assists (Fantasy)", label: "Assists (fantasy)" },
  { key: "Clean Sheets On Field", label: "Clean sheets" },
  { key: "Saves", label: "Saves" },
  { key: "Penalty Kick Saves", label: "Penalties saved" },
  { key: "Goals Against", label: "Goals against", lowIsGood: true },
  { key: "Yellow Cards", label: "Yellow cards", lowIsGood: true },
  { key: "Red Cards", label: "Red cards", lowIsGood: true },
  { key: "Penalty Kicks Missed", label: "Penalties missed", lowIsGood: true },
  { key: "Own Goals", label: "Own goals", lowIsGood: true },
];

export function categoryFor(key: string | undefined): StatCategory {
  return CATEGORIES.find((category) => category.key === key) ?? CATEGORIES[0]!;
}

/** Which number the board ranks by. Fantasy points is the default because this
 *  is a fantasy league: a squad that played 1,500 minutes is not doing better
 *  than one that played 1,400 unless those minutes were worth more. */
export type Measure = "points" | "value";

export function isMeasure(value: string | undefined): value is Measure {
  return value === "points" || value === "value";
}
