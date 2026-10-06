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
import { FANTRAX_LEAGUE_PAGE, FANTRAX_PLAYERS_PATH, playerByCode } from "@epl/core";
import { footballNow } from "../football";
import OutLink from "../components/shell/OutLink";
import FantraxSilent from "../components/shell/FantraxSilent";

// Every player Fantrax knows, who holds him in our league, and what Fantrax scores him under our scoring.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads it statically, so it cannot be imported.
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

  // The raw counts by Fantrax id; the fantasy figures ride on `PoolRow`, and the two never overlap.
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
  const scored = new Set(lines.flatMap((line) => Object.keys(line.stats)));
  const columns = columnsIn(group, activeSort(query).key, scored);

  // Cut over the rows drawn, so a mark means the top of what is in front of you.
  const cuts = cutsFor(
    columns.filter((column) => column.mark !== undefined),
    (column) =>
      capped.map((row) => {
        const value = figureOf(column, row, raw.get(row.entry.player.fantraxId), rated);
        return typeof value === "number" ? value : null;
      }),
  );

  // Every club with a man in the pool, so no option empties the board.
  const clubs = [
    ...new Set(pool.rows.map((row) => row.entry.player.clubCode).filter(Boolean)),
  ].sort() as string[];

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // A man with no status is still listed; he has no chip to count under.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <ScoutShell rows={POOL_ROWS}>
      {/* While the board is a picker every row's link has changed, so it says so, with a way out. */}
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
        scored={scored}
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

      {/* Why a number is missing: a read that did not answer, then one that answered short. */}
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

      {/* Claims happen on Fantrax: their players list, on the path taken off a real session. */}
      <OutLink href={`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_PLAYERS_PATH}`}>
        Claim on Fantrax
      </OutLink>
    </ScoutShell>
  );
}
