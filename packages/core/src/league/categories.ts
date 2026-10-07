import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFENSIVE_POINTS,
  DEFENSIVE_POINTS_3,
  GOALS,
  GOALS_AGAINST,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  carries,
  type FantraxCategory,
} from "./categoryNames";
import { wordsFor } from "./categoryWords";

// What the Team Stats board can rank a league by: our list, each category once, not Fantrax's one per position block.

/** A category the board can rank by: `key` is Fantrax's caption, which `mapSeasonStats` files lines under. */
export interface StatCategory {
  key: string;
  /** Which foot button this sits under. */
  group: GroupKey;
  label: string;
  /** Its column head (`wordsFor(...).head`): display only, never a lookup. */
  short: string;
  /** The head's title, where it says more than the label. */
  title?: string;
  /** True when a low figure is the better one: cards, own goals, goals against. */
  lowIsGood?: boolean;
}

/** The kinds of thing a squad does, the board's second foot row. A missed penalty files under attacking and an
 *  own goal under discipline. */
export const GROUPS = [
  { key: "attacking", label: "Attacking", short: "Attack" },
  { key: "defensive", label: "Defensive", short: "Defence" },
  // A keeper's own work, apart so DefCon's two counts fit a phone beside clean sheets.
  { key: "keeping", label: "Keeping", short: "Keeping" },
  { key: "appearances", label: "Appearances", short: "Apps" },
  { key: "discipline", label: "Discipline", short: "Discipline" },
] as const;

export type GroupKey = (typeof GROUPS)[number]["key"];

/** A group's categories the league publishes, by caption, in declared order; the whole group when Fantrax answered nothing. */
export function offeredIn(group: GroupKey, lines: ReadonlyMap<string, unknown>): StatCategory[] {
  const carried = new Set(lines.keys());
  return CATEGORIES.filter((category) => category.group === group && carries(carried, category.key));
}

export function groupFor(key: string | undefined): GroupKey {
  return GROUPS.find((group) => group.key === key)?.key ?? "attacking";
}

/** A category the board ranks by: filed under Fantrax's caption, headed by its abbreviation, named in plain words. */
export function statCategory(of: FantraxCategory, group: GroupKey, lowIsGood?: true, title = wordsFor(of).key): StatCategory {
  const words = wordsFor(of);
  return { key: of.caption, group, label: words.name, short: words.head, title, lowIsGood };
}

/** Every category, in the order each group lists them; never alphabetical. */
export const CATEGORIES: readonly StatCategory[] = [
  statCategory(MINUTES, "appearances"),
  statCategory(GOALS, "attacking"),
  statCategory(ASSISTS_TOTAL, "attacking"),
  statCategory(ASSISTS_OFFICIAL, "attacking"),
  statCategory(ASSISTS_FANTASY, "attacking"),
  statCategory(CLEAN_SHEETS, "defensive"),
  // DefCon's two counts: the real league pays a defender on the first and the men in front of him on the second.
  statCategory(DEFENSIVE_POINTS, "defensive"),
  statCategory(DEFENSIVE_POINTS_3, "defensive"),
  // One line for both halves: mapSeasonStats adds an outfielder's GAO to a keeper's GA, so it takes the name both share.
  statCategory(GOALS_AGAINST, "defensive", true, wordsFor(GOALS_AGAINST).name),
  statCategory(SAVES, "keeping"),
  statCategory(KEEPER_POINTS, "keeping"),
  statCategory(PENALTY_SAVES, "keeping"),
  statCategory(YELLOW_CARDS, "discipline", true),
  statCategory(RED_CARDS, "discipline", true),
  statCategory(PENALTIES_MISSED, "attacking", true),
  statCategory(OWN_GOALS, "discipline", true),
];

export function categoryFor(key: string | undefined): StatCategory {
  return CATEGORIES.find((category) => category.key === key) ?? CATEGORIES[0]!;
}

/** Which number the board ranks by: the category's fantasy points (the default) or its count. */
export type Measure = "points" | "value";

export function isMeasure(value: string | undefined): value is Measure {
  return value === "points" || value === "value";
}
