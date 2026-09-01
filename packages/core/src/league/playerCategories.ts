import type { GroupKey } from "./categories";

// What the Player Stats board can rank the pool by.
//
// **These are Fantrax's scoring categories, and that is the whole argument for
// the source.** Craig, 1 Sep 2026: "im using player stats here for mainly
// fantasy stats… this is just fantasy scoring quick table", with a separate
// scouting screen to come. So this screen asks what a player did IN OUR GAME,
// and Fantrax is the authority on that (CLAUDE.md: "Fantrax's numbers are
// authoritative; ours are labelled").
//
// FPL carries goals and assists too and is not used here. Three reasons, in
// order of weight:
//
//   · **`AF` does not exist in FPL.** Fantasy assists — rebounds, blocked
//     shots, won handballs, own goals forced — are Fantrax's own invention and
//     one of the larger scoring categories in this league. A board built on FPL
//     could not print the column.
//   · **The definitions do not reconcile.** FPL counts a clean sheet per match
//     played; Fantrax awards one for sixty minutes on the field with the sheet
//     intact while he was on it. Printing FPL's number beside a fantasy team
//     would show a figure that does not explain the points that manager got.
//   · **Provenance.** DESIGN §7 keeps our numbers out of columns headed like
//     theirs. The cheapest way to obey it is for the numbers to be theirs.
//
// The scouting screen is where FPL belongs — xG, xA, shots, the intel pipeline.
// Different question, different source, and the bridge already joins the two.
// One crossing stays here: the PORTRAIT is FPL's, because that is identity
// rather than statistics, and identity is what the bridge is for.

/** A category the player board can rank by.
 *
 *  `key` is Fantrax's own column abbreviation — `G`, `AF`, `CS` — because that
 *  is what `mapPlayerStats` files each figure under, straight off the header. */
export interface PlayerCategory {
  key: string;
  group: GroupKey;
  label: string;
  /** True when a low count is the better one. */
  lowIsGood?: boolean;
  /** Keepers and outfielders publish different vocabularies, so a category can
   *  belong to one of them. Absent means both carry it. */
  only?: "keeper" | "outfield";
}

/** **Minutes are deliberately absent** (Craig: "dont do minutes"). It is on both
 *  reads and it is not a fantasy achievement — it is the denominator under one,
 *  and it belongs to the scouting screen with the rest of the context.
 *
 *  Ordered as a reader looks for them: what he did going forward, then what he
 *  did at the back, then what he did wrong. */
export const PLAYER_CATEGORIES: readonly PlayerCategory[] = [
  { key: "G", group: "attacking", label: "Goals" },
  { key: "A", group: "attacking", label: "Assists" },
  { key: "AF", group: "attacking", label: "Assists (fantasy)" },
  { key: "PKM", group: "attacking", label: "Penalties missed", lowIsGood: true },
  { key: "CS", group: "defensive", label: "Clean sheets" },
  { key: "Sv", group: "defensive", label: "Saves", only: "keeper" },
  { key: "PKS", group: "defensive", label: "Penalties saved", only: "keeper" },
  { key: "GA", group: "defensive", label: "Goals against", lowIsGood: true, only: "keeper" },
  { key: "GAO", group: "defensive", label: "Goals against", lowIsGood: true, only: "outfield" },
  { key: "YC", group: "discipline", label: "Yellow cards", lowIsGood: true },
  { key: "RC", group: "discipline", label: "Red cards", lowIsGood: true },
  { key: "OG", group: "discipline", label: "Own goals", lowIsGood: true },
];

/** The categories in one group. */
export function playersInGroup(group: GroupKey): PlayerCategory[] {
  return PLAYER_CATEGORIES.filter((category) => category.group === group);
}

export function playerCategoryFor(key: string | undefined): PlayerCategory {
  return PLAYER_CATEGORIES.find((category) => category.key === key) ?? PLAYER_CATEGORIES[0]!;
}
