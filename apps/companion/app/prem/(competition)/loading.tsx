import Columns, { COLUMNS } from "../Columns";
import PremShell from "../Shell";
import Skeleton from "../../components/shell/Skeleton";
import { BOARD, ROW_RULE, SCROLL } from "@/app/desk";

// What the table looks like while FPL is answering.
//
// The REAL shell and the REAL column heads, with only the figures standing in.
// A skeleton that draws its own approximation of the chrome is a second copy of
// the screen to keep in step, and `league/loading.tsx` sets the same rule: the
// strip, the caption and the head plates are the ones the page itself uses, so
// the wait and the arrival are the same object with the numbers filled in.

/** Twenty, because that is the division and because a panel drawn to hold six
 *  rows and then filled with twenty jumps under the reader's thumb. */
const ROWS = 20;

export default function Loading() {
  return (
    <PremShell current="table" rows={ROWS}>
      <div className={SCROLL}>
        <table className={BOARD}>
          <Columns sort="place" descending={false} />
          <tbody>
            {Array.from({ length: ROWS }, (_, at) => (
              <tr key={at} className={ROW_RULE}>
                <td className="cm-index px-1.5">
                  <Skeleton width="w-4" height="h-3" />
                </td>
                <td className="pl-2">
                  <span className="cm-row flex min-h-11 items-center gap-2">
                    <Skeleton width="w-[var(--row-badge)]" height="h-[var(--row-badge)]" circle />
                    <Skeleton width="w-24" height="h-4" />
                  </span>
                </td>
                {/* Read off `COLUMNS` rather than written out: the place and
                    the club are drawn above, and the rest is whatever the table
                    declares. A literal here is the exact bug `Columns.tsx` says
                    it exists to prevent — the heads and the skeleton drifting
                    apart the day a column is added. It takes each column's
                    `width` too, which carries VISIBILITY as well as size: a
                    count alone drew eleven cells on a phone the answer fills
                    with eight, and the table jumped sideways on arrival. */}
                {COLUMNS.slice(2).map((column) => (
                  <td key={column.key} className={`px-1.5 ${column.width}`}>
                    <Skeleton width="w-full" height="h-3" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PremShell>
  );
}
