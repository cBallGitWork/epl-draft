import { type BreakdownLine, signed, DASH } from "@epl/core";
import Note from "./Note";
import { emptyBreakdownNote } from "./breakdownNote";
import { FACT_LABEL, HEAD_PLATE, HEAD_PLATE_CENTRE, LABEL, gainOrLoss } from "@/app/desk";

// The itemised table: one row per category that moved his total, then the total, read from the provider.

/** The head plate, each row's figure and the total share this width, or the column steps. */
const PTS_COLUMN = "w-16";

export default function Breakdown({
  breakdown,
  points,
  reserve,
  minutes,
  over,
}: {
  breakdown: BreakdownLine[];
  points: number | null | undefined;
  reserve: boolean;
  /** FPL's minutes: the one thing that tells "not named yet" from "did nothing". */
  minutes: number;
  /** Whether his match is finished, so an empty table reads as final rather than "yet". */
  over: boolean;
}) {
  // No table at all is Fantrax refusing; `emptyBreakdownNote` tells a dash from a real nought.
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
      {/* The count column has no head: it is minutes on one row and goals on the next. */}
      <div className="flex items-stretch gap-px">
        {/* Fantrax prices a reserve like anyone else; only his manager's total leaves him out. */}
        <span className={`${HEAD_PLATE} min-w-0 flex-1 ${LABEL}`}>
          {reserve ? "On the bench · not counted" : "This gameweek"}
        </span>
        <span className={`${HEAD_PLATE_CENTRE} ${PTS_COLUMN} ${LABEL}`}>Pts</span>
      </div>

      <div className="cm-panel flex flex-col">
        {breakdown.length === 0 ? (
          <p className="px-3 py-2 text-2xs text-muted">
            {emptyBreakdownNote(points, minutes, over)}
          </p>
        ) : (
          <ul className="cm-rows flex flex-col">
            {breakdown.map((line) => (
              <li key={line.code} className="flex min-h-8 items-center gap-2 px-2">
                {/* Fantrax's own definition of the category sits behind the label. */}
                <span className={FACT_LABEL} title={line.definition ?? undefined}>
                  {line.name}
                </span>
                {/* Quiet beside the points; a dash, not a nought, where there is no count (DESIGN §7). */}
                <span className="numeric w-10 shrink-0 text-center text-sm text-muted">
                  {line.value ?? DASH}
                </span>
                <span
                  className={`numeric ${PTS_COLUMN} shrink-0 text-center text-sm font-bold ${tone(line.points)}`}
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
            className={`numeric ${PTS_COLUMN} shrink-0 text-center text-xl font-bold leading-none ${
              points === null ? "text-faint" : tone(points)
            }`}
          >
            {points ?? DASH}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The direction pair, and nought is neither: a man who earned nothing is quiet, not a gain. */
function tone(points: number): string {
  return gainOrLoss(points) || "text-muted";
}
