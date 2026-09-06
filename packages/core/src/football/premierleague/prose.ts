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

/** One line of a prose wire. */
export interface ProseLine {
  /** Stable across polls. An event id is unique within a stream and not across a
   *  round, so the fixture's own id leads it. */
  id: string;
  /** The clock as the feed prints it — `"07"`, `"45+2"` — or `"FT"`, which is the
   *  one line whose own label is junk. */
  minute: string;
  /** Opta's sentence, shortened. Never paraphrased. */
  text: string;
  /** Elapsed seconds in the fixture. The caller adds kick-off to order a round. */
  seconds: number;
}

/** Opta's own type for "Match ends". Its clock is `{secs: 0, label: "01"}` —
 *  `map.ts` records the label as junk and drops only events with NO time, so this
 *  one survives with a reading of nought and would sort to kick-off, above every
 *  goal in its own match. The caller supplies the fixture's final clock. */
export const FULL_TIME = "end 14";

/** Opta's types a WIRE prints, out of the twenty-odd it publishes.
 *
 *  **The whole vocabulary is a firehose, not a wire.** Counted across the 28
 *  played fixtures of GW1-3: 642 `free kick lost`, 627 `free kick won`, 280
 *  `miss`, 252 `corner`, 240 `attempt blocked`. Unfiltered, the first ten lines of
 *  a round were four free kicks, an added-time announcement and two missed shots.
 *  `plCommentary` keeps everything on purpose — a match REPORT wants the whole
 *  thing — so the filter belongs here, to the caller that does not.
 *
 *  These nine are what a teleprinter prints and what this league pays for: the
 *  score, the two cards, the substitution that ends a man's minutes, the goal VAR
 *  took away, and the man who WON a penalty.
 *
 *  `end 14` and not `end 2`: the first is "Match ends", the second "Second Half
 *  ends", and a wire printing both says full time twice. `end 1` is half time,
 *  which came off this panel the evening it went on.
 *
 *  Opta's own strings, verbatim, for the reason `KINDS` in `map.ts` is written
 *  out — the strings are theirs and a translation table is the only honest place
 *  to meet them. */
const WIRE_TYPES = new Set([
  "goal",
  "penalty goal",
  "own goal",
  "VAR cancelled goal",
  "penalty won",
  "yellow card",
  "red card",
  "substitution",
  FULL_TIME,
]);

/** One fixture's commentary, reduced to a wire and shortened.
 *
 *  `lines` is `plCommentary`'s output for that fixture — already dropped of
 *  events with no time, and ordered within the match. `finalWhistle` is the
 *  fixture's own `clock.secs`, which the round read carries beside it. */
export function plWireLines(
  fixtureId: number,
  lines: readonly { id: number; type: string; minute: string; seconds: number; text: string }[],
  names: ReadonlyMap<string, string>,
  finalWhistle: number | null,
): ProseLine[] {
  const out: ProseLine[] = [];
  for (const line of lines) {
    if (!WIRE_TYPES.has(line.type)) continue;
    const ends = line.type === FULL_TIME;
    out.push({
      id: `${fixtureId}:${line.id}`,
      minute: ends ? "FT" : line.minute,
      text: shortProse(line.text, names),
      seconds: ends ? (finalWhistle ?? line.seconds) : line.seconds,
    });
  }
  return out;
}
