import Link from "next/link";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import PlayerTable, { STATUS } from "./PlayerTable";
import Board from "./Board";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { leagueTable } from "../standings";
import { PAGE_ROWS, filterHref, playersQuery, showAllHref, shownRows } from "./query";
import type { PlayersSearchParams } from "./query";
import { FANTRAX_SILENT } from "../config";
import { positionLabel } from "../positions";
import {
  type GroupKey,
  groupFor,
  playerCategoryFor,
  playersInGroup,
  rankPlayers,
} from "@epl/core";
import { BUTTON } from "../components/shell/ButtonLink";
import { PANEL } from "@/app/desk";

// Every player Fantrax knows, what our league has decided about him, and what
// Fantrax scores him. The numbers are theirs under our league's scoring, which
// is why the heading says which season they are and whether they were played or
// predicted — Fantrax defaults these reads to a projection, and a column headed
// FPts that silently switches between the two would be the confident wrong
// answer.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** A filter, drawn as the tab it behaves like.
 *
 *  These pick one of a set and change what the page lists, which is what a
 *  Championship Manager tab strip is — so they wear `cm-tab`, exactly as
 *  `league/SectionNav` does, and the one you are on is drawn PRESSED with the
 *  accent on its label by `desk.css`. They were bordered boxes with an accent
 *  edge when active: a modern web chip, and a second way of saying "selected"
 *  beside the one the rest of the desk already uses.
 *
 *  **No text COLOUR here, and none inside** — the size is ours, the ink is the
 *  plate's (desk.css). On `--color-chrome`, `--color-muted` is 3.55:1 and fails,
 *  so a count dimmed at the call site would land under the floor on every chip.
 *  CM prints its own count in the label's own colour — "Fitness (40)" — and so
 *  does this. */
const CHIP = "cm-tab flex items-center gap-1 px-3 text-sm font-medium";

/** Next hands a repeated query parameter as an array. The board wants one. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines, table] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
    leagueTable(),
  ]);
  const query = playersQuery(asked);

  // The board's own state, read straight off the query rather than through
  // `playersQuery`: those are the DIRECTORY's filters and these choose what the
  // leaderboard above it ranks. Two questions on one page, and folding them into
  // one query object would have every chip carrying a category it knows nothing
  // about.
  const group: GroupKey = groupFor(first(asked.group));
  const choices = playersInGroup(group);
  const category =
    choices.find((entry) => entry.key === first(asked.cat)) ??
    choices[0] ??
    playerCategoryFor(undefined);
  const board = rankPlayers(lines, category);

  if ("unavailable" in pool) {
    return (
      <section className={PANEL}>
        <Nothing title={FANTRAX_SILENT} code={pool.unavailable}>
          The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
          that would go stale first, so this shows nothing rather than yesterday&apos;s.
        </Nothing>
      </section>
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

      {board.length > 0 ? (
        <Board
          rows={board}
          group={group}
          category={category.label}
          teams={
            new Map(
              "unavailable" in table
                ? []
                : table.map((row) => [row.teamId, { teamId: row.teamId, name: row.teamName }]),
            )
          }
          codes={
            new Map(pool.rows.map((row) => [row.entry.player.fantraxId, row.fplCode]))
          }
        />
      ) : null}

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
          className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base"
        />
        <button
          type="submit"
          className={BUTTON}
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
              aria-current={query.status === code ? "page" : undefined}
              className={CHIP}
            >
              {STATUS[code] ?? code}
              <span className="numeric">({count})</span>
            </Link>
          ))}
        {pool.positions.map((position) => (
          <Link
            key={position}
            href={filterHref(query, "pos", position)}
            aria-current={query.pos === position ? "page" : undefined}
            className={CHIP}
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
