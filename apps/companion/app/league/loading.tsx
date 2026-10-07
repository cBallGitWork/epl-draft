import { TIGHT_ROW } from "../components/league/TableCells";
import Columns, { COLUMNS, columnKey, shownAt } from "./Columns";
import LeagueShell from "./Shell";
import Skeleton from "../components/shell/Skeleton";
import { BOARD, ROW_RULE } from "@/app/desk";

// The table waiting on Fantrax: the real shell and heads, and rows in the shape the answer lands in.

/** A frame hint, never the league's size, which is read from `getLeagueInfo`. */
const ROWS = 6;

export default function Loading() {
  return (
    <LeagueShell current="table">
      <div aria-busy>
        <table className={BOARD}>
          <Columns sort="rank" descending={false} />
          <tbody>
            {Array.from({ length: ROWS }, (_, at) => (
              <tr key={at} className={ROW_RULE}>
                {COLUMNS.map((column) => (
                  // Width and visibility as the answer's, or the table jumps sideways when it lands.
                  <td key={columnKey(column)} className={`px-1 ${column.width} ${shownAt(column, "rank")}`}>
                    {column.key === "team" ? (
                      // The cell whose height sets the row's, so the real rows land in these boxes.
                      <span className={`${TIGHT_ROW} pl-1`}>
                        <Skeleton width="45%" height="0.875rem" />
                      </span>
                    ) : (
                      <span className="flex justify-center">
                        <Skeleton width="100%" height="0.75rem" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LeagueShell>
  );
}
