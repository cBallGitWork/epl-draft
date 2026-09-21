import { type BreakdownLine, signed } from "@epl/core";
import Note from "./Note";
import { FACT_LABEL, HEAD_PLATE, HEAD_PLATE_END, LABEL } from "@/app/desk";

// The itemised table: one row per category that moved his total, then the total.
//
// Read from Fantrax, never computed — which is why the rows sum to the footer
// without anything checking that they do.
//
// **Three columns and not two** (Craig, 21 Sep 2026: "points breakdown needs the
// value and the points"). "Minutes Played +2" is a price with the thing it
// priced left out; the count comes off the live payload — see `livescoring.ts`.
//
// **A gain is green** (same day: "pts should be in green when position"), which
// is DESIGN §3's direction pair: a breakdown is the one table in the app where
// every row is a gain or a loss.
//
// Split out of `LivePlayerCard` when that file crossed CODE_RULES §4's ceiling.

/** The points column's width, named because three cells must agree or the
 *  column steps: the head plate, each row's figure, and the total. Local to this
 *  file — it is one table's column, not a recipe anything else wants. */
const PTS_COLUMN = "w-16";

export default function Breakdown({
  breakdown,
  points,
  reserve,
  minutes,
}: {
  breakdown: BreakdownLine[];
  points: number | null | undefined;
  reserve: boolean;
  /** What FPL says he actually played. The one thing that can tell "Fantrax has
   *  not named him yet" from "he did nothing". */
  minutes: number;
}) {
  // Three states and they are three different sentences. No table at all is
  // Fantrax refusing; a table that does not name him is a dash; a table that
  // gives him a number with no categories behind it is a real nought.
  if (points === undefined) {
    return (
      <Note>
        Fantrax would not give us this team&apos;s points, so there is nothing to break down. What
        he did is below, from FPL.
      </Note>
    );
  }

  return (
    <div className="flex flex-col">
      {/* CM's column head: a bevelled strip, and the ruler is over the FIGURES.
          The count column carries no head because there is no one word for it —
          it is minutes on one row and goals on the next. */}
      <div className="flex items-stretch gap-px">
        <span className={`${HEAD_PLATE} min-w-0 flex-1 ${LABEL}`}>This gameweek</span>
        <span className={`${HEAD_PLATE_END} ${PTS_COLUMN} ${LABEL}`}>Pts</span>
      </div>

      <div className="cm-panel flex flex-col">
        {breakdown.length === 0 ? (
          <p className="px-3 py-2 text-2xs text-muted">
            {/* Four claims and not one sentence: a RESERVE is absent because the
                table names the eleven; a total with no parts is a category this
                league's scoring does not describe; and a nought with minutes on
                it is a different man from a nought without. */}
            {reserve
              ? "On the bench this gameweek, so our league scores him nothing — whatever he did."
              : points
                ? "Fantrax scored him, but did not say what for."
                : minutes > 0
                  ? "Nothing has scored for him yet."
                  : "Nothing has scored for him yet — his minutes have not registered either."}
          </p>
        ) : (
          <ul className="cm-rows flex flex-col">
            {breakdown.map((line) => (
              <li key={line.code} className="flex min-h-8 items-center gap-2 px-2">
                {/* Fantrax's own definition sits behind the label. It is where
                    they publish the rules a manager would otherwise have to guess
                    — what counts as a clean sheet is their sentence, not ours. */}
                <span className={FACT_LABEL} title={line.definition ?? undefined}>
                  {line.name}
                </span>
                {/* Quiet, because the column the reader is scanning is the one
                    on the right. Absent rather than nought where the season
                    table's FPTS view has spent the count (DESIGN §7). */}
                <span className="numeric w-10 shrink-0 text-right text-sm text-muted">
                  {line.value ?? "—"}
                </span>
                <span
                  className={`numeric ${PTS_COLUMN} shrink-0 pr-1.5 text-right text-sm font-bold ${tone(line.points)}`}
                >
                  {signed(line.points)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 border-t border-line px-2 py-1.5">
          <span className={`min-w-0 flex-1 ${LABEL}`}>Total</span>
          <span
            className={`numeric ${PTS_COLUMN} shrink-0 pr-1.5 text-right text-xl font-bold leading-none ${
              points === null ? "text-faint" : tone(points)
            }`}
          >
            {points ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The direction pair, and nought is neither. A zero row reached in a positive
 *  branch would be green, which would call a man who earned nothing a gain. */
function tone(points: number): string {
  if (points > 0) return "text-up";
  return points < 0 ? "text-bad" : "text-muted";
}
