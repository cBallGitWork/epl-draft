import Link from "next/link";
import Image from "next/image";
import { DASH, crestForShortName } from "@epl/core";
import PositionTile, { TILE_WIDTH } from "../../components/league/PositionTile";
import { MUTE, SortHead } from "../../components/league/TableHeads";
import { ROW_LINK } from "../../components/league/TableCells";
import { positionsLabel } from "../../positions";
import { BOARD, HEAD_CELL, LABEL, ROW_FIGURE, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";
import { playerHref } from "../routes";
import { projectionFigure, type ProjectionRow, type ProjectionSort } from "./rows";

// The model's table: each man's projected FPL points for the window, the total last and bold, all in cyan (ours).
// The phone carries position on the name's second line; the desk adds CM's tile and the minutes the model expects.

export default function ProjectionBoard({
  rows,
  gameweeks,
  sort,
  descending,
  href,
}: {
  rows: readonly ProjectionRow[];
  gameweeks: readonly number[];
  sort: ProjectionSort;
  descending: boolean;
  /** Where a head's sort link points, given its key and the direction it would set. */
  href: (key: ProjectionSort, descending: boolean) => string;
}) {
  const heads: { key: ProjectionSort; label: string; title: string; desk?: true }[] = [
    ...gameweeks.map((gw) => ({ key: `gw${gw}`, label: String(gw), title: `Gameweek ${gw}: projected FPL points` })),
    { key: "tot", label: "Tot", title: `GW${gameweeks[0]}–${gameweeks.at(-1)} added up: FPL scoring, never Fantrax's` },
    { key: "xmins", label: "xMins", title: "The minutes the model expects him to play, a week", desk: true },
  ];

  return (
    // No edge fade: at 390 the board fits and its last column is the answer; at 320 the scroll bar says there is more.
    <div className="relative">
      <div className={`cm-scroll bg-surface ${SCROLL}`}>
        <table className={BOARD}>
          <thead>
            <tr className="text-2xs">
              <th scope="col" className={`${HEAD_CELL} ${PIN_TILE} ${TILE_WIDTH} bg-surface`}>
                <span className={MUTE}>Fantrax position</span>
              </th>
              <th scope="col" className={`${HEAD_CELL} ${PIN_NAME}`}>
                <span className={MUTE}>Player</span>
              </th>
              {heads.map((head) => (
                <SortHead
                  key={head.key}
                  width={head.desk ? "max-lg:hidden" : ""}
                  compact
                  title={head.title}
                  href={href(head.key, head.key === sort ? !descending : true)}
                  label={head.label}
                  sorted={head.key === sort ? (descending ? "descending" : "ascending") : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code} className={`${ROW_RULE} hover:bg-raised`}>
                <PositionTile positions={row.positions} cell className={PIN_TILE} />
                <td className={PIN_NAME}>
                  <Lead row={row} />
                </td>
                {row.weeks.map((points, at) => (
                  <td key={gameweeks[at]} className={`${FIGURE} ${points === 0 ? "text-faint" : "text-info"}`}>
                    {points === null ? DASH : points.toFixed(1)}
                  </td>
                ))}
                <td className={`${FIGURE} font-bold text-info`}>{row.total === null ? DASH : row.total.toFixed(1)}</td>
                <td className={`${FIGURE} text-info max-lg:hidden`}>
                  {projectionFigure(row, "xmins", gameweeks) ?? DASH}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** His crest and name, and under it (on a phone) his Fantrax position and club; a link when the pool holds him. */
function Lead({ row }: { row: ProjectionRow }) {
  const crest = crestForShortName(row.club);
  const face = (
    <>
      <span className="grid size-6 shrink-0 place-items-center">
        {crest ? <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>
          <span className="lg:hidden">{row.name}</span>
          <span className="hidden lg:inline">{row.fullName}</span>
        </span>
        <span className="flex min-w-0 items-baseline gap-1 text-2xs leading-tight lg:ml-auto lg:shrink-0">
          <span className={`${LABEL} w-7 shrink-0 lg:hidden`}>{positionsLabel(row.positions) ?? DASH}</span>
          <span className="text-muted">{row.club}</span>
        </span>
      </span>
    </>
  );
  return row.fantraxId === null ? (
    <span className={`${ROW_LINK} w-34 px-1.5 hover:no-underline lg:w-80`}>{face}</span>
  ) : (
    <Link href={playerHref(row.fantraxId)} className={`${ROW_LINK} w-34 px-1.5 lg:w-80`}>
      {face}
    </Link>
  );
}

/** Centred under its head, a little tighter under a thumb. */
const FIGURE = `numeric px-1 text-center lg:px-1.5 ${ROW_FIGURE}`;

/** The tile is the desk's; the lead is pinned while the weeks scroll under it. */
const PIN_TILE = "hidden lg:table-cell sticky left-0 z-10";
const PIN_NAME = "sticky left-0 z-10 border-r border-line bg-surface p-0 lg:left-14";
