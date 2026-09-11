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
  const spellings = new Map<string, string>();
  for (const [long, short] of names) {
    for (const spelling of ampersandVariants(long)) spellings.set(spelling, short);
  }
  const longest = [...spellings.keys()].sort((a, b) => b.length - a.length);
  const alternation = longest.map(escapeForRegExp).join("|");

  return (
    text
      // The brackets first, and as their own pass — what is inside them is a long
      // name, so stripping after the replacement would be looking for "(Spurs)".
      .replace(new RegExp(` \\((?:${alternation})\\)`, "g"), "")
      .replace(new RegExp(alternation, "g"), (found) => spellings.get(found) ?? found)
  );
}

/** The spellings one club name can arrive in, which is two whenever it holds an
 *  ampersand.
 *
 *  **The fixture payload and the commentary do not agree**, and nothing said so
 *  until a screenshot did: `teams[].team.name` is `Brighton & Hove Albion` and
 *  Opta's prose writes `Brighton and Hove Albion`. A map keyed on the payload's
 *  spelling therefore matched nothing for that club — Brighton's name was
 *  printed in full down a whole match report while Aston Villa beside it read
 *  `AVL`, which is the tell. Counted 11 Sep 2026: one club in twenty carries an
 *  ampersand, so this is one club's bug and it was invisible in the other
 *  nineteen.
 *
 *  Both directions, because which spelling a provider prefers is not ours to
 *  assume — a payload that starts writing `and` should keep working.
 *
 *  A club name is data from a provider, so it is escaped rather than trusted to
 *  contain no metacharacter. `Nott'm Forest` is the one that already carries
 *  punctuation and there is nothing stopping the next one carrying more. */
function ampersandVariants(name: string): string[] {
  const swapped = name.includes(" & ")
    ? name.replaceAll(" & ", " and ")
    : name.includes(" and ")
      ? name.replaceAll(" and ", " & ")
      : null;
  return swapped === null ? [name] : [name, swapped];
}

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

/** One run of Opta's sentence, and what it is.
 *
 *  `event` is the clause the line opens with — `Attempt blocked.`, `Goal!`,
 *  `Corner, MUN.` — which is Opta's own summary of the row before any detail.
 *  `name` is a man the two team sheets know. Everything else is `plain`. */
export interface ProseSpan {
  text: string;
  kind: "event" | "name" | "plain";
}

/** Opta's sentence split so a screen can set the two things a reader scans for
 *  apart from the rest.
 *
 *  Craig, 11 Sep 2026: *"have player names in white on rows, and the event (like
 *  attempted blocked"*. A commentary row is one grey paragraph; the two things
 *  an eye actually looks for in it are WHAT happened and WHO it happened to, and
 *  both are findable without paraphrasing a word.
 *
 *  **The event clause is structural, not guessed.** Every line opens with one and
 *  closes it with `.` or `!` — `Attempt blocked.`, `Goal!`, `Substitution, IPS.`
 *  — so it is the head of the string up to the first of either. A line with
 *  neither is one clause and is returned whole.
 *
 *  **The names are looked up, never pattern-matched.** A capitalised word is not
 *  a name (`Second Half`, `VAR`, `MUN`), so the caller passes the men both team
 *  sheets actually carry and nothing else is marked. Longest first, for the same
 *  reason `shortProse` sorts that way: `Alex Iwobi` must win against `Iwobi`.
 *
 *  Pure, and it paraphrases nothing — every span concatenated is the input
 *  string, character for character, which is what the round-trip test asserts. */
export function proseSpans(text: string, names: Iterable<string>): ProseSpan[] {
  // A line that never closes a clause is one clause, and all of it is the event.
  const head = text.search(/[.!]/);
  if (head === -1) return [{ text, kind: "event" }];

  const spans: ProseSpan[] = [{ text: text.slice(0, head + 1), kind: "event" }];
  const rest = text.slice(head + 1);

  const known = [...names].filter((name) => name.length > 0).sort((a, b) => b.length - a.length);
  if (known.length === 0) {
    if (rest.length > 0) spans.push({ text: rest, kind: "plain" });
    return spans;
  }

  const finder = new RegExp(known.map(escapeForRegExp).join("|"), "g");
  let at = 0;
  for (const found of rest.matchAll(finder)) {
    const start = found.index;
    if (start > at) spans.push({ text: rest.slice(at, start), kind: "plain" });
    spans.push({ text: found[0], kind: "name" });
    at = start + found[0].length;
  }
  if (at < rest.length) spans.push({ text: rest.slice(at), kind: "plain" });

  return spans;
}
