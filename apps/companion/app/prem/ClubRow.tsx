import Link from "next/link";
import { type Result, type TableRow, type TableSortKey, ordinal, signed } from "@epl/core";
import { cellAlign, deskOnly } from "./Columns";
import { CLUB } from "./routes";
import { PointsCell, ROW_LINK } from "../components/league/TableCells";
import { FIGURE, FIGURE_CELL, ROW_HOVER, TONE } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import ClubLabel from "@/app/components/football/ClubLabel";

// One club's line in the Premier League table.
//
// **A row on the ground, not a card**, and dense — `league/TableRow.tsx` carries
// the full argument and this is the same table in the same register. What is
// different is everything about ownership: nobody owns Arsenal, so there is no
// accent edge, no YOURS chip and no `yoursInk`. The three marks that say "this
// one is yours" have nothing to say on a table of real clubs, and inventing a
// fourth meaning for them here would spend a reading aid five other screens
// depend on.
//
// Each colour is its slot (DESIGN §3):
//
//   place     faint          depth, never meaning — CM's quiet leading index
//   club      ink            the name you scan the table FOR
//   Pld W D L ink            the record — all four alike, as `24.jpg` sets them
//   For/Ag    ink            a column of a standings table is ink (DESIGN §3),
//                             and the phone does without both — see `deskOnly`
//   GD        up/bad/faint   direction, which is the only thing those two are for
//   Pts       ink, bold      the total the table is ordered by, in its own plate
//   form      up/bad/faint   the same pair, and the same reason

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
      {/* CM's small leading index cell: a filled block down the left carrying
          the row's number, so the eye counts down the blocks rather than the
          rows. An ORDINAL, which is what `cm9900/24.jpg` prints — `1st`, `2nd`
          — and not a bare number. */}
      <td className={`cm-index numeric px-1.5 ${cellAlign("place")}`}>
        {ordinal(place)}
      </td>

      <td className="pl-2">
        <Link
          // Keyed on the season-stable CODE and never on `clubId`: a URL is
          // persisted the moment somebody bookmarks or shares it, and FPL's id
          // is recycled between seasons (CODE_RULES §3).
          href={`${CLUB}/${row.code}`}
          // White. CM's league table sets every club in white and spends yellow
          // on the one you manage — and on this table you manage none of them.
          // Bigger than the figures beside it, because the name is what you scan
          // the table FOR and the figures are what you then read across.
          className={ROW_LINK}
        >
          <ClubLabel club={row} title={row.name} />
        </Link>
      </td>

      <td className={`${FIGURE} text-ink`}>{row.played}</td>
      <td className={`${FIGURE} text-ink`}>{row.won}</td>
      <td className={`${FIGURE} text-ink`}>{row.drawn}</td>
      <td className={`${FIGURE} text-ink`}>{row.lost}</td>

      {/* **Ink, and not on the phone.** Amber means "a figure" and was colouring
          two columns of a table in which every other figure is white; CM's own
          table (`cm9900/24.jpg`) is white throughout with yellow for your club
          alone. And below `lg` the pair goes with Form: a table's last column
          should be what the table is FOR, and this one is for Pts. GD stays
          under a thumb, being the competition's own first tiebreak — the two
          numbers it is made of are the ones a phone can spare. */}
      <td className={`${FIGURE} text-ink ${deskOnly("for", sort)}`}>{row.goalsFor}</td>
      <td className={`${FIGURE} text-ink ${deskOnly("against", sort)}`}>{row.goalsAgainst}</td>

      {/* Goal difference is a DIRECTION and takes the direction pair — it is the
          one column on this table whose sign is the reason for printing it.
          Nought is neither, and reads quiet. */}
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

/** The last few results, newest LAST — left to right is the direction the season
 *  ran, which is how a form guide is read everywhere it appears.
 *
 *  Five at most, because that is what a form guide is and what the column has
 *  room for; `clubStats` hands over the whole season and the width is this
 *  file's business. */
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

