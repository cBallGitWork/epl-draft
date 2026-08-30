import Link from "next/link";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import PlayerTable, { STATUS } from "./PlayerTable";
import { getLeaguePool } from "./pool";
import { PAGE_ROWS, filterHref, playersQuery, showAllHref, shownRows } from "./query";
import type { PlayersSearchParams } from "./query";
import { FANTRAX_SILENT } from "../config";
import { positionLabel } from "../positions";

// Every player Fantrax knows, what our league has decided about him, and what
// Fantrax scores him. The numbers are theirs under our league's scoring, which
// is why the heading says which season they are and whether they were played or
// predicted — Fantrax defaults these reads to a projection, and a column headed
// FPts that silently switches between the two would be the confident wrong
// answer.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

function chip(active: boolean): string {
  return `flex min-h-11 items-center gap-1.5 border px-3 text-sm font-medium ${
    active ? "border-accent text-ink" : "border-line text-muted hover:bg-raised"
  }`;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked] = await Promise.all([getLeaguePool(), searchParams]);
  const query = playersQuery(asked);

  if ("unavailable" in pool) {
    return (
      <Nothing title={FANTRAX_SILENT} code={pool.unavailable}>
        The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
        that would go stale first, so this shows nothing rather than yesterday&apos;s.
      </Nothing>
    );
  }

  const shown = shownRows(pool.rows, query);
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // Skipped rather than counted under a blank label: a player our league has
    // said nothing about is still listed, he simply has no status to filter by.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Players"
        sub={
          <>
            {shown.length} of {pool.rows.length}
            {pool.season ? (
              <>
                {" · "}
                {pool.season.projected ? "Fantrax projection" : pool.season.name || "this season"}
              </>
            ) : null}
          </>
        }
      />

      <form action="/players" className="flex gap-1.5">
        {/* The chips, the sort and the box all filter the same list, so each has
            to carry the others' state — a GET form posts only its own fields. */}
        {(["status", "pos", "sort", "dir", "all"] as const).map((key) =>
          query[key] ? <input key={key} type="hidden" name={key} value={query[key]} /> : null,
        )}
        <input
          name="q"
          defaultValue={(query.q ?? "").trim()}
          placeholder="Find a player"
          aria-label="Find a player"
          className="min-h-11 min-w-0 flex-1 border border-line bg-surface px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 border border-line px-3 text-sm font-medium hover:bg-raised"
        >
          Find
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {[...counted.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, count]) => (
            <Link
              key={code}
              href={filterHref(query, "status", code)}
              aria-current={query.status === code ? "true" : undefined}
              className={chip(query.status === code)}
            >
              {STATUS[code] ?? code}
              <span className="numeric text-2xs text-faint">{count}</span>
            </Link>
          ))}
        {pool.positions.map((position) => (
          <Link
            key={position}
            href={filterHref(query, "pos", position)}
            aria-current={query.pos === position ? "true" : undefined}
            className={chip(query.pos === position)}
          >
            {positionLabel(position) ?? position}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className=" border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody in the pool matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <PlayerTable rows={capped} query={query} teamNames={pool.teamNames} />
      )}

      {capped.length < shown.length ? (
        <p className="text-2xs text-faint">
          Showing the first {capped.length}. Search or filter to narrow it, or{" "}
          <Link href={showAllHref(query)} className="font-bold text-accent underline">
            show all {shown.length}
          </Link>
          .
        </p>
      ) : null}

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
    </div>
  );
}
