import Image from "next/image";
import Link from "next/link";
import { type Result, type TableRow, type TableSortKey, crestUrl, ordinal } from "@epl/core";
import { cellAlign, deskOnly } from "./Columns";
import { CLUB } from "./routes";
import { ROW_LINK } from "../components/league/TableCells";
import { FIGURE, ROW_FIGURE, ROW_NAME, ROW_RULE, TONE } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";

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
    <tr className={`${ROW_RULE} hover:bg-surface`}>
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
          <Crest code={row.code} name={row.name} />
          {/* The full name on the desk, the three-letter label under a thumb.
              A twenty-club table has "Nott'm Forest" and "Wolverhampton
              Wanderers" in it, and neither fits beside nine figure columns at
              390 — CM itself sets `Middlesbrough` at a width it has and we do
              not. Both are rendered and CSS picks, so there is no breakpoint
              guess in the markup. */}
          <span className={`min-w-0 truncate lg:hidden ${ROW_NAME}`}>{row.shortName}</span>
          <span className={`hidden min-w-0 truncate lg:inline ${ROW_NAME}`}>{row.name}</span>
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

      {/* Points in a plate of their own, the way CM ends its table: the one
          figure that decides the season, blocked out so the eye runs down the
          column rather than across the row to find it. */}
      <td className="p-0">
        <span className="cm-index numeric flex min-h-7 items-center justify-center px-1.5">
          {row.points}
        </span>
      </td>

      <td className={`numeric px-1.5 text-center ${ROW_FIGURE} ${deskOnly("form", sort)}`}>
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

/** `+4`, `-6`, `0`. The plus is the whole point of the column: a difference
 *  printed without its sign is a number whose meaning the reader has to work
 *  out from the two columns to its left. */
function signed(difference: number): string {
  return difference > 0 ? `+${difference}` : String(difference);
}

/** The club's crest, at the size the row's badge slot is drawn to.
 *
 *  No fallback rung and no initial: unlike a fantasy team, every one of the
 *  twenty has a crest at a URL keyed on a season-stable code, and `next/image`
 *  renders nothing rather than something wrong if one 404s. */
function Crest({ code, name }: { code: number; name: string }) {
  return (
    <Image
      src={crestUrl({ code })}
      alt=""
      width={26}
      height={26}
      className="h-[var(--row-badge)] w-[var(--row-badge)] shrink-0 object-contain"
      // Decoration beside a name that is already there: a reader with a screen
      // reader hears the club once, not twice.
      aria-hidden
      title={name}
      unoptimized
    />
  );
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

