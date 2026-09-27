import Link from "next/link";
import { DASH, gameweekSpan } from "@epl/core";
import PositionTile from "../../components/league/PositionTile";
import { LeadHeads, sortedAs, SortHead } from "../../components/league/TableHeads";
import { ROW_LINK } from "../../components/league/TableCells";
import { BOARD, ROW_RULE } from "@/app/desk";
import ScrollBoard from "../../components/league/ScrollBoard";
import { FIGURE, LEAD_WIDTH, LeadFace, PIN_NAME, PIN_TILE } from "../BoardRow";
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
    <ScrollBoard className="bg-surface">
      <table className={BOARD}>
        <thead>
          <tr className="text-2xs">
            <LeadHeads tile={PIN_TILE} name={PIN_NAME} />
            {heads.map((head) => (
              <SortHead
                key={head.key}
                compact
                title={head.title}
                href={href(head.key, head.key === sort ? !descending : true)}
                label={head.label}
                sorted={sortedAs(head.key === sort, descending)}
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
    </ScrollBoard>
  );
}

/** His crest, name and position; a link when the pool holds him. */
function Lead({ row }: { row: ProjectionRow }) {
  const face = <LeadFace club={row.club} name={row.name} fullName={row.fullName} positions={row.positions} />;
  return row.fantraxId === null ? (
    <span className={`${ROW_LINK} ${LEAD_WIDTH} hover:no-underline`}>{face}</span>
  ) : (
    <Link href={playerHref(row.fantraxId)} className={`${ROW_LINK} ${LEAD_WIDTH}`}>
      {face}
    </Link>
  );
}
