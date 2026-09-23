import { proseSpans, saysInjury } from "@epl/core";
import type { PlCommentaryLine } from "@epl/core";
import EventIcon, { glyphFor } from "../../../components/football/EventIcon";
import { ROW_NAME, SMALL_CAPS } from "@/app/desk";

// Opta's commentary, as rows.
//
// **Two callers, and that is why it is a file.** The Match Report tab prints the
// whole feed under its summary, and the Overview prints it under the goals
// (Craig, 11 Sep 2026: *"leave a bit of space under the goals, and have the
// match report underneath"*). CODE_RULES §1 leaves two occurrences duplicated —
// and would here too, if what was duplicated were small. It is a row, an icon
// map, a tone map and the argument for all three; the two copies would be
// seventy lines apart and free to disagree about what a goal looks like. Both
// callers are in this folder, so it is co-located rather than promoted to
// `components/`.

/** One line: the minute in CM's blue block, what it was, and what happened.
 *
 *  The same three columns the Live tab's wire uses, because it is the same
 *  object read a different way — a minute, a kind, and a sentence. What differs
 *  is that the sentence here is Opta's own and the wire's is a name.
 *
 *  **The loud kinds are loud and the rest are not.** A commentary feed is mostly
 *  corners and blocked shots; printing all of it at one weight is a wall, which
 *  is the same argument `Wire` makes for filtering rather than printing 1,083
 *  events. The emphasis does that work here.
 *
 *  It is no longer the ONLY thing doing it: `worthReading` takes the two types
 *  that are a foul out of both callers' feeds, which is 42.9% of the rows
 *  counted across a round. The docblock this replaced said "a report is
 *  everything"; that was written before anyone counted. */
export default function Line({
  line,
  names = [],
}: {
  line: PlCommentaryLine;
  /** Every man on either team sheet, as Opta's own prose spells him. Empty is a
   *  fine answer — the sentence then prints as one run, which is what it did
   *  before this existed. */
  names?: readonly string[];
}) {
  // **An injury is not a TYPE, it is a substitution whose sentence says why**
  // (Craig, 11 Sep 2026: *"i want them ON the commentary"*). Opta files it as an
  // ordinary `substitution` and ends the line `because of an injury.`, so the
  // row that draws it asks `saysInjury` rather than looking the type up. It
  // takes the cross and the negative slot: a change forced is not a change
  // chosen, and it is the one thing in a commentary feed that is bad news about
  // a man rather than about a scoreline.
  const hurt = saysInjury(line);
  const word = hurt ? "Injury" : LOUD[line.type];
  const tone = hurt ? "text-bad" : (TONE[line.type] ?? "text-muted");
  const toned = hurt || TONE[line.type] !== undefined;
  return (
    // **`shrink-0`, and it is a bug fix rather than a tidy.** `PANEL_FLUSH` is a
    // flex COLUMN, and the Overview caps its copy of this list at `60dvh` — so
    // sixty-one rows in a box that holds a dozen were each shrunk to their
    // `min-h-11` and drew their own text over the row below. Measured rather
    // than eyeballed: every row `height: 44` against a `scrollHeight` of 58 and
    // 67 on the two that wrap. A `min-height` is not a floor inside a flex
    // parent that has run out of room; `flex-shrink: 0` is.
    <li className="flex min-h-9 shrink-0 items-stretch gap-2 lg:min-h-8">
      {/* `w-11`, because stoppage time reads `90+7` and CM's block is a fixed
          chip. The wire's is `w-9` and never has to hold one. */}
      <span className="cm-index numeric flex w-11 shrink-0 items-center justify-center">
        {line.minute}&prime;
      </span>
      {/* **A label only where it is a MARKER**, which is the fix and not a
          tidy-up: Opta's own sentence already says what happened — "Foul by
          Lewis Cook (Bournemouth)" under a label reading FREE KICK LOST is the
          same fact twice, and the label was three lines tall to say it. Their
          type strings are written for a machine ("attempt saved", "free kick
          won"), and the seven that change a match are the seven worth calling
          out. The rest is prose, and prose is what a report is. */}
      {/* **The glyph stands beside the word, never instead of it.** A reader who
          does not know the icon has the word to fall back on, and the icon takes
          `currentColor` so it wears whichever tone the row already had — a red
          card's glyph is red because the row is. */}
      {/* **Every row is marked** (Craig, 11 Sep 2026: *"maybe we have symbols for
          all rows"*), so this column is never empty and the prose beside it
          always starts at the same place. The word is the extra, not the mark. */}
      <span className={`flex shrink-0 items-center gap-1 ${SMALL_CAPS} ${tone}`}>
        <EventIcon glyph={hurt ? "cross" : glyphFor(line.type)} />
        {word}
      </span>
      {/* **The two things an eye scans a commentary row for**, set apart from the
          rest of the sentence without a word of it being changed (Craig, 11 Sep
          2026: *"have player names in white on rows, and the event (like
          attempted blocked"*). `proseSpans` finds the opening clause
          structurally and the men by LOOKING THEM UP, which is why `Second
          Half`, `MUN` and `VAR` are not marked.

          A row that already carries a tone keeps it and takes weight instead:
          on a goal line everything is the accent, so white would be a third
          colour on a row that is already saying one thing.

          **`py-2` under a thumb** (Craig: *"more row space when event wraps onto
          two rows om mobile"*). At 390 a shot with an assist runs to three
          lines and `py-1` had them touching the rules above and below. The desk
          keeps its own, where the same sentence is one line. */}
      <span
        className={`flex min-w-0 flex-1 items-center py-1 ${ROW_NAME} ${tone} lg:py-0.5`}
      >
        <span>
          {proseSpans(line.text, names).map((span, at) => (
            <span
              key={`${at}-${span.text}`}
              className={
                span.kind === "plain" ? undefined : toned ? "font-bold" : "font-bold text-ink"
              }
            >
              {span.text}
            </span>
          ))}
        </span>
      </span>
    </li>
  );
}

/** The one event whose own sentence does not say what it is, and the word for it.
 *
 *  **The rule, and it is measurable rather than a matter of taste: a label
 *  survives only where Opta's sentence does not already lead with it.** Six
 *  types carried one on 11 Sep 2026 and five came off, one at a time, as Craig
 *  read each on the screen. Their wordings, read off gameweeks 1-3 rather than
 *  remembered:
 *
 *    - `goal` — `Goal! ARS 2, AVL 0.` The label was the first word.
 *    - `substitution` — `Substitution, Fulham.` The same.
 *    - `own goal` — `Own Goal by Victor Lindelöf, Aston Villa.` `OG` is the
 *      first two words abbreviated, which I twice argued it was not.
 *    - `VAR cancelled goal` — `GOAL OVERTURNED BY VAR: …`. The label is in the
 *      opening clause, in capitals.
 *    - `yellow card` / `red card` — `is shown the yellow card for a bad foul`.
 *      These two do not open with it, and went anyway: the row already carries a
 *      card glyph in the card's own colour, so the word was the third statement
 *      of one fact.
 *
 *  **`penalty goal` is the survivor**, and it is the only one that passes:
 *  `Goal! Newcastle United 2, Liverpool 2. Szoboszlai converts the penalty…`
 *  opens like any other goal and says which kind halfway through a long
 *  sentence. `Pen` is the scan aid that buys.
 *
 *  **An INJURY substitution keeps a word too**, and is the one entry not in this
 *  map — `saysInjury` decides it, because an injury is not an Opta type. Its
 *  sentence does not reach the word until its last four, which is exactly what a
 *  reader is scanning for.
 *
 *  A type this map does not name still prints, marked by its glyph and its tone.
 */
const LOUD: Record<string, string> = {
  "penalty goal": "Pen",
};

/** What each row is set in, and this is the whole of how a reader finds the
 *  match inside the play.
 *
 *  **The cards own the card colours and a goal takes GREEN** (Craig, 11 Sep
 *  2026: *"yellow card has red, make goals green or light blue"*). A booking and
 *  a goal were both the accent for an hour, which put the one mark on this
 *  screen whose colour is its NAME — a yellow card is yellow — beside something
 *  that is not a card at all. Yellow is the booking's, red is the sending off's,
 *  and a goal is `--color-up`: "a gain", which is the slot's own wording and is
 *  exactly what a goal is. 9.9:1 on this ground.
 *
 *  **The accent on a booking still reverses a ruling**, and the reason holds.
 *  The docblock this replaced refused any accent here: yellow means "yours" on
 *  five other screens. That argument was made when this row's emphasis was SIZE
 *  — loud rows at `ROW_NAME` in ink, quiet ones three steps down in grey — and
 *  the size gap has gone, because a report set that small was unreadable. With
 *  every row at one size the ink does the work the size was doing, and on a
 *  screen holding no fantasy team there is no "yours" to confuse it with.
 *  `Wire` is a round of ten matches and keeps the old ruling.
 *
 *  A red card, an own goal and a cancelled goal stay in the negative slot; they
 *  are the one thing on this screen that is bad news rather than loud news.
 *
 *  Everything else is `text-muted` — still fully legible at `ROW_NAME`, and a
 *  step back from the four kinds that decided the match. */
const TONE: Record<string, string> = {
  goal: "text-up",
  "penalty goal": "text-up",
  "yellow card": "text-accent",
  "red card": "text-bad",
  "own goal": "text-bad",
  "VAR cancelled goal": "text-bad",
};
