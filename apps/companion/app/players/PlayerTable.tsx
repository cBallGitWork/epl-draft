import Link from "next/link";
import { clubColours, toFplClubCode } from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import type { PoolRow } from "./pool";
import { COLUMNS, activeSort, sortHref } from "./query";
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

/** Columns the phone does not have room for. Not a smaller font — a row a thumb
 *  can hit and eyes can read at arm's length holds four things, and rank is the
 *  one a manager can infer from the order he is already looking at. */
const WIDE = "hidden md:table-cell";

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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
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
                className={`py-1.5 font-bold ${column.key === "name" ? "text-left" : "text-right"} ${
                  column.key === "rank" ? WIDE : ""
                } ${column.key === "name" ? "" : "w-14"}`}
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
                <td className={`numeric px-1 text-right text-2xs text-faint ${WIDE}`}>
                  {stats?.rank ?? "—"}
                </td>
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
                          {entry.eligiblePositions.join("/") || "—"}
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
                <td className="numeric px-1 text-right font-bold">{stats?.points ?? "—"}</td>
                <td className="numeric px-1 text-right text-muted">{stats?.perGame ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Arrow({ down }: { down: boolean }) {
  return (
    <span aria-hidden className="text-[0.5rem] leading-none">
      {down ? "▼" : "▲"}
    </span>
  );
}
