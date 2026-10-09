// The team-news desk's vocabulary: the prompt is built from these arrays and the editor checks against them.

/** British team-news phrases, each allowed this many times in one article so none becomes a tic. */
export const SHEETS_LEXICON: readonly (readonly [phrase: string, most: number])[] = [
  ["keeps his place", 1], ["retains his place", 1], ["is recalled", 1], ["is restored", 1], ["returns to the side", 1],
  ["back in the side", 1], ["comes into the side", 1], ["comes in for", 2], ["makes way", 1],
  ["remains on the bench", 1], ["again among the substitutes", 1], ["among the substitutes", 1],
  ["left out", 1], ["misses out", 1], ["handed a start", 1], ["debut", 2], ["leads the line", 1], ["up front", 2],
  ["in goal", 2], ["at the back", 2], ["in defence", 2], ["in midfield", 2], ["in attack", 1], ["back three", 2],
  ["back four", 2], ["front three", 2], ["ruled out", 2], ["sidelined", 1], ["a doubt", 2], ["an injury doubt", 1],
  ["a fitness doubt", 1], ["faces a fitness test", 1], ["struggling with", 1], ["back from injury", 1], ["fit again", 1],
  ["available again", 1], ["back from suspension", 1], ["suspended", 2], ["serving a ban", 1], ["banned", 1],
  ["unchanged", 2], ["the same eleven", 1], ["at home to", 3], ["trip to", 2], ["comes up against", 1], ["set up", 2],
  ["on the scoresheet", 1], ["a brace", 1], ["last time out", 2], ["recently", 2], ["lately", 2], ["benched", 2],
];

/** Plain words that turn into a rhythm when every paragraph leans on them; checked, never offered. */
export const SHEETS_CAPPED: readonly (readonly [phrase: string, most: number])[] = [
  ["while", 1], ["both", 1], ["also", 1], ["meanwhile", 0],
];

/** The house's own word for a thing, sent back when another is used. "round" alone is idiom too ("the other way round"),
 *  so the pencil below corrects it where it means the week. */
export const SHEETS_HOUSE: readonly (readonly [not: string, say: string])[] = [["rounds", "gameweeks"]];

/** Stock phrases a model reaches for and a reporter does not, sent back wherever they appear. */
export const SHEETS_STOCK: readonly string[] = [
  "to his name", "of late", "the same span", "the same stretch", "the same run", "his recent run", "recent weeks",
  "arrives with", "across his last", "over his last", "in his last", "so far this season", "brings with him",
  "form to match", "rich vein", "purple patch", "in fine form", "in good form", "hot streak", "awaits", "having managed",
  "a worry for", "both a worry", "leads the line with", "not certain to be", "major blow", "injury crisis",
  "selection headache", "race against time", "talisman", "nailed-on", "ever-present", "engine room", "pulls the strings",
  "stalwart", "mainstay", "will be hoping", "look to", "grouped by", "locked", "between the sticks",
  "in the middle of the park", "carrying a knock", "out wide", "full debut",
];

/** The sub-editor's pencil: a banned phrase with one right answer is corrected, not sent back. */
export const SHEETS_PENCIL: readonly (readonly [wrong: RegExp, right: string])[] = [
  [/\bsits (on|among)\b/giu, "is $1"],
  [/\bsit (on|among)\b/giu, "are $1"],
  [/\bof late\b/giu, "recently"],
  [/\bawaits\b/giu, "is awaiting"],
  [/\b(this|last|next|previous|each|every|that) round\b/giu, "$1 gameweek"],
  [/\bround (\d{1,2})\b/giu, "gameweek $1"],
];

/** Not this gameweek's news: an international story names the country, and it is the wrong match. */
export const SHEETS_ELSEWHERE: readonly string[] = [
  "England", "Scotland", "Wales", "Portugal", "Germany", "France", "Spain", "Netherlands", "Norway", "Brazil",
  "Argentina", "Belgium", "Nations League", "international", "internationals", "camp", "call-up", "national team",
];

/** American, or no football reporter's word, sent back wherever it appears. "field" is not here: to field a side is
 *  British. */
export const SHEETS_AMERICAN: readonly string[] = [
  "sits", "sit", "sitting", "sat", "roster", "rosters", "lineup", "lineups", "center", "defense", "offense",
  "matchup", "matchups", "game-time", "questionable", "day-to-day", "slated", "tallied", "notched", "tapped",
  "soccer", "shutout", "shutouts", "benchwarmer", "go-to", "starter", "starters", "vs", "gotten", "preseason",
  "offseason", "locker room", "cleats", "uniform", "overtime", "gameday", "road game", "road trip", "season opener",
  "banged up", "tweaked", "probable", "depth chart", "rookie", "on the field", "sideline", "sidelines",
  "center-forward", "centerback", "leveled", "labeled", "fueled", "totaled", "practiced",
  // Spelling: UK British, as The Times prints it.
  "favorite", "favorites", "color", "colors", "honor", "labor", "neighbor", "rumor", "rumors", "program", "practicing",
  "traveled", "traveling", "canceled", "fulfill", "skillful", "gray", "toward", "afterward", "meters", "kilometers",
];

/** An American -ize, where The Times prints -ise; "size", "prize", "seize" and "capsize" in any form, and a size compound
 *  ("oversized"), are not verbs of the kind. */
export const AMERICAN_IZE = /\b(?!(?:(?:over|under|down|super|up|mid|full|king|life|bite)?-?size[ds]?|sizing|prize[ds]?|prizing|seize[ds]?|seizing|capsize[ds]?|capsizing|maize|baize)\b)\p{L}{2,}(?:ize|izes|ized|izing|ization)\b/iu;
