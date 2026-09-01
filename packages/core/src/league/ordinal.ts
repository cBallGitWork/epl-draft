// `1` becomes `1st`.
//
// **CM's index cell carries the ordinal and not the number** (`cm9900/24.jpg`),
// which is a small thing that reads as the game immediately: a column of
// `1st 2nd 3rd` is a league table and a column of `1 2 3` is a list.
//
// It had reached four copies — the league table, Team Stats, the player board
// and `competitions.ts` — all four character-identical bar the parameter name.
// Three is the rule (CODE_RULES §1) and this was past it.

const SUFFIX = ["th", "st", "nd", "rd"];

/** "1st", "2nd", "11th".
 *
 *  The teens are the whole reason this is not a lookup on the last digit:
 *  eleven, twelve and thirteen take "th" where one, two and three take "st",
 *  "nd" and "rd". Every copy of this got that right, which is a good sign about
 *  the copies and a bad sign about there being four of them. */
export function ordinal(place: number): string {
  const teens = place % 100;
  if (teens >= 11 && teens <= 13) return `${place}th`;
  return `${place}${SUFFIX[place % 10] ?? "th"}`;
}
