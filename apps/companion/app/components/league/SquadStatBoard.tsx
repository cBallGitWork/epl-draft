import Image from "next/image";
import type { BreakdownLine, CategoryPair, SquadPlayerDetail } from "@epl/core";
import { crestUrl, fullPlayerName, DASH } from "@epl/core";
import { positionLabel } from "../../positions";
import {
  BOARD,
  BOARD_FIGURE,
  HEAD_CELL,
  HEAD_PLATE,
  HEAD_PLATE_END,
  ROW_RULE,
  SCROLL,
  STICKY_LEAD,
} from "@/app/desk";
import { MUTE } from "./TableHeads";
import Absent from "@/app/components/shell/Absent";

// One squad against the league's own scoring categories — every man, every
// category, which is what the head-to-head's compare board says about a side and
// this says about the fifteen men inside it.
//
// **The columns are LEAGUE data and are never written down here.** They come off
// `compareCategories`, which unions both squads' breakdowns — so the two sides of
// a tie carry the same columns in the same order and can be read against each
// other, and a commissioner who adds a category gets a column without an edit.
// Hardcoding `G · A · CS` would be the football layer's habit applied to the one
// layer whose rules are the product (CLAUDE.md).
//
// **A many-measure board, so every column stays and it scrolls sideways**
// (DESIGN §2, which names "a stats board, a match's player stats" as exactly this
// case). The name freezes; the figures slide under it. `prem/match/[id]/
// PlayerStats` is the worked example and `players/PlayerTable` settled the
// pattern.
//
// **`Pts` freezes WITH the name, and that is DESIGN §2's other rule about a
// phone table**: "which shape it is is decided by its LAST column", and a table
// whose last column is what it is FOR shows that column at 390. Measured — with
// the total left to scroll with the categories it was off the right edge of a
// 390 screen on the first draw, so the board answering "how many did he get"
// could be read without ever showing the answer. So the frozen block is the
// question and the reading; the categories are the workings, and they scroll.
//
// **Every figure is Fantrax's, priced at the roster slot his manager filed him
// in** — not at his default position, which is a different number for the 48 of
// 607 men eligible at two. The `Pts` column is OURS: it is their category lines
// added up, so DESIGN §7 forbids it the head `FPts`, which is Fantrax's word for
// a number this is not.

/** How much of the row the frozen block takes.
 *
 *  Narrow under a thumb on purpose: it carries a crest, a position, a name and
 *  the total, and at `w-36` it left 390px of screen with room for four category
 *  columns and none for a fifth. The name truncates rather than the board losing
 *  a measure — a surname is recoverable from a crest and a position, and a column
 *  that is not on screen is not. */
const LEAD_WIDTH = "w-[11.5rem] lg:w-64";

/** The cell the block sits in. The WIDTH is on the block and not here, because
 *  `min-w-max` on the table lets a long name beat a `<td>`'s width outright — it
 *  did, and "Dominic Calvert-Lewin" set a 256px lead on a 390px screen. */

export default function SquadStatBoard({
  rows,
  bench,
  columns,
  breakdown,
}: {
  /** The eleven, in their positional lines — flattened here, because a stat board
   *  is read down a column and the arrangement is the pitch's business. */
  rows: readonly { players: readonly SquadPlayerDetail[] }[];
  bench: readonly SquadPlayerDetail[];
  /** The categories to draw, in the order to draw them. Both sides of the tie are
   *  handed the same list. */
  columns: readonly CategoryPair[];
  /** Each man's category lines, keyed by Fantrax id. Empty when Fantrax refused
   *  the table, which is the whole board and not a row of it. */
  breakdown: Record<string, readonly BreakdownLine[]>;
}) {
  const eleven = rows.flatMap((line) => line.players);

  return (
    // Opaque, and the frozen column is why: a sticky lead has to hide the figures
    // passing under it, so it takes `bg-surface`. `PlayerStats` and the pool's
    // table both override the panel's translucency for the same reason.
    <div className={`${SCROLL} bg-surface`}>
      {/* `min-w-max` so the columns take their natural width and the BOARD
          scrolls, rather than the browser compressing eleven measures into 390px
          — which it does silently, and which is how the frozen block came out
          256px wide with the categories squeezed behind it. */}
      <table className={`${BOARD} min-w-max`}>
        <thead>
          <tr>
            <th className={`${HEAD_CELL} ${STICKY_LEAD}`}>
              <div className={`${HEAD_PLATE} ${LEAD_WIDTH}`}>
                {/* The name's head is muted to `sr-only` (DESIGN §2: the first
                    two columns of a table carry no head), so it holds no width —
                    and `Pts` slid left into the empty plate. The spacer is what
                    keeps the head over its own figures. */}
                <span className="flex-1">
                  <span className={MUTE}>Player</span>
                </span>
                {/* Ours, and headed with our own word for it: it is their category
                    lines added up, and `FPts` is Fantrax's name for a number this
                    is not (DESIGN §7). */}
                <span title="Our total of his scoring categories">Pts</span>
              </div>
            </th>
            {columns.map((column) => (
              <th key={column.code} className={HEAD_CELL} title={column.name}>
                <div className={HEAD_PLATE_END}>{column.code}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eleven.map((player) => (
            <PlayerRow
              key={player.rostered.slot.fantraxId}
              player={player}
              columns={columns}
              lines={breakdown[player.rostered.slot.fantraxId]}
            />
          ))}
          {bench.length === 0 ? null : (
            <>
              {/* The same separator the list uses, as a row rather than as a
                  plate above a second table — one board, one header. */}
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={columns.length + 1}
                  className="cm-bevel h-6 px-1.5 text-left text-2xs font-bold uppercase"
                >
                  Bench
                </th>
              </tr>
              {bench.map((player) => (
                <PlayerRow
                  key={player.rostered.slot.fantraxId}
                  player={player}
                  columns={columns}
                  lines={breakdown[player.rostered.slot.fantraxId]}
                  reserve
                />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlayerRow({
  player,
  columns,
  lines,
  reserve = false,
}: {
  player: SquadPlayerDetail;
  columns: readonly CategoryPair[];
  lines: readonly BreakdownLine[] | undefined;
  reserve?: boolean;
}) {
  // By code rather than by index: the columns are a union across both squads and
  // a man's own lines are only the categories he registered, so the two lists are
  // different lengths on every row.
  const byCode = new Map((lines ?? []).map((line) => [line.code, line.points]));
  // His own total, added from his own lines — which is the same arithmetic the
  // compare board does one level up, and the reason neither may be headed `FPts`.
  const total = lines === undefined ? null : lines.reduce((sum, line) => sum + line.points, 0);

  return (
    // A reserve is quieter, because the eleven is what scored. Dimmed rather than
    // dropped: a manager reading this wants to know what his bench did while it
    // sat, which is the argument the list makes for carrying it at all.
    <tr className={`${ROW_RULE} ${reserve ? "text-muted" : ""}`}>
      <td className={`p-0 ${STICKY_LEAD}`}>
        <div className={`cm-row flex min-h-11 items-center gap-1.5 px-1.5 ${LEAD_WIDTH}`}>
          <span className="grid h-6 w-6 shrink-0 place-items-center">
            {player.club ? (
              <Image
                src={crestUrl(player.club)}
                alt=""
                width={22}
                height={22}
                className="h-5 w-5 object-contain"
              />
            ) : null}
          </span>
          <span className="w-8 shrink-0 truncate text-3xs font-bold text-mid">
            {positionLabel(player.rostered.slot.position) ?? DASH}
          </span>
          <span className="min-w-0 flex-1 truncate font-chrome text-sm font-bold lg:text-base">
            {fullPlayerName(player.rostered)}
          </span>
          <span
            // **One step at both widths**, which is `ROW_FIGURE`'s own rule and
            // what `BOARD_FIGURE` gives every category cell on this row. A
            // `lg:text-base` here made one figure on the row a different size
            // from the eleven beside it, above `lg` only.
            className={`numeric shrink-0 text-right text-sm font-bold ${
              reserve ? "" : "text-accent"
            }`}
          >
            {total === null ? <Absent /> : total}
          </span>
        </div>
      </td>
      {columns.map((column) => {
        const points = byCode.get(column.code);
        // No line is a category he never registered; a 0 is Fantrax counting and paying nothing.
        return (
          <td key={column.code} className={BOARD_FIGURE}>
            {points === undefined ? (
              <Absent />
            ) : (
              <span className={points < 0 ? "text-bad" : ""}>{points}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
