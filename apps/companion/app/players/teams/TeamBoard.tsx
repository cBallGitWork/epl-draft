import Link from "next/link";
import { DASH, toFantraxClubCode } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { ROW_LINK } from "../../components/league/TableCells";
import { MUTE, SortHead } from "../../components/league/TableHeads";
import { standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import { BOARD, EDGE_FADE, GROUP_PLATE, HEAD_CELL, INDEX_WIDTH, ROW_FIGURE, ROW_RULE, SCROLL } from "@/app/desk";
import { POOL, TEAMS } from "../routes";
import { TEAM_COLUMNS, columnGroups, type TeamColumn } from "./columns";
import type { TeamRow } from "./teamRows";

// The clubs as one board, 13 measures in five labelled groups: CM's densest board (`cm9900/21.jpg`) sets its heads
// in groups the same way. Standouts are lit in ink; the run is ours, in cyan, and never lit.

/** A fifth in yellow and a tenth in orange, of the twenty: the match board's shares. */
const SHARES = { good: 1 / 5, best: 1 / 10 } as const;

export default function TeamBoard({
  rows,
  sort,
  descending,
}: {
  rows: readonly TeamRow[];
  sort: TeamColumn;
  descending: boolean;
}) {
  const cuts = new Map<string, StandoutCut>(
    TEAM_COLUMNS.filter((column) => column.rank !== undefined).map((column) => [
      column.key,
      standoutCuts(rows.map(column.of), SHARES, { of: rows.length }),
    ]),
  );
  const firsts = new Set(columnGroups(TEAM_COLUMNS).map((entry) => TEAM_COLUMNS.find((c) => c.group === entry.group)?.key));

  return (
    // Opaque, so the pinned club hides the figures scrolling under it; a fade says there is more to the right.
    <div className="relative">
      <span aria-hidden className={EDGE_FADE} />
      <div className={`${SCROLL} cm-scroll bg-surface`}>
        <table className={`${BOARD} min-w-max`}>
          <caption className="sr-only">The twenty clubs, ordered by {sort.title.toLowerCase()}</caption>
          <thead>
            <tr>
              <th colSpan={2} className={`${HEAD_CELL} ${PIN_INDEX} bg-surface`}>
                <span className={MUTE}>Club</span>
              </th>
              {columnGroups(TEAM_COLUMNS).map((entry) => (
                <th key={entry.group} colSpan={entry.span} scope="colgroup" className={`${HEAD_CELL} border-l border-line/60`}>
                  <span className={GROUP_PLATE}>{entry.group}</span>
                </th>
              ))}
            </tr>
            <tr className="text-2xs">
              <th scope="col" className={`${HEAD_CELL} ${PIN_INDEX} bg-surface`}>
                <span className={MUTE}>Place</span>
              </th>
              <th scope="col" className={`${HEAD_CELL} ${PIN_NAME}`}>
                <span className={MUTE}>Club</span>
              </th>
              {TEAM_COLUMNS.map((column) => (
                <SortHead
                  key={column.key}
                  width={firsts.has(column.key) ? "border-l border-line/60" : ""}
                  title={column.title}
                  href={teamsHref(column, sort, descending)}
                  label={column.head}
                  sorted={column.key === sort.key ? (descending ? "descending" : "ascending") : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, at) => (
              <tr key={row.club.code} className={ROW_RULE}>
                {/* `IndexCell`'s block, pinned: it takes no class, and this board scrolls sideways. */}
                <td className={`cm-index numeric px-1.5 text-center ${PIN_INDEX}`}>{at + 1}</td>
                <th scope="row" className={`p-0 text-left font-normal ${PIN_NAME}`}>
                  <Link href={`${POOL}?club=${toFantraxClubCode(row.club.shortName)}`} className={`${ROW_LINK} gap-1.5 px-1.5`}>
                    <ClubLabel club={row.club} />
                  </Link>
                </th>
                {TEAM_COLUMNS.map((column) => (
                  <Figure key={column.key} column={column} row={row} cut={cuts.get(column.key)} first={firsts.has(column.key)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Figure({ column, row, cut, first }: { column: TeamColumn; row: TeamRow; cut: StandoutCut | undefined; first: boolean }) {
  const value = column.of(row);
  const edge = first ? "border-l border-line/60" : "";
  if (value === null) return <td className={`${FIGURE} ${edge} text-faint`}>{DASH}</td>;
  const ink = column.derived
    ? "font-bold text-info"
    : column.rank && value !== 0
      ? standoutInk(value, cut, column.rank)
      : value === 0
        ? "text-faint"
        : "";
  return <td className={`${FIGURE} ${edge} ${ink}`}>{value.toFixed(column.dp ?? 0)}</td>;
}

/** Centred under its head, the way CM sets a column. */
const FIGURE = `numeric w-12 px-1.5 text-center lg:w-16 ${ROW_FIGURE}`;

/** The place and the club stay put while the measures scroll under them. */
const PIN_INDEX = `sticky left-0 z-10 ${INDEX_WIDTH}`;
const PIN_NAME = "sticky left-8 z-10 border-r border-line bg-surface lg:left-9";

/** A head's link: a column not sorted starts in its own direction; the sorted one reverses. */
function teamsHref(column: TeamColumn, sort: TeamColumn, descending: boolean): string {
  const next = column.key === sort.key ? !descending : !column.ascending;
  if (column.key === "fpts" && next) return TEAMS;
  return `${TEAMS}?sort=${column.key}${next ? "&dir=desc" : "&dir=asc"}`;
}
