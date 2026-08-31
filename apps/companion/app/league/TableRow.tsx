import Link from "next/link";
import type { FormGame, StandingsRow } from "@epl/core";
import TeamBadge from "../components/league/TeamBadge";
import { yoursEdge } from "../mine";

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
// down to 36px from `lg` — which is the height the plan already names for the
// scouting table. The first attempt at this screen was airy at every width and
// read as a tidy dark list rather than as the game.
//
// Each colour is its slot (DESIGN §3) and nothing carries two jobs:
//
//   rank    faint          depth, never meaning — CM's quiet leading index cell
//   team    info           a person, and this is the link that made the token
//   record  muted          a record is a string, not a figure
//   form    up/bad/faint   direction, the only thing those two are for
//   GB/Win%/FP  mid        a figure — CM's orange stat columns
//   Pts     ink, bold      the total the table is ordered by, CM's bold white
//
// **Yours is said three ways and none of them is the name's colour.** The accent
// edge, the weight, and the chip. Recolouring your own name would take it out of
// the person slot on the one row you are looking for.

export default function TableRow({
  row,
  badge,
  mine,
  form,
}: {
  row: StandingsRow;
  badge: string | undefined;
  mine: boolean;
  /** Oldest first, and empty for a side whose run we cannot vouch for. */
  form: readonly FormGame[];
}) {
  return (
    <tr className={`border-b border-bg ${mine ? "bg-raised" : "hover:bg-surface"}`}>
      {/* CM's small leading index cell: a filled block down the left of the
          table carrying the row's number. The eye counts down the blocks rather
          than the rows, which is what stops a dense table reading as a wall.
          The accent edge rides on it, so "yours" and the index are one mark. */}
      <td
        className={`cm-index numeric px-1.5 text-right text-2xs font-bold text-muted ${yoursEdge(mine)}`}
      >
        {row.rank}
      </td>

      <td className="pl-2">
        <Link
          href={`/squad/${row.teamId}`}
          className="cm-row flex min-h-11 items-center gap-2 text-sm font-bold text-info hover:underline"
        >
          <TeamBadge team={{ teamId: row.teamId, name: row.teamName }} url={badge} />
          <span className="min-w-0 truncate">{row.teamName}</span>
          {/* Labelled, not just accented — the edge says nothing to anyone who
              cannot see it. */}
          {mine ? (
            <span className="shrink-0 bg-accent px-1 text-3xs font-bold uppercase tracking-widest text-bg">
              You
            </span>
          ) : null}
        </Link>
      </td>

      <td className="numeric whitespace-nowrap px-1.5 text-right text-2xs font-bold text-ink">
        {row.won}-{row.drawn}-{row.lost}
      </td>

      <td className="numeric px-1.5 text-right text-2xs">
        <Form run={form} />
      </td>

      <td className="numeric px-1.5 text-right text-2xs font-bold text-mid">
        {gamesBack(row.gamesBack)}
      </td>

      <td className="numeric px-1.5 text-right text-2xs font-bold text-mid">
        {winFraction(row.winPercentage) ?? DASH}
      </td>

      <td className="numeric px-1.5 text-right text-2xs font-bold text-mid">{row.pointsFor}</td>

      <td className="numeric px-1.5 text-right text-sm font-bold text-ink">{row.points}</td>
    </tr>
  );
}

/** Absence, never a nought — a nought is a claim about a team that has played
 *  nobody (DESIGN §7). */
const DASH = "—";

/** Games back, at the precision a league table is read at.
 *
 *  Fantrax sends a raw number and this column printed it unchanged, which was
 *  invisible while the rehearsal league had four teams all on whole numbers and
 *  became `0.6666666666666666` the first time a ten-team table was rendered. A
 *  half-game back is a real and ordinary value, so it rounds to one place and
 *  drops a trailing nought rather than to an integer. */
function gamesBack(value: number | null): string {
  if (value === null) return DASH;
  return value.toFixed(1).replace(/\.0$/, "");
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
 *  very row by the edge and the chip. */
function Form({ run }: { run: readonly FormGame[] }) {
  if (run.length === 0) return <span className="text-faint">{DASH}</span>;

  return (
    <span className="flex justify-end gap-0.5">
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

const TONE = { W: "text-up", D: "text-faint", L: "text-bad" } as const;

/** Fantrax's own rendering of their own fraction: `1.000`, `.500`, `.000`.
 *
 *  Three decimals with the leading nought dropped, which is how their table sets
 *  it and how the column headed `Win%` is meant to be read. It is NOT a
 *  percentage — the value for a side that has won every game is 1 — so printing
 *  it as one would put the leader on 1% and the table's best row last. */
function winFraction(value: number | null): string | null {
  return value === null ? null : value.toFixed(3).replace(/^0/, "");
}
