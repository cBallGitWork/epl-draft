import Columns, { COLUMNS, deskOnly } from "../Columns";
import PremShell from "../Shell";
import Skeleton from "../../components/shell/Skeleton";
import { BOARD, ROW_RULE, SCROLL } from "@/app/desk";

// The table while FPL answers: the real shell and column heads, with only the figures standing in.
// `Skeleton` sizes go into an inline style, so they are CSS lengths; a Tailwind class draws nothing.

/** The division's size, so the panel does not jump when the table arrives. */
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
                  <Skeleton width="1rem" height="0.75rem" />
                </td>
                <td className="pl-2">
                  <span className="cm-row flex min-h-11 items-center gap-2">
                    <Skeleton width="var(--row-badge)" height="var(--row-badge)" circle />
                    <Skeleton width="6rem" height="1rem" />
                  </span>
                </td>
                {/* The rest off `COLUMNS`, with each `width` and phone visibility, so nothing jumps. */}
                {COLUMNS.slice(2).map((column) => (
                  <td key={column.key} className={`px-1.5 ${column.width} ${deskOnly(column.key, "place")}`}>
                    <Skeleton width="100%" height="0.75rem" />
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
