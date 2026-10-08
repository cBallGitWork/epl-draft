import Link from "@/app/components/shell/Link";
import { type Result, type TableRow, type TableSortKey, ordinal, signed } from "@epl/core";
import { cellAlign, deskOnly } from "./Columns";
import { clubHref } from "./routes";
import { PointsCell, ROW_LINK } from "../components/league/TableCells";
import { FIGURE, FIGURE_CELL, ROW_HOVER, TONE } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import ClubLabel from "@/app/components/football/ClubLabel";

// One club's line in the Premier League table; no "yours" marks, as nobody owns a real club.

export default function ClubRow({
  row,
  place,
  form,
  sort,
}: {
  row: TableRow;
  /** The competition's own place, which is not the row's position on screen
   *  once a reader sorts by goals scored. */
  place: number;
  /** Oldest first, as the whole season ran. This prints the tail of it. */
  form: readonly Result[];
  /** What the table is ordered by: a column the phone stands down is shown
   *  anyway when it is the one doing the ordering (`Columns.deskOnly`). */
  sort: TableSortKey;
}) {
  return (
    <tr className={ROW_HOVER}>
      {/* An ordinal, not a bare number, in CM's index block. */}
      <td className={`cm-index numeric px-1.5 ${cellAlign("place")}`}>
        {ordinal(place)}
      </td>

      <td className="pl-2">
        <Link
          // The season-stable code, never `clubId`: a shared URL persists and FPL recycles ids.
          href={clubHref(row.code)}
          className={ROW_LINK}
        >
          <ClubLabel club={row} title={row.name} />
        </Link>
      </td>

      <td className={`${FIGURE} text-ink`}>{row.played}</td>
      <td className={`${FIGURE} text-ink`}>{row.won}</td>
      <td className={`${FIGURE} text-ink`}>{row.drawn}</td>
      <td className={`${FIGURE} text-ink`}>{row.lost}</td>

      {/* Ink, and desk-only, so Pts is the phone's last column; GD stays as the first tiebreak. */}
      <td className={`${FIGURE} text-ink ${deskOnly("for", sort)}`}>{row.goalsFor}</td>
      <td className={`${FIGURE} text-ink ${deskOnly("against", sort)}`}>{row.goalsAgainst}</td>

      {/* Goal difference is a direction, so it takes the up/bad pair; nought reads quiet. */}
      <td className={`${FIGURE} ${SWING(row.goalDifference)}`}>{signed(row.goalDifference)}</td>

      <PointsCell>{row.points}</PointsCell>

      <td className={`${FIGURE_CELL} ${deskOnly("form", sort)}`}>
        <Form run={form} />
      </td>
    </tr>
  );
}

function SWING(difference: number): string {
  if (difference > 0) return "text-up";
  if (difference < 0) return "text-bad";
  return "text-faint";
}

/** The last five results, newest last, as a form guide reads. */
function Form({ run }: { run: readonly Result[] }) {
  if (run.length === 0) return <Absent />;

  return (
    <span className="flex justify-center gap-0.5">
      {run.slice(-FORM_GAMES).map((result, at) => (
        <span
          // The run has no ids of its own — it is a list of letters — and the
          // slice is stable for a given club, so the position in it is the key.
          key={`${at}-${result}`}
          className={`font-bold ${TONE[result]}`}
        >
          {result}
        </span>
      ))}
    </span>
  );
}

const FORM_GAMES = 5;

