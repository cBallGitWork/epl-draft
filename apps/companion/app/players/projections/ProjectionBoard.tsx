import Link from "next/link";
import Image from "next/image";
import { DASH, crestForShortName, gameweekSpan } from "@epl/core";
import PositionTile, { TILE_WIDTH } from "../../components/league/PositionTile";
import { MUTE, SortHead } from "../../components/league/TableHeads";
import { ROW_LINK } from "../../components/league/TableCells";
import { positionsLabel } from "../../positions";
import { BOARD, EDGE_FADE, HEAD_CELL, LABEL, ROW_FIGURE, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";
import { standoutInk } from "../../components/league/standout";
import { cutsFor } from "../standout";
import { playerHref } from "../routes";
import { projectionFigure, type ProjectionRow, type ProjectionSort } from "./rows";

// The model's table: minutes, the total and each week of the window, lit in ink like every Data board. The phone
// carries position on the name's second line; the desk adds CM's tile.

export default function ProjectionBoard({
  rows,
  gameweeks,
  category,
  sort,
  descending,
  href,
}: {
  rows: readonly ProjectionRow[];
  gameweeks: readonly number[];
  /** What the week columns hold, for the heads' titles. */
  category: string;
  sort: ProjectionSort;
  descending: boolean;
  /** Where a head's sort link points, given its key and the direction it would set. */
  href: (key: ProjectionSort, descending: boolean) => string;
}) {
  // Minutes first, then the total, then the weeks (Craig, 24 Sep 2026).
  const heads: { key: ProjectionSort; label: string; title: string }[] = [
    { key: "xmins", label: "xMins", title: "The minutes the model expects him to play, a week" },
    { key: "tot", label: "Tot", title: `${category}, ${gameweekSpan(gameweeks)} added up: FPL scoring, never Fantrax's` },
    ...gameweeks.map((gw) => ({ key: `gw${gw}`, label: String(gw), title: `Gameweek ${gw}: ${category}, projected` })),
  ];
  // Lit as the Players board lights a column: its best in orange, the rest of its top sixth in yellow.
  const cuts = cutsFor(
    heads.filter((head) => head.key !== "xmins"),
    (head) => rows.map((row) => projectionFigure(row, head.key, gameweeks)),
  );

  return (
    <div className="relative">
      <span aria-hidden className={EDGE_FADE} />
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
                  width=""
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
                {heads.map((head) => {
                  const figure = projectionFigure(row, head.key, gameweeks);
                  const ink =
                    figure === null || figure === 0
                      ? "text-faint"
                      : head.key === "xmins"
                        ? ""
                        : standoutInk(figure, cuts.get(head.key), "high");
                  return (
                    <td key={head.key} className={`${FIGURE} ${head.key === "tot" ? "font-bold" : ""} ${ink}`}>
                      {figure === null ? DASH : head.key === "xmins" ? figure : figure.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** His crest and name, and under it (on a phone) his Fantrax position; a link when the pool holds him. */
function Lead({ row }: { row: ProjectionRow }) {
  const crest = crestForShortName(row.club);
  const face = (
    <>
      <span className="grid size-6 shrink-0 place-items-center">
        {crest ? <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>
          <span className="lg:hidden">{row.name}</span>
          <span className="hidden lg:inline">{row.fullName}</span>
        </span>
        <span className={`${LABEL} text-2xs leading-tight lg:hidden`}>{positionsLabel(row.positions) ?? DASH}</span>
      </span>
    </>
  );
  return row.fantraxId === null ? (
    <span className={`${ROW_LINK} w-34 px-1.5 hover:no-underline lg:w-64`}>{face}</span>
  ) : (
    <Link href={playerHref(row.fantraxId)} className={`${ROW_LINK} w-34 px-1.5 lg:w-64`}>
      {face}
    </Link>
  );
}

/** Centred under its head, a little tighter under a thumb. */
const FIGURE = `numeric px-1 text-center lg:px-1.5 ${ROW_FIGURE}`;

/** The tile is the desk's; the lead is pinned while the weeks scroll under it. */
const PIN_TILE = "hidden lg:table-cell sticky left-0 z-10";
const PIN_NAME = "sticky left-0 z-10 border-r border-line bg-surface p-0 lg:left-14";
