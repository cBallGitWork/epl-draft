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
  /** Which foot button this sits under. */
  group: GroupKey;
  label: string;
  /** Two or three letters for a column head. Fantrax's own abbreviations where
   *  it has one, because a reader who knows their scoring page knows these. */
  short: string;
  /** True when a low figure is the better one. Cards, own goals and goals
   *  against are the categories where topping the table is bad news, and a board
   *  that ranked them descending would put the worst side first under a heading
   *  that reads like a leaderboard. */
  lowIsGood?: boolean;
}

/** The four kinds of thing a squad does, which is CM's second foot row.
 *
 *  Craig, 1 Sep 2026: "like CM, we could have another row of blue buttons under
 *  the table, could then separate the categories into defensive / attacking /
 *  appearance / discipline". That row is the one thing every screen in the
 *  reference library has and this app had none of — related destinations under
 *  the panel, above the Back/Next pair (`docs/ui/reference/README.md`). Twelve
 *  entries in one dropdown was a list; four buttons over three or four each is
 *  a screen.
 *
 *  **Where the two awkward ones went.** A missed penalty is a failed SHOT and
 *  files under attacking; an own goal is a blunder against your own side and
 *  files under discipline (Craig chose the split). Neither is obvious, which is
 *  why it is written down.
 *
 *  **Appearances has one entry today and that is a fact about our league, not
 *  about Fantrax.** `SEASON_STATS` publishes what THIS league scores, so
 *  sub-on, sub-off and points off the bench are absent because nobody is paid
 *  for them here. A league with every category enabled would say what the full
 *  set is — deferred, and recorded in PLATFORM_NOTES. */
export const GROUPS = [
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "appearances", label: "Appearances" },
  { key: "discipline", label: "Discipline" },
] as const;

export type GroupKey = (typeof GROUPS)[number]["key"];

/** The categories in one group, in the order they are declared. */
export function inGroup(group: GroupKey): StatCategory[] {
  return CATEGORIES.filter((category) => category.group === group);
}

export function groupFor(key: string | undefined): GroupKey {
  return GROUPS.find((group) => group.key === key)?.key ?? "attacking";
}

/** Ordered as a reader would look for them: what a squad did going forward,
 *  then what it did at the back, then what it did wrong. Not alphabetical —
 *  `Assists (Fantasy)` first and `Yellow Cards` last is an accident of the
 *  alphabet, not an order anybody wants to read. */
export const CATEGORIES: readonly StatCategory[] = [
  { key: "Minutes Played", group: "appearances", label: "Minutes", short: "Min" },
  { key: "Goals", group: "attacking", label: "Goals", short: "G" },
  { key: "Assists (Official)", group: "attacking", label: "Assists", short: "A" },
  { key: "Assists (Fantasy)", group: "attacking", label: "Assists (fantasy)", short: "AF" },
  { key: "Clean Sheets On Field", group: "defensive", label: "Clean sheets", short: "CS" },
  { key: "Saves", group: "defensive", label: "Saves", short: "Sv" },
  { key: "Penalty Kick Saves", group: "defensive", label: "Penalties saved", short: "PKS" },
  { key: "Goals Against", group: "defensive", label: "Goals against", short: "GA", lowIsGood: true },
  { key: "Yellow Cards", group: "discipline", label: "Yellow cards", short: "YC", lowIsGood: true },
  { key: "Red Cards", group: "discipline", label: "Red cards", short: "RC", lowIsGood: true },
  { key: "Penalty Kicks Missed", group: "attacking", label: "Penalties missed", short: "PKM", lowIsGood: true },
  { key: "Own Goals", group: "discipline", label: "Own goals", short: "OG", lowIsGood: true },
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
