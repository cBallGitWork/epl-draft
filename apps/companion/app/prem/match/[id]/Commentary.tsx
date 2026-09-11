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
 *  It is no longer the ONLY thing doing it: `withoutFouls` takes the two types
 *  that are a foul out of both callers' feeds, which is 42.9% of the rows
 *  counted across a round. The docblock this replaced said "a report is
 *  everything"; that was written before anyone counted. */
export default function Line({ line }: { line: PlCommentaryLine }) {
  const word = LOUD[line.type];
  return (
    <li className="flex min-h-11 items-stretch gap-2 lg:min-h-9">
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
      {word === undefined ? null : (
        <span
          className={`flex shrink-0 items-center gap-1 ${SMALL_CAPS} ${TONE[line.type] ?? "text-ink"}`}
        >
          {(() => {
            const glyph = glyphFor(line.type);
            return glyph === undefined ? null : <EventIcon glyph={glyph} />;
          })()}
          {word}
        </span>
      )}
      <span
        className={`flex min-w-0 flex-1 items-center py-1 ${
          word === undefined ? "text-2xs text-muted" : `${ROW_NAME} text-ink`
        }`}
      >
        {line.text}
      </span>
    </li>
  );
}

/** The things that change a match, and the word this app calls each one.
 *
 *  Keyed on Opta's own type strings, measured across gameweeks 1-3 rather than
 *  guessed. The VALUES are `matchday/Wire`'s vocabulary — the same seven events
 *  get the same seven words on both screens, which is the unification this run
 *  has been doing everywhere else.
 *
 *  A type this map does not name still prints; it is simply quiet, and has no
 *  label at all. */
const LOUD: Record<string, string> = {
  goal: "Goal",
  "penalty goal": "Pen",
  "own goal": "OG",
  "VAR cancelled goal": "VAR",
  "yellow card": "Booked",
  "red card": "Sent off",
  substitution: "Sub",
};

/** A red card and an own goal are the negative slot; a yellow one is NOT the
 *  accent slot, because yellow means "yours" on five other screens and a second
 *  meaning for it would break the one reading aid they share (`Wire` carries the
 *  same ruling). */
const TONE: Record<string, string> = {
  "red card": "text-bad",
  "own goal": "text-bad",
  "VAR cancelled goal": "text-bad",
};
