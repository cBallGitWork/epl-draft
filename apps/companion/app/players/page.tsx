import BoardKey from "../components/league/BoardKey";
import Link from "next/link";
import ScoutShell, { POOL_ROWS } from "./Shell";
import PlayerTable from "./PlayerTable";
import BoardBar from "./BoardBar";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { readerTeamId } from "../squads";
import {
  PAGE_ROWS,
  activeSort,
  boardHref,
  isPer90,
  playersQuery,
  shownRows,
  type PlayersSearchParams,
} from "./query";
import { POOL } from "./routes";
import { columnsIn, groupFor } from "./groups";
import { figureOf } from "./figure";
import { attributeStats } from "./attributeColumns";
import { divisionGrids } from "./[fantraxId]/grid";
import { cutsFor } from "./standout";
import { FANTRAX_APP_BASE, FANTRAX_LEAGUE_ID, FANTRAX_PLAYERS_PATH, playerByCode } from "@epl/core";
import { footballNow } from "../football";
import OutLink from "../components/shell/OutLink";
import FantraxSilent from "../components/shell/FantraxSilent";

// Every player Fantrax knows, what our league has decided about him, and what Fantrax scores him under our
// scoring; the heading says which season and whether played or projected, as the payload says.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines, reader, grids] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
    readerTeamId(),
    divisionGrids(),
  ]);
  const query = playersQuery(asked);

  // The raw counts, by Fantrax id. Two reads feed this table and neither is new:
  // the plain `getPlayerStats` carries the seven fantasy columns on `PoolRow`,
  // and the same endpoint asked by position group carries the eighteen or twenty
  // raw ones. `mapPlayerStats` drops the fantasy seven from its bag, so the two
  // do not overlap and each column reads from exactly one of them.
  const raw = new Map(lines.map((line) => [line.fantraxId, line.stats]));

  if ("unavailable" in pool) {
    return (
      <ScoutShell rows={POOL_ROWS}>
        <FantraxSilent code={pool.unavailable}>
          The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
          that would go stale first, so this shows nothing rather than yesterday&apos;s.
        </FantraxSilent>
      </ScoutShell>
    );
  }

  // Our attribute ratings ride in the same bag, so the Attributes plate sorts and marks like any count.
  for (const row of pool.rows) {
    const grid = row.fplCode === null ? undefined : grids.get(row.fplCode);
    if (grid !== undefined) raw.set(row.entry.player.fantraxId, { ...raw.get(row.entry.player.fantraxId), ...attributeStats(grid) });
  }

  const shown = shownRows(pool.rows, query, raw);
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);

  const group = groupFor(query.group);
  const rated = isPer90(query);
  const columns = columnsIn(group, activeSort(query).key);

  // **The cuts are taken over the rows actually DRAWN**, which is what makes a
  // mark mean "the top of this column, among what is in front of you" — see
  // `standout.ts`. Over all six hundred matching rows the top decile would be
  // sixty-five men, and a board sorted by points would light nearly every cell
  // on its first page.
  //
  // Only the columns that have a top worth marking are asked, so a rank, a
  // fixture and a name never enter the arithmetic at all.
  const cuts = cutsFor(
    columns.filter((column) => column.mark !== undefined),
    (column) =>
      capped.map((row) => {
        const value = figureOf(column, row, raw.get(row.entry.player.fantraxId), rated);
        return typeof value === "number" ? value : null;
      }),
  );

  // **Every club with a man in the pool, from the pool itself.** Not the twenty
  // Premier League clubs from the football layer: this is a filter over THIS
  // list, and offering a club whose players are all missing from the read would
  // be an option that empties the board. Sorted, because Fantrax's own order is
  // whatever their query returned.
  const clubs = [
    ...new Set(pool.rows.map((row) => row.entry.player.clubCode).filter(Boolean)),
  ].sort() as string[];

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // Skipped rather than counted under a blank label: a player our league has
    // said nothing about is still listed, he simply has no status to filter by.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <ScoutShell rows={POOL_ROWS}>
      {/* Said out loud while the board is a picker, because a table whose rows
          have quietly changed destination is a screen that lies about what a tap
          does. It carries its own way out. */}
      {query.compare ? (
        <p className="flex flex-wrap items-center gap-2 border border-accent bg-surface px-3 py-2 text-sm">
          <span className="font-bold text-accent">Pick the second player.</span>
          <Link href={POOL} className="underline">
            Cancel
          </Link>
        </p>
      ) : null}

      <BoardBar
        query={query}
        group={group}
        positions={pool.positions}
        clubs={clubs}
        counted={counted}
        rated={rated}
        shown={shown.length}
      />

      {/* A column headed FPts that silently became Fantrax's projection would be the confident wrong answer (DESIGN §7). */}
      {pool.season?.projected ? (
        <p className="text-2xs font-bold text-accent">{pool.season.name || "This season"} — Fantrax projection</p>
      ) : null}

      {shown.length === 0 ? (
        <p className=" border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody in the pool matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <PlayerTable
          rows={capped}
          columns={columns}
          query={query}
          teamNames={pool.teamNames}
          reader={reader}
          raw={raw}
          rated={rated}
          cuts={cuts}
          footballers={playerByCode(await footballNow())}
        />
      )}

      {capped.length < shown.length ? (
        <p className="text-2xs text-faint">
          Showing the first {capped.length}. Search or filter to narrow it, or{" "}
          <Link href={boardHref(query, { all: "1" })} className="font-bold text-accent underline">
            show all {shown.length}
          </Link>
          .
        </p>
      ) : null}
      {shown.length === 0 ? null : <BoardKey entries={columns.filter((column) => column.key !== "name")} />}

      {/* Both say why a number is missing rather than leaving a dash to be read
          as a nought. The first is a read that did not answer at all; the second
          is one that answered short. */}
      {pool.statsRefused ? (
        <p className="text-2xs text-faint">
          No points here — Fantrax would not give us its numbers ({pool.statsRefused}). Everything
          else on this page is current.
        </p>
      ) : null}

      {pool.missing > 0 ? (
        <p className="text-2xs text-faint">
          Fantrax has numbers for {pool.missing} more than this read carried; those rows show a dash.
        </p>
      ) : null}

      {/* **The way out.** This screen is where a manager decides who to claim,
          and Fantrax is where the claim happens — we read their league and never
          write to it. Their own list rather than their home page, on the
          matrix-parameter path taken off a real browser session; a deeper guess
          would break silently the day they reorganise their routes, which is the
          reason `FANTRAX_APP_BASE` has carried that warning since it was added. */}
      <OutLink href={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}/${FANTRAX_PLAYERS_PATH}`}>
        Claim on Fantrax
      </OutLink>
    </ScoutShell>
  );
}
