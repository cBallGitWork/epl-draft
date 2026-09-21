import Link from "next/link";
import type { Measure } from "@epl/core";

// Which of the two numbers every cell on the board is holding.
//
// **It used to be a pair of column heads, and the board outgrew that.** With one
// category on screen, `FPts` and `Total` could each be a column and the reader
// saw both at once; with a whole group on screen they would be eight columns of
// alternating meaning. So the choice moved to the top of the board, where it is
// made once and said once (Craig, 11 Sep 2026: *"at the top, allow a toggle
// between fantasy points and actual raw values"*).
//
// **Grey and not blue**, which DESIGN §2's table decides rather than taste: the
// grey plate is "something you press" and the pressed grey plate is "the view
// you are on". The blue strip is navigation, and this screen already carries two
// of those — the section nav above and the stat groups along the foot. A third
// blue bar would be three objects of one colour with nothing ranking them.
//
// A link and not a button, for the reason the sort heads give: the server does
// the work, the phone gets HTML, and the choice survives being shared.
//
// *The plate recipe is written out here rather than imported. `players/
// BoardControls` holds the only other spelling of it (`PLATE_TYPE`/`PRESSABLE`),
// and its own docblock says promoting it is the day a second board wants the
// row. This is that second board, which CODE_RULES §1 leaves duplicated; the
// third takes both to `desk.ts`.*

/** The two heads that came off the table, in the order they stood in it. */
const MEASURES: readonly { by: Measure; label: string; title: string }[] = [
  { by: "points", label: "FPts", title: "What Fantrax paid for each category" },
  { by: "value", label: "Total", title: "The raw figure behind each category" },
];

/** The control floor at both widths — a plate is aimed at rather than read, and
 *  DESIGN §6 does not let one relax below its floor under a thumb. */
const PLATE = "flex min-h-11 items-center px-3 text-2xs font-bold uppercase lg:min-h-9";

export default function Measures({
  measure,
  href,
}: {
  measure: Measure;
  /** Where each plate leads. The page spells its own query, so this knows
   *  nothing about the group or the category it has to carry through. */
  href: (measure: Measure) => string;
}) {
  return (
    <div role="group" aria-label="Which figure the board shows" className="flex">
      {MEASURES.map((entry) => {
        const on = entry.by === measure;
        return (
          <Link
            key={entry.by}
            href={href(entry.by)}
            title={entry.title}
            aria-pressed={on}
            // The plate owns its ink at 7.52:1, so no `text-*` here — and the
            // pressed one takes no hover, because a thing already held down does
            // not lift.
            className={on ? `cm-bevel-pressed ${PLATE}` : `cm-bevel hover:brightness-110 ${PLATE}`}
          >
            {/* The pressed bevel is the state and the tick says it again in a
                SHAPE — the grey plate cannot carry the accent (2.27:1), so
                colour is not available to say it twice. */}
            {on ? (
              <span aria-hidden className="pr-1 text-[0.625rem] leading-none">
                ✓
              </span>
            ) : null}
            {entry.label}
          </Link>
        );
      })}
    </div>
  );
}
