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

/** A category's name on a box, a band or a menu, and its line in a board's key or a head's title. */
export interface CategoryWords {
  name: string;
  key: string;
}

const words = (name: string, key = name): CategoryWords => ({ name, key });

// DefCon (DEF) and (MID/FWD) are FPL's two DefCon counts, which DFP and DFP3 follow.
const WORDS: ReadonlyMap<FantraxCategory, CategoryWords> = new Map([
  [MINUTES, words("Minutes", "Minutes played")],
  [GOALS, words("Goals")],
  [ASSISTS_TOTAL, words("Assists", "Assists, official and extra")],
  [ASSISTS_OFFICIAL, words("Assists", "Official assists")],
  [ASSISTS_FANTASY, words("Extra assists", "Extra assists: rebounds, penalties won, own goals forced")],
  [CLEAN_SHEETS, words("Clean sheets", "Clean sheets, playing 60 minutes or more")],
  [GOALS_AGAINST, words("Goals conceded", "Goals conceded in goal")],
  [GOALS_AGAINST_OUTFIELD, words("Goals conceded", "Goals conceded while on the pitch")],
  [DEFENSIVE_POINTS, words("DefCon (DEF)", "DefCon (DEF): tackles won, interceptions and blocks")],
  [DEFENSIVE_POINTS_3, words("DefCon (MID/FWD)", "DefCon (MID/FWD): tackles won, interceptions, blocks, clearances and recoveries")],
  [SAVES, words("Saves")],
  [KEEPER_POINTS, words("Keeper actions", "Keeper actions: saves, smothers, punches and high claims won")],
  [PENALTY_SAVES, words("Penalties saved")],
  [PENALTIES_MISSED, words("Penalties missed")],
  [OWN_GOALS, words("Own goals")],
  [YELLOW_CARDS, words("Yellow cards")],
  [RED_CARDS, words("Red cards")],
]);

const KNOWN = [...WORDS.keys()];

/** A category's plain words; Fantrax's caption for one this table does not know. */
export function wordsFor(category: FantraxCategory): CategoryWords {
  return WORDS.get(category) ?? words(category.caption);
}

/** A league's category in plain words, by long code where it carried one, else by short; its own name when unknown. */
export function wordsOf(category: Pick<ScoringCategory, "code" | "name" | "longCode">): CategoryWords {
  const meaning = meaningOf(category, KNOWN);
  return meaning === null ? words(category.name.trim() || category.code) : wordsFor(meaning);
}
