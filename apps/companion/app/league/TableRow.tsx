import Link from "next/link";
import type { FormGame, StandingsRow } from "@epl/core";
import TeamBadge from "../components/league/TeamBadge";
import { cellAlign } from "./Columns";
import { yoursEdge, yoursInk } from "../mine";

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
//   rank      faint          depth, never meaning — CM's quiet leading index cell
//   team      info           a person, and this is the link that made the token
//   Pld W D L ink            the record — all four alike, as `24.jpg` sets them
//   For/Ag    mid            fantasy points, and a different KIND of number
//   Pts       ink, bold      the total the table is ordered by, CM's bold white
//   form      up/bad/faint   direction, the only thing those two are for
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
        className={`cm-index numeric px-1.5 text-2xs font-bold ${cellAlign("rank")} ${yoursEdge(mine)}`}
      >
        {ordinal(row.rank)}
      </td>

      <td className="pl-2">
        <Link
          href={`/squad/${row.teamId}`}
          // White, not cyan. Cyan is "a person" in this palette and CM spends it
          // on the manager's own name in the rail; its league table sets every
          // club in white and the one you manage in yellow (`cm9900/24.jpg`,
          // where Everton is the yellow row). A fantasy team is named after a
          // person and is not one.
          // Bigger than the figures beside it, and bigger than it was (Craig,
          // 31 Aug). CM sets a club name noticeably larger than its own stat
          // columns — `24.jpg` runs `Arsenal` at roughly half again the height
          // of the `6 5 0 1` on the same line — because the name is what you
          // scan the table FOR and the figures are what you then read across.
          className={`cm-row flex min-h-11 items-center gap-2 text-base font-bold hover:underline lg:text-lg ${
            yoursInk(mine)
          }`}
        >
          <TeamBadge team={{ teamId: row.teamId, name: row.teamName }} url={badge} />
          <span className="min-w-0 truncate">{row.teamName}</span>
          {/* Labelled, not just accented — the edge says nothing to anyone who
              cannot see it. */}
          {mine ? (
            <span className="shrink-0 bg-accent px-1 text-3xs font-bold uppercase text-bg">
              You
            </span>
          ) : null}
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

      <td className={`${FIGURE} text-mid`}>{row.pointsFor}</td>
      <td className={`${FIGURE} text-mid`}>{row.pointsAgainst}</td>

      {/* Points in a plate of their own, the way CM ends its table: the one
          figure that decides the season, blocked out so the eye runs down the
          column rather than across the row to find it. */}
      <td className="p-0">
        <span className="cm-index numeric flex min-h-7 items-center justify-center px-1.5 text-sm font-bold">
          {row.points}
        </span>
      </td>

      {/* After the points, where a modern table prints it — CM's own row ends at
          Pts and has no form guide at all. */}
      <td className="numeric px-1.5 text-center text-2xs">
        <Form run={form} />
      </td>
    </tr>
  );
}

/** Every figure cell, which is eight of the ten columns. Centred, because that
 *  is how `cm9900/24.jpg` sets a league table and because a one-digit `W` flushed
 *  right under a centred head reads as a mis-set strip. `Columns.cellAlign` is
 *  the head's half of the same decision. */
const FIGURE = "numeric px-1.5 text-center text-2xs font-bold";

/** Absence, never a nought — a nought is a claim about a team that has played
 *  nobody (DESIGN §7). */
const DASH = "—";

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

const TONE = { W: "text-up", D: "text-faint", L: "text-bad" } as const;

/** `1` becomes `1st`. CM's index cell carries the ordinal and not the number,
 *  which is a small thing that reads as the game immediately — a column of
 *  `1st 2nd 3rd` is a league table and a column of `1 2 3` is a list. */
function ordinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return `${rank}th`;
  return `${rank}${["th", "st", "nd", "rd"][rank % 10] ?? "th"}`;
}
