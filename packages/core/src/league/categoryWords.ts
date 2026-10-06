import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFENSIVE_POINTS,
  DEFENSIVE_POINTS_3,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  meaningOf,
  type FantraxCategory,
} from "./categoryNames";
import type { ScoringCategory } from "./scoring";

// Fantrax's scoring categories in plain football words, by meaning: its captions say "Assists (Total)".

/** A category's name on a box, a band or a menu, its line in a board's key or a head's title, and its column head. */
interface CategoryWords {
  name: string;
  key: string;
  /** Display only: reads stay filed under Fantrax's code. */
  head: string;
}

/** A head is Fantrax's code unless one is named here. */
const words = (name: string, key = name, head?: string) => ({ name, key, head });

// Rename a category on every board here: its name, its key line, and a head where Fantrax's code is not good enough.
const WORDS: ReadonlyMap<FantraxCategory, ReturnType<typeof words>> = new Map([
  [MINUTES, words("Minutes", "Minutes played")],
  [GOALS, words("Goals")],
  [ASSISTS_TOTAL, words("Assists", "Assists, official and extra")],
  [ASSISTS_OFFICIAL, words("Assists", "Official assists")],
  [ASSISTS_FANTASY, words("Extra assists", "Extra assists: rebounds, penalties won, own goals forced")],
  [CLEAN_SHEETS, words("Clean sheets", "Clean sheets, playing 60 minutes or more")],
  [GOALS_AGAINST, words("Goals conceded", "Goals conceded in goal")],
  [GOALS_AGAINST_OUTFIELD, words("Goals conceded", "Goals conceded while on the pitch")],
  [DEFENSIVE_POINTS, words("DefCon", "DefCon: tackles won, interceptions and blocks", "DC")],
  [DEFENSIVE_POINTS_3, words("DefCon+", "DefCon+: tackles won, interceptions, blocks, clearances and recoveries", "DC+")],
  [SAVES, words("Saves")],
  [KEEPER_POINTS, words("Keeper actions", "Keeper actions: saves, smothers, punches and high claims won")],
  [PENALTY_SAVES, words("Penalties saved")],
  [PENALTIES_MISSED, words("Penalties missed")],
  [OWN_GOALS, words("Own goals")],
  [YELLOW_CARDS, words("Yellow cards")],
  [RED_CARDS, words("Red cards")],
]);

const KNOWN = [...WORDS.keys()];

/** A category's plain words and head; Fantrax's caption and code for one this table does not know. */
export function wordsFor(category: FantraxCategory): CategoryWords {
  const known = WORDS.get(category) ?? words(category.caption);
  return { ...known, head: known.head ?? category.short };
}

/** A league's category in plain words, by long code where it carried one, else by short; its own name and code when unknown. */
export function wordsOf(category: Pick<ScoringCategory, "code" | "name" | "longCode">): CategoryWords {
  const meaning = meaningOf(category, KNOWN);
  return meaning === null ? { ...words(category.name.trim() || category.code), head: category.code } : wordsFor(meaning);
}
