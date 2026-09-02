import Columns from "./Columns";
import PremShell from "./Shell";
import Skeleton from "../components/shell/Skeleton";

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
    <PremShell title="League Table" current="table" rows={ROWS}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <Columns sort="place" descending={false} />
          <tbody>
            {Array.from({ length: ROWS }, (_, at) => (
              <tr key={at} className="border-b border-bg">
                <td className="cm-index px-1.5">
                  <Skeleton width="w-4" height="h-3" />
                </td>
                <td className="pl-2">
                  <span className="cm-row flex min-h-11 items-center gap-2">
                    <Skeleton width="w-[var(--row-badge)]" height="h-[var(--row-badge)]" circle />
                    <Skeleton width="w-24" height="h-4" />
                  </span>
                </td>
                {/* Eight figure columns and the form guide — `COLUMNS` minus the
                    place and the club, which are drawn above. */}
                {Array.from({ length: 9 }, (_, cell) => (
                  <td key={cell} className="px-1.5">
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
