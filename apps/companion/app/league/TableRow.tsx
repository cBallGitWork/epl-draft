import Link from "next/link";
import { ordinal, type FormGame, type SortKey, type StandingsRow } from "@epl/core";
import TeamBadge from "../components/league/TeamBadge";
import { ROW_LINK } from "../components/league/TableCells";
import { cellAlign, deskOnly } from "./Columns";
import { yoursEdge, yoursInk } from "../mine";
import { FIGURE, ROW_FIGURE, ROW_NAME, ROW_RULE, TONE } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import { teamHref } from "@/app/squad/routes";

// One team's line in the table.
//
// **A row on the ground, not a card.** CM's tables are the thing the game is
// remembered for and none of them draws a box round a row: bold rows straight on
// the dark ground, a rule between them, no zebra. Sixteen bordered cards stacked
// on a navy field read as sixteen separate objects, when what a table says is
// that these are sixteen readings of one thing.
//
// **Dense, and bold.** CM set its tables at about sixteen pixels a row in bold
// white and nothing on them was quiet. A 44px tap target is binding on a phone
// (DESIGN §7) and a mouse does not need one, so the row is `min-h-11` and comes
// down to **28px** from `lg` — `.cm-row` in `desk.css`, which is the number that
// makes a division fit on a screen. The first attempt at this screen was airy at
// every width and read as a tidy dark list rather than as the game.
//
// *This said 36px until 7 Sep 2026, and had done since before Craig's 31 Aug
// call to take a desk row to 28. The stylesheet has said 1.75rem throughout.*
//
// Each colour is its slot (DESIGN §3) and nothing carries two jobs:
//
//   rank      the BLOCK's   `.cm-index` owns its own ink, size, weight and
//                           shadow — the cell sets alignment and nothing else
//   team      ink            white, and ACCENT for the one you manage
//   Pld W D L ink            the record — all four alike, as `24.jpg` sets them
//   For/Ag    ink            a column of a standings table is ink (DESIGN §3)
//   Pts       the BLOCK's   the total the table is ordered by, in the same block
//                           as the rank, so the table opens and closes on one mark
//   form      up/bad/faint   direction, the only thing those two are for
//
// *The rank read "faint — depth, never meaning" until 7 Sep 2026 and never was:
// it has been white on the blue block since the block was introduced, and is now
// 800 with CM's shadow. A row of the table that describes the row is the one
// comment that must not drift.*
//
// **The amber left this table on 5 Sep 2026** (Craig). `--color-mid` means "a
// figure", and it was carrying For and Ag on the reasoning that fantasy points
// are a different KIND of number from a win count. They are — and the table
// already says so by giving them their own columns. What amber was actually
// doing was colouring two columns of a table in which every other figure is
// white, and `cm9900/24.jpg`'s own table is white throughout with yellow for
// your club alone. Two hues in one row is where a reader starts looking for a
// meaning that is not there.
//
// **And the phone gets fewer columns than the desk.** Ag and Form stand down —
// a table whose last column is what the table is FOR shows it at 390 without
// scrolling, and this one is for Pts. For stays, because points-for is a
// head-to-head league's tiebreak and the reader's own is the number he is here
// to compare. The call is `Columns.deskOnly`, which the head, this row and the
// loading skeleton all ask, and which keeps a column visible when the table is
// ORDERED by it — a hidden cell takes the pressed plate and `aria-sort` with it.
//
// **Yours is said two ways: the accent edge and the accent NAME.** It was three
// — edge, weight and a `YOU` chip — and it was four when the name's colour was
// counted, which this docblock used to deny on the reasoning that cyan meant "a
// person". The palette no longer says that (`docs/ui/reference/README.md`, 3 Sep:
// A NAME IS WHITE), the reference sets your own club in yellow and every other
// in white, and Craig removed the chip on 5 Sep. Edge plus ink, and nothing
// else.

export default function TableRow({
  row,
  badge,
  mine,
  form,
  sort,
  tint,
}: {
  row: StandingsRow;
  badge: string | undefined;
  mine: boolean;
  /** A colour to edge this row in, for a screen that is about two PARTICULAR
   *  teams — the head-to-head draws the table with both sides of the tie marked
   *  in their own colours.
   *
   *  **It cannot be `mine`.** That paints `bg-raised`, and the playoff line below
   *  records why a tinted band is spent so carefully here: it "reads as *these
   *  are yours*", which about a rival is a lie. An edge in the side's OWN colour
   *  says something else — this is one of the two on the plate above — and leaves
   *  `mine` its single meaning, which wins on a row that is both. */
  tint?: string | undefined;
  /** Oldest first, and empty for a side whose run we cannot vouch for. */
  form: readonly FormGame[];
  /** What the table is ordered by, because a column the phone stands down is
   *  shown anyway when it is the one doing the ordering — see `deskOnly`. The
   *  head and the cell have to make the same call or they slide apart. */
  sort: SortKey;
}) {
  return (
    <tr className={`${ROW_RULE} ${mine ? "bg-raised" : "hover:bg-surface"}`}>
      {/* CM's small leading index cell: a filled block down the left of the
          table carrying the row's number. The eye counts down the blocks rather
          than the rows, which is what stops a dense table reading as a wall.
          The accent edge rides on it, so "yours" and the index are one mark. */}
      <td
        className={`cm-index numeric px-1.5 ${cellAlign("rank")} ${
          mine || tint === undefined ? yoursEdge(mine) : "border-l-4"
        }`}
        // **The edge rides on the INDEX CELL, not the row**, which is
        // `yoursEdge`'s own arrangement and the reason it hands back a
        // transparent border rather than none: a table draws its cells against
        // each other, so an edge on one row alone would step that row's figures
        // 4px out of the column. A `<tr>` border does not paint through the
        // index cell's own ground at all — which is how this shipped invisible
        // for one screenshot.
        //
        // **`mine` wins where both apply.** Your own row in your own tie is
        // marked by the accent already, and a second mark saying "you are in
        // this match" on the page about that match is the fact twice.
        style={mine || tint === undefined ? undefined : { borderLeftColor: tint }}
      >
        {ordinal(row.rank)}
      </td>

      <td className="pl-2">
        <Link
          href={teamHref(row.teamId)}
          // White, and yellow for the one you manage — CM's league table
          // (`cm9900/24.jpg`, where Everton is the yellow row). This used to
          // justify itself by saying cyan means "a person" and a team is not
          // one; the palette no longer says that, and the answer is unchanged
          // because it never rested on it. A NAME IS WHITE in CM, a person's
          // included.
          // Bigger than the figures beside it, and bigger than it was (Craig,
          // 31 Aug). CM sets a club name noticeably larger than its own stat
          // columns — `24.jpg` runs `Arsenal` at roughly half again the height
          // of the `6 5 0 1` on the same line — because the name is what you
          // scan the table FOR and the figures are what you then read across.
          className={`${ROW_LINK} ${yoursInk(mine)}`}
        >
          <TeamBadge team={{ teamId: row.teamId, name: row.teamName }} url={badge} />
          <span className={`min-w-0 truncate ${ROW_NAME}`}>{row.teamName}</span>
          {/* **No YOU chip** (Craig, 5 Sep 2026: "Remove 'you' from all rows
              where it appears. Just use yellow text for the team"). It was here
              on the argument that a label survives a reader who cannot see the
              accent — which is right, and which the ACCENT EDGE on the index
              cell beside it already satisfies: that is a shape and not a hue, it
              is `mine.ts`'s own mark, and docs/rules/PRODUCT.md asks for colour to be
              paired with "a label, shape or position". So the pairing survives
              and the third statement of it does not. `cm9900/24.jpg` prints
              Everton in yellow and nothing else. */}
        </Link>
      </td>

      {/* Pld W D L, each in its own column, which is what a league table is.
          All four in white, which is `cm9900/24.jpg` — the first attempt set
          `Pld` quieter on the argument that it is the other three added up, and
          the game does not agree: its Pld reads exactly as loud as its Won. */}
      <td className={`${FIGURE} text-ink`}>{row.played}</td>
      <td className={`${FIGURE} text-ink`}>{row.won}</td>
      <td className={`${FIGURE} text-ink`}>{row.drawn}</td>
      <td className={`${FIGURE} text-ink`}>{row.lost}</td>

      <td className={`${FIGURE} text-ink`}>{row.pointsFor}</td>
      <td className={`${FIGURE} text-ink ${deskOnly("against", sort)}`}>{row.pointsAgainst}</td>

      {/* Points in a plate of their own, the way CM ends its table: the one
          figure that decides the season, blocked out so the eye runs down the
          column rather than across the row to find it. */}
      <td className="p-0">
        <span className="cm-index numeric flex min-h-7 items-center justify-center px-1.5">
          {row.points}
        </span>
      </td>

      {/* After the points, where a modern table prints it — CM's own row ends at
          Pts and has no form guide at all. */}
      <td className={`numeric px-1.5 text-center ${ROW_FIGURE} ${deskOnly("form", sort)}`}>
        <Form run={form} />
      </td>
    </tr>
  );
}

/** The last few rounds, newest LAST — left to right is the direction the season
 *  ran, which is how a form guide is read everywhere it appears.
 *
 *  Five at most, because that is what a form guide is and what the column has
 *  room for; the run behind it is the whole season, and each glyph's title says
 *  which round it was and what the two totals were.
 *
 *  **Colour is the direction slot, not a third palette.** A win is green, a loss
 *  is red and a draw is quiet — which is what those two tokens are for and the
 *  only thing they are for. Not the accent yellow, which is spoken for on this
 *  very row by the edge and the name. */
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

