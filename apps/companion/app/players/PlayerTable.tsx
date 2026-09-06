import Link from "next/link";
import { clubColours, signed, toFplClubCode } from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import type { PoolRow } from "./pool";
import { COLUMNS, type PoolColumn, type RawStats } from "./columns";
import { activeSort, sortHref } from "./query";
import type { PlayersQuery } from "./query";
import { ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";

// The pool as a table — and since 6 Sep 2026 as the WHOLE table (Craig: *"the
// landing screen for scout should really be showing as many columns as possible
// like Fantrax"*). Twenty-four columns, every one sortable, ordered as Fantrax
// orders its own.
//
// Sorting is a link, not a click handler: the server does the ordering, the
// phone gets HTML, and the sort survives being shared.
//
// It is the second shape in DESIGN §2's rule and the clearest example of it: a
// table whose last column is what the table is FOR drops columns to fit a phone,
// and a many-measure DIRECTORY keeps every one and scrolls sideways with CM's
// own bevelled bar, because there is no last column that matters more than the
// rest and hiding any of them is choosing for the reader.
//
// **The name column is frozen** (DESIGN §9, decided 29 Aug 2026): twenty-four
// columns on a 390 phone means the figures are read with the man's name off
// screen, which is a table answering "23" to no question.

/** Fantrax's status codes in the manager's words. Theirs is the vocabulary, so
 *  anything we have not seen shows as the raw code rather than as a guess — an
 *  undrafted league marks all 697 "WW", and a fourth letter would appear here
 *  before it appeared in this file. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "Waivers",
  T: "Rostered",
};

export default function PlayerTable({
  rows,
  query,
  teamNames,
  raw,
}: {
  rows: readonly PoolRow[];
  query: PlayersQuery;
  teamNames: Map<string, string>;
  /** The grouped payload's raw counts, by Fantrax id. Absent for a man that
   *  read did not carry, which is ordinary and prints a dash. */
  raw: Map<string, Record<string, number | null>>;
}) {
  const current = activeSort(query);
  /** A column stands down under a thumb unless it is the one being ordered by —
   *  DESIGN §2's rule, kept here rather than in the column table because only
   *  the render knows what the current sort is. */
  const phone = (column: PoolColumn) =>
    column.phoneHidden && current.key !== column.key ? "hidden lg:table-cell" : "";

  return (
    // `cm-scroll` for the bar, on the wrapper rather than on the table, so the
    // header row scrolls with its body.
    <div className={`cm-scroll ${SCROLL}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-2xs uppercase text-faint">
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  current.key === column.key
                    ? current.descending
                      ? "descending"
                      : "ascending"
                    : undefined
                }
                className={`whitespace-nowrap py-1.5 font-bold ${
                  column.kind === "text" ? "text-left" : "text-right"
                } ${column.key === "name" ? STICKY_LEAD : ""} ${phone(column)}`}
              >
                <Link
                  href={sortHref(query, column.key)}
                  title={column.title}
                  className={`inline-flex min-h-9 items-center gap-1 px-1.5 ${
                    current.key === column.key ? "text-accent" : "hover:text-muted"
                  }`}
                >
                  {column.label}
                  {current.key === column.key ? <Arrow down={current.descending} /> : null}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.entry.player.fantraxId} className={`${ROW_RULE} hover:bg-raised`}>
              {COLUMNS.map((column) => (
                <Cell
                  key={column.key}
                  column={column}
                  row={row}
                  stats={raw.get(row.entry.player.fantraxId)}
                  teamNames={teamNames}
                  hide={phone(column)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One cell. The name is a link with a face on it and everything else is a
 *  figure, so this is two shapes rather than twenty-four. */
function Cell({
  column,
  row,
  stats,
  teamNames,
  hide,
}: {
  column: PoolColumn;
  row: PoolRow;
  stats: RawStats;
  teamNames: Map<string, string>;
  /** The breakpoint class its head is wearing, so the two cannot disagree — a
   *  column hidden in the body and shown in the head is a table with a label
   *  over the wrong figures. */
  hide: string;
}) {
  if (column.key === "name") {
    return (
      // `lg:py-0` because the cell pads the row from outside it and `.cm-row`
      // cannot reach a `<td>`: 8px here plus the 28 inside is a 37px row on a
      // desk that asked for 28. The phone keeps the padding, and so keeps its 53.
      <td className={`py-1 lg:py-0 ${STICKY_LEAD} ${hide}`}>
        <Link
          href={`/players/${row.entry.player.fantraxId}`}
          className="cm-row flex min-h-11 items-center gap-2.5 px-1"
        >
          {/* Fantrax's club code translated to FPL's spelling before it reaches
              the palette. The two agree on eighteen of twenty, and the other two
              would take the fallback grey on every row they appeared in — a
              wrong answer that looks exactly like a club we have no colours
              for. */}
          <PlayerPortrait
            player={{ code: row.fplCode, name: row.entry.player.displayName }}
            colours={clubColours(toFplClubCode(row.entry.player.clubCode ?? ""))}
          />
          {/* Capped under a thumb, uncapped on the desk. The name is FROZEN, so
              it is legible at any scroll position — what a reader is scrolling
              for is the figures, and an uncapped name took two thirds of a 390
              screen and left three columns showing. `truncate` rather than a
              smaller type: DESIGN §8's rule for the pitch cards is the rule
              here too — the box shrinks and the type never does. */}
          <span className={`min-w-0 truncate max-w-[7rem] lg:max-w-none ${ROW_NAME}`}>
            {row.entry.player.displayName}
          </span>
        </Link>
      </td>
    );
  }

  const value = column.value(row, stats);

  if (column.key === "owner") {
    const owner = row.entry.ownerTeamId
      ? (teamNames.get(row.entry.ownerTeamId) ?? row.entry.ownerTeamId)
      : null;
    return (
      <td className={`whitespace-nowrap px-1.5 text-left text-2xs ${hide}`}>
        {owner ? (
          <span className="font-bold text-ink">{owner}</span>
        ) : (
          <span className="text-faint">{STATUS[row.entry.status] ?? row.entry.status ?? DASH}</span>
        )}
      </td>
    );
  }

  if (column.kind === "text") {
    return (
      <td className={`whitespace-nowrap px-1.5 text-left text-2xs text-faint ${hide}`}>{value ?? DASH}</td>
    );
  }

  if (value === null) {
    return <td className={`numeric px-1.5 text-right text-2xs text-faint ${hide}`}>{DASH}</td>;
  }

  if (column.kind === "percent") {
    return <td className={`numeric px-1.5 text-right text-2xs text-muted ${hide}`}>{value}%</td>;
  }

  if (column.kind === "signed") {
    return (
      <td className={`numeric px-1.5 text-right text-2xs ${hide}`}>
        <Trend value={Number(value)} />
      </td>
    );
  }

  // `FPts` is the one figure the whole board is ordered by out of the box, so it
  // is the one drawn at full strength. Everything else is a measure among
  // twenty, and a table where every column shouts has no hierarchy at all.
  return (
    <td
      className={`numeric px-1.5 text-right ${hide} ${
        column.key === "fpts" ? "font-bold" : "text-2xs text-muted"
      }`}
    >
      {value}
    </td>
  );
}

const DASH = "—";

/** The name column, frozen against the sideways scroll.
 *
 *  **An opaque ground is the whole trick and it must not be a token that moves.**
 *  A sticky cell is painted over by whatever scrolls under it unless it has a
 *  fill of its own; `bg-surface` is the panel's own well, so the frozen column
 *  reads as part of the table rather than as a plate laid on top of it. The
 *  right rule is what says the scroll passes UNDER it rather than beside it.
 *
 *  The head and the body cell take the same class, because a head that does not
 *  freeze with its column is a label sliding off its own figures. */
const STICKY_LEAD = "sticky left-0 z-10 bg-surface border-r border-line";

/** Which way ownership moved, said in the sign as well as the colour — a green
 *  number and a red one are the same number to a reader who cannot tell them
 *  apart. Nought is neither, and is drawn quiet rather than as a flat week. */
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-faint">0%</span>;
  return <span className={value > 0 ? "text-up" : "text-bad"}>{signed(value)}%</span>;
}

function Arrow({ down }: { down: boolean }) {
  return (
    <span aria-hidden className="text-[0.5rem] leading-none">
      {down ? "▼" : "▲"}
    </span>
  );
}
