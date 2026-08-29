import Link from "next/link";
import { clubColours, toFplClubCode } from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import type { PoolRow } from "./pool";
import { COLUMNS, activeSort, sortHref } from "./query";
import { positionsLabel } from "../positions";
import type { PlayersQuery } from "./query";

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
// row that must fit, and this one no longer has to. The table breaks out of the
// page gutter and scrolls sideways instead, so every column Fantrax publishes is
// reachable on the smallest screen rather than absent from it. Craig's call.

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
    // Out to the page's edges and then some: the gutter is a variable precisely
    // so the two things that break out of it cannot drift from it (globals.css).
    // `overflow-x-auto` on the breakout rather than on the table, so the header
    // row scrolls with its body.
    <div
      className="overflow-x-auto"
      style={{ marginInline: "calc(var(--page-gutter) * -1)", paddingInline: "var(--page-gutter)" }}
    >
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
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
                } ${column.key === "name" ? "" : NARROW}`}
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
              <tr key={entry.player.fantraxId} className="border-b border-line/60 hover:bg-raised">
                <td className="numeric px-1 text-right text-2xs text-faint">{stats?.rank ?? "—"}</td>
                <td className="py-1">
                  <Link
                    href={`/players/${entry.player.fantraxId}`}
                    className="flex min-h-11 items-center gap-2.5 px-1"
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
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{entry.player.displayName}</span>
                      <span className="flex items-center gap-1.5 text-2xs text-faint">
                        {/* The league's eligibility, not the pool's single
                            position: "F/M" is what the commissioner set and what
                            the planner obeys, and the global pool's letter is a
                            different league's answer. */}
                        <span className="numeric tracking-widest">
                          {positionsLabel(entry.eligiblePositions) ?? "—"}
                        </span>
                        <span className="numeric tracking-widest">
                          {entry.player.clubCode ?? "—"}
                        </span>
                        {owner ? (
                          <span className="truncate font-bold text-mid">{owner}</span>
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

/** Which way ownership moved, said in the sign as well as the colour — a green
 *  number and a red one are the same number to a reader who cannot tell them
 *  apart. Nought is neither, and is drawn quiet rather than as a flat week. */
function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">—</span>;
  if (value === 0) return <span className="text-faint">0%</span>;
  return (
    <span className={value > 0 ? "text-up" : "text-bad"}>
      {value > 0 ? "+" : ""}
      {value}%
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
