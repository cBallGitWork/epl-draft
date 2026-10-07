import { positionsLabel } from "../../positions";
import { DASH } from "@epl/core";

// What our Fantrax league fields a man as — `D`, `M/F` — in the index block down a squad list's left:
// Fantrax's letters, never his real position, set small and truncated where `D/M/F` will not fit.

const TITLE = "What our Fantrax league will field him as";

/** The tile's column, held at full width so a pinned column beside it knows where it ends. */
export const TILE_WIDTH = "w-10 min-w-10 lg:w-14 lg:min-w-14";

/** The block as a table cell (`cell`), filling its row like every other index, or as a
 *  fixed tile at the head of a list row. */
export default function PositionTile({
  positions,
  cell = false,
  className = "",
}: {
  positions: readonly string[];
  cell?: boolean;
  /** Extra classes on the cell — a board that scrolls sideways pins it with `sticky`. */
  className?: string;
}) {
  const label = (
    <span className="block w-full truncate px-0.5 text-center">{positionsLabel(positions) ?? DASH}</span>
  );
  return cell ? (
    <td className={`cm-index text-2xs ${TILE_WIDTH} ${className}`} title={TITLE}>
      {label}
    </td>
  ) : (
    <span className="cm-index grid h-7 w-10 shrink-0 place-items-center text-2xs" title={TITLE}>
      {label}
    </span>
  );
}
