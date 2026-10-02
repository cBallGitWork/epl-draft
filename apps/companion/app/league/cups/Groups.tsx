import { Fragment } from "react";
import { groupTable, ordinal, type GroupStage } from "@epl/core";
import { Head, HeadRow, MUTE, NameHead, PLATE } from "../../components/league/TableHeads";
import { CutRow, PointsCell } from "../../components/league/TableCells";
import { BLOCK_PLATE, BOARD, DESK_ONLY, FIGURE, ROW_NAME, ROW_RULE } from "@/app/desk";

/** Each group as a league table, its slots in draw order until there are results to place them. */
export default function Groups({ groups, stage }: { groups: readonly string[][]; stage: GroupStage }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((slots, at) => (
        <section key={slots[0] ?? at} className="flex flex-col gap-1">
          <h3 className={BLOCK_PLATE}>Group {slots[0]?.charAt(0)}</h3>
          <table className={BOARD}>
            <thead>
              <HeadRow>
                <Head width="w-8 lg:w-14">
                  <span className={PLATE}>
                    <span className={MUTE}>Placing</span>
                  </span>
                </Head>
                <NameHead label="Team" />
                {COLUMNS.map((column) => (
                  <Head
                    key={column.label}
                    width={`${column.width} ${column.deskOnly ? DESK_ONLY : ""}`}
                    title={column.title}
                  >
                    <span className={PLATE}>{column.label}</span>
                  </Head>
                ))}
              </HeadRow>
            </thead>
            <tbody>
              {groupTable(slots, [], stage.points).map((row, place) => (
                <Fragment key={row.teamId}>
                  <tr className={ROW_RULE}>
                    <td className="cm-index numeric px-1.5 text-center">{ordinal(place + 1)}</td>
                    <td className="pl-2">
                      <span className={`cm-row flex min-h-11 items-center ${ROW_NAME}`}>{row.teamId}</span>
                    </td>
                    <td className={`${FIGURE} text-ink`}>{row.played}</td>
                    <td className={`${FIGURE} text-ink`}>{row.won}</td>
                    <td className={`${FIGURE} text-ink`}>{row.drawn}</td>
                    <td className={`${FIGURE} text-ink`}>{row.lost}</td>
                    <td className={`${FIGURE} text-ink`}>{row.pointsFor}</td>
                    <td className={`${FIGURE} text-ink ${DESK_ONLY}`}>{row.pointsAgainst}</td>
                    <PointsCell>{row.points}</PointsCell>
                  </tr>
                  {place + 1 === stage.qualify && place + 1 < slots.length ? (
                    <CutRow span={COLUMNS.length + 2} label="Knockout" tone="border-accent/80" />
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** The figures, as the league table heads them; Ag stands down under a thumb so Pts fits at 390. */
const COLUMNS: readonly { label: string; title: string; width: string; deskOnly?: true }[] = [
  { label: "Pld", title: "Played", width: "w-8 lg:w-20" },
  { label: "W", title: "Won", width: "w-7 lg:w-16" },
  { label: "D", title: "Drawn", width: "w-7 lg:w-16" },
  { label: "L", title: "Lost", width: "w-7 lg:w-16" },
  { label: "For", title: "Fantasy points scored", width: "w-11 lg:w-24" },
  { label: "Ag", title: "Fantasy points conceded", width: "w-11 lg:w-24", deskOnly: true },
  { label: "Pts", title: "Group points", width: "w-10 lg:w-24" },
];
