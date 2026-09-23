import { positionsLabel } from "../../positions";
import { DASH } from "@epl/core";

// What our Fantrax league fields a man as — `D`, `M/F` — in the index block down a squad list's
// left (Craig, 21 Sep and 23 Sep 2026). Fantrax's letters, never his real position. Letters, not
// an ordinal, so smaller than the block's own size and truncated where `D/M/F` will not fit.

const TITLE = "What our Fantrax league will field him as";

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
    <td className={`cm-index w-10 text-2xs lg:w-14 ${className}`} title={TITLE}>
      {label}
    </td>
  ) : (
    <span className="cm-index grid h-7 w-10 shrink-0 place-items-center text-2xs" title={TITLE}>
      {label}
    </span>
  );
}
