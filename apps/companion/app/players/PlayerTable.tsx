import Link from "next/link";
import { clubColours, signed, toFplClubCode } from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import type { PoolRow } from "./pool";
import { COLUMNS, activeSort, sortHref } from "./query";
import { positionsLabel } from "../positions";
import type { PlayersQuery } from "./query";
import { ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";

// The pool as a table. Sorting is a link, not a click handler: the server does
// the ordering, the phone gets HTML, and the sort survives being shared.
//
// Every row leads with a face on his club's colour, which is the whole of what
// turned this from a spreadsheet into a page about footballers. Same 32px mark
// the fixture list uses, and it carries two things at once: the photograph where
// there is one, and the club always — the circle behind it is the kit, so a man
// with no headshot is still placed by his colours and his initials.

/** Fantrax's status codes in the manager's words. Theirs is the vocabulary, so
 *  anything we have not seen shows as the raw code rather than as a guess — an
 *  undrafted league marks all 697 "WW", and a fourth letter would appear here
 *  before it appeared in this file. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "Waivers",
  T: "Rostered",
};

// Nothing is hidden on a phone any more. It used to drop the rank behind a
// breakpoint on the grounds that a row holds four things — which is true of a
// row that must fit, and this one no longer has to. The table scrolls sideways
// instead, so every column Fantrax publishes is reachable on the smallest screen
// rather than absent from it. Craig's call.
//
// It is the second shape in A5's rule: a table whose last column is what the
// table is FOR subtracts columns so it fits, and a many-measure directory like
// this one keeps all of them and scrolls, with CM's own bevelled bar saying so.

export default function PlayerTable({
  rows,
  query,
  teamNames,
}: {
  rows: readonly PoolRow[];
  query: PlayersQuery;
  teamNames: Map<string, string>;
}) {
  const current = activeSort(query);

  return (
    // **No gutter breakout any more.** The table used to run out through the
    // page's own gutters because the directory was printing on the bare ground
    // and had nothing to be inside; it is in `LeagueShell`'s panel now, and a
    // child that breaks out of a panel breaks out of the plate that is the whole
    // reason the panel is there. `cm-scroll` for the bar, on the wrapper rather
    // than on the table, so the header row scrolls with its body.
    <div className={`cm-scroll ${SCROLL}`}>
      <table className="w-full min-w-[34rem] border-collapse text-sm">
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
                  column.key === "name" || column.key === "opp" ? "text-left" : "text-right"
                } ${column.key === "name" ? STICKY_LEAD : NARROW}`}
              >
                <Link
                  href={sortHref(query, column.key)}
                  title={column.title}
                  className={`inline-flex min-h-9 items-center gap-1 px-1 ${
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
          {rows.map(({ entry, stats, fplCode }) => {
            const owner = entry.ownerTeamId
              ? (teamNames.get(entry.ownerTeamId) ?? entry.ownerTeamId)
              : null;
            return (
              <tr key={entry.player.fantraxId} className={`${ROW_RULE} hover:bg-raised`}>
                <td className="numeric px-1 text-right text-2xs text-faint">{stats?.rank ?? "—"}</td>
                {/* `lg:py-0` because the cell pads the row from outside it and
                    `.cm-row` cannot reach a `<td>`: 8px here plus the 28 inside
                    is a 37px row on a desk that asked for 28. The phone keeps
                    the padding, and so keeps its 53. */}
                <td className={`py-1 lg:py-0 ${STICKY_LEAD}`}>
                  <Link
                    href={`/players/${entry.player.fantraxId}`}
                    className="cm-row flex min-h-11 items-center gap-2.5 px-1"
                  >
                    {/* Fantrax's club code translated to FPL's spelling before it
                        reaches the palette. The two agree on eighteen of twenty,
                        and the other two would take the fallback grey on every
                        row they appeared in — which is a wrong answer that looks
                        exactly like a club we have no colours for. */}
                    <PlayerPortrait
                      player={{ code: fplCode, name: entry.player.displayName }}
                      colours={clubColours(toFplClubCode(entry.player.clubCode ?? ""))}
                    />
                    {/* Two lines on a phone and one above `lg`, which is what
                        takes this row from 45px to the desk's 28. `SquadRows`
                        records the same finding the other way round: two short
                        strings that sit happily beside each other doubled the
                        height of a list to stack them. A phone has no room to
                        put them side by side and a desk has nothing but. */}
                    <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
                      <span className={`min-w-0 truncate ${ROW_NAME}`}>
                        {entry.player.displayName}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-2xs text-faint">
                        {/* The league's eligibility, not the pool's single
                            position: "F/M" is what the commissioner set and what
                            the planner obeys, and the global pool's letter is a
                            different league's answer. */}
                        <span className="numeric">
                          {positionsLabel(entry.eligiblePositions) ?? "—"}
                        </span>
                        <span className="numeric">
                          {entry.player.clubCode ?? "—"}
                        </span>
                        {owner ? (
                          <span className="truncate font-bold text-ink">{owner}</span>
                        ) : (
                          <span>{STATUS[entry.status] ?? entry.status}</span>
                        )}
                      </span>
                    </span>
                  </Link>
                </td>
                {/* Fantrax's own words for his fixture, `<br/>` already turned
                    into a space by the mapper. Not a `FixtureChip`: this page is
                    entirely Fantrax's on purpose, and joining the football layer
                    to draw a difficulty colour would give it a second provider
                    to fail on for one cell. */}
                <td className="whitespace-nowrap px-1 text-left text-2xs text-faint">
                  {stats?.opponent ?? "—"}
                </td>
                <td className="numeric px-1 text-right font-bold">{stats?.points ?? "—"}</td>
                <td className="numeric px-1 text-right text-muted">{stats?.perGame ?? "—"}</td>
                {/* Their number about their whole product, and the only outside
                    opinion on the page: how much of Fantrax rosters this man. */}
                <td className="numeric px-1 text-right text-2xs text-muted">
                  {stats?.rostered === null || stats?.rostered === undefined
                    ? "—"
                    : `${stats.rostered}%`}
                </td>
                <td className="numeric px-1 text-right text-2xs">
                  <Trend value={stats?.trend ?? null} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Every column but the name, which takes whatever is left. */
const NARROW = "w-14";

/** The name column, frozen against the sideways scroll.
 *
 *  **DESIGN §9 decided this on 29 Aug 2026 and nothing built it** — the sideways
 *  scroll landed, the sticky column did not, and the file recorded the gap
 *  ("the frozen name column has not been built"). Seven columns on a 390 phone
 *  means the figures are read with the man's name off-screen, which is a table
 *  answering "23" to no question.
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
function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">—</span>;
  if (value === 0) return <span className="text-faint">0%</span>;
  return (
    <span className={value > 0 ? "text-up" : "text-bad"}>
      {signed(value)}%
    </span>
  );
}

function Arrow({ down }: { down: boolean }) {
  return (
    <span aria-hidden className="text-[0.5rem] leading-none">
      {down ? "▼" : "▲"}
    </span>
  );
}
