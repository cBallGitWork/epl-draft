// The team-news desk's vocabulary. The prompt is built from these arrays and the editor checks
// against them, so the rule the writer is given and the rule it is marked on cannot drift.

/** British team-news phrases, each allowed this many times in one article so none becomes a tic. */
export const SHEETS_LEXICON: readonly (readonly [phrase: string, most: number])[] = [
  ["keeps his place", 1], ["retains his place", 1], ["is recalled", 1], ["is restored", 1],
  ["comes into the side", 1], ["comes in for", 2], ["makes way", 1], ["drops to the bench", 1], ["dropped to the bench", 2],
  ["misses out", 1], ["among the substitutes", 1], ["named on the bench", 1], ["handed a start", 1], ["full debut", 1],
  ["leads the line", 2], ["up front", 2], ["between the sticks", 1], ["in goal", 2], ["at the back", 3],
  ["in the middle of the park", 1], ["out wide", 1], ["back three", 2], ["back four", 2], ["front three", 2],
  ["ruled out", 2], ["sidelined", 1], ["a doubt", 2], ["late fitness test", 1], ["carrying a knock", 1],
  ["back from injury", 1], ["serving a ban", 1], ["banned", 1], ["unchanged side", 2], ["same starting line-up", 1],
  ["among the goals", 1], ["a brace", 1], ["on the scoresheet", 1], ["clean sheets", 2], ["in the goals", 1],
];

/** American, or no football reporter's word, sent back wherever it appears (Craig, 26 Sep 2026:
 *  "Don't say sits, that's an American term. Benched"). */
export const SHEETS_AMERICAN: readonly string[] = [
  "sits", "sit", "sitting", "sat", "roster", "rosters", "lineup", "lineups", "center", "defense", "offense",
  "matchup", "matchups", "game-time", "questionable", "day-to-day", "slated", "tallied", "notched", "tapped",
  "soccer", "shutout", "shutouts", "benchwarmer", "go-to",
];
