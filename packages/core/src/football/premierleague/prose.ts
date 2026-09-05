// Opta's own sentence, cut down to a wire line.
//
// Craig, 5 Sep 2026, with Sky's teleprinter beside our own: *"WE use the match
// report text? example 'Goal! Newcastle United 1, Bournemouth 2. Harvey Barnes
// (Newcastle United) right footed shot from the left side of the box to the top
// right corner. Assisted by Lewis Hall.', but we can shortern it (shortern team
// names, remove the team name in brackets."*
//
// Two edits and no third. **A club's long name becomes its short one**, and
// **the club in brackets after a player goes** — counted across all 107 events of
// the recorded fixture, every one of the 80 parenthesised substrings is a club
// long name and nothing else, so the strip is well defined rather than a guess at
// what a bracket might hold.
//
// **Nothing is paraphrased.** The prose is Opta's and it stays Opta's: no
// re-ordering, no summarising, no adjective of ours. That is the whole appeal of
// this wire against the row one — a row says what happened in our vocabulary, and
// this says it in the game's own words, which is what a teleprinter is.
//
// The names come in rather than being held here. They are on the round read the
// wire already makes — each fixture's `teams[].team` carries the long name and a
// short one on the same object — so this stays pure and the caller does the
// looking up (CODE_RULES §5).

/** Opta's sentence with the club names cut down, or the sentence unchanged when
 *  it names no club we know.
 *
 *  `names` maps a club's long name as OPTA writes it — "Newcastle United",
 *  "Brighton and Hove Albion" — to whatever the caller wants read instead.
 *
 *  **One pass, longest alternative first, and both halves of that matter.**
 *
 *  Longest first because a short name that is a prefix of a long one would
 *  otherwise take its front and leave the tail stranded — "Tottenham" eating
 *  "Tottenham Hotspur" down to "Tottenham Hotspur".
 *
 *  One pass because a name-by-name loop rescans its own OUTPUT: replace
 *  "Tottenham Hotspur" with "Spurs" and a later key can match inside what the
 *  first one just wrote. A single alternation substitutes every name against the
 *  ORIGINAL text, so no replacement is ever a candidate for another. */
export function shortProse(text: string, names: ReadonlyMap<string, string>): string {
  if (names.size === 0) return text;
  const longest = [...names.keys()].sort((a, b) => b.length - a.length);
  const alternation = longest.map(escapeForRegExp).join("|");

  return (
    text
      // The brackets first, and as their own pass — what is inside them is a long
      // name, so stripping after the replacement would be looking for "(Spurs)".
      .replace(new RegExp(` \\((?:${alternation})\\)`, "g"), "")
      .replace(new RegExp(alternation, "g"), (found) => names.get(found) ?? found)
  );
}

/** A club name is data from a provider, so it is escaped rather than trusted to
 *  contain no metacharacter. `Nott'm Forest` is the one that already carries
 *  punctuation and there is nothing stopping the next one carrying more. */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
