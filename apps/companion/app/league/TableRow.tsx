import Link from "next/link";
import { ordinal, type FormGame, type SortKey, type StandingsRow } from "@epl/core";
import { PointsCell, TIGHT_ROW } from "../components/league/TableCells";
import { COPY, cellAlign, deskOnly } from "./Columns";
import { yoursEdge, yoursInk } from "../mine";
import { FIGURE, FIGURE_CELL, ROW_NAME, ROW_RULE, TONE } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import TeamName from "@/app/components/league/TeamName";
import { teamHref } from "@/app/squad/routes";

// One team's line in the table: a row on the ground with a rule under it (`cm9900/24.jpg`), every figure ink, rank
// and Pts in the index block, form in the direction pair, and yours said twice, by the accent edge and the accent name.
// A phone reads Pts after Pld and the short name, and stands Ag and Form down unless one orders the table (Craig, 6 Oct 2026).

export default function TableRow({
  row,
  mine,
  form,
  sort,
  tint,
}: {
  row: StandingsRow;
  mine: boolean;
  /** An edge in a side's own colour, for the head-to-head's two teams; `mine` wins on a row that is both. */
  tint?: string | undefined;
  /** Oldest first, and empty for a side whose run we cannot vouch for. */
  form: readonly FormGame[];
  /** What the table is ordered by: a column the phone stands down still shows when it orders the table. */
  sort: SortKey;
}) {
  return (
    <tr className={`${ROW_RULE} ${mine ? "bg-raised" : "hover:bg-surface"}`}>
      {/* CM's index block, carrying the accent edge, so yours and the index are one mark. */}
      <td
        className={`cm-index numeric px-1.5 ${cellAlign("rank")} ${
          mine || tint === undefined ? yoursEdge(mine) : "border-l-4"
        }`}
        // On the cell, not the row: a `<tr>` border never paints through the index ground.
        style={mine || tint === undefined ? undefined : { borderLeftColor: tint }}
      >
        {ordinal(row.rank)}
      </td>

      <td className="pl-2">
        <Link
          href={teamHref(row.teamId)}
          // White, the accent for yours (`cm9900/24.jpg`), and a size up from its figures (Craig, 31 Aug).
          className={`${TIGHT_ROW} hover:underline ${yoursInk(mine)}`}
        >
          <span className={`min-w-0 truncate ${ROW_NAME}`}>
            <TeamName teamId={row.teamId} name={row.teamName} />
          </span>
          {/* No YOU chip (Craig, 5 Sep 2026): the accent edge is the shape that pairs with the colour. */}
        </Link>
      </td>

      {/* Pld W D L, each its own column and all four alike, as `cm9900/24.jpg` sets them. */}
      <td className={`${FIGURE} text-ink`}>{row.played}</td>
      <PointsCell className={COPY.phone}>{row.points}</PointsCell>
      <td className={`${FIGURE} text-ink`}>{row.won}</td>
      <td className={`${FIGURE} text-ink`}>{row.drawn}</td>
      <td className={`${FIGURE} text-ink`}>{row.lost}</td>

      <td className={`${FIGURE} text-ink`}>{row.pointsFor}</td>
      <td className={`${FIGURE} text-ink ${deskOnly("against", sort)}`}>{row.pointsAgainst}</td>

      <PointsCell className={COPY.desk}>{row.points}</PointsCell>

      {/* Form after the points, where a modern table prints it. */}
      <td className={`${FIGURE_CELL} ${deskOnly("form", sort)}`}>
        <Form run={form} />
      </td>
    </tr>
  );
}

/** The last five gameweeks, oldest first, each titled with its score: a win green, a loss red, a draw quiet. */
function Form({ run }: { run: readonly FormGame[] }) {
  if (run.length === 0) return <Absent />;

  return (
    <span className="flex justify-center gap-0.5">
      {run.slice(-FORM_GAMES).map((game) => (
        <span
          key={game.period}
          title={`Gameweek ${game.period} · ${game.pointsFor}-${game.pointsAgainst}`}
          className={`font-bold ${TONE[game.result]}`}
        >
          {game.result}
        </span>
      ))}
    </span>
  );
}

const FORM_GAMES = 5;

