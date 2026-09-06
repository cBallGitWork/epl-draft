import Link from "next/link";
import ScoutShell from "./Shell";
import Nothing from "../components/shell/Nothing";
import PlayerTable, { STATUS } from "./PlayerTable";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { PAGE_ROWS, filterHref, playersQuery, showAllHref, shownRows } from "./query";
import type { PlayersSearchParams } from "./query";
import { FANTRAX_SILENT } from "../config";
import { FANTRAX_APP_BASE, FANTRAX_LEAGUE_ID, FANTRAX_PLAYERS_PATH } from "@epl/core";
import { positionLabel } from "../positions";
import { BUTTON } from "../components/shell/ButtonLink";

// Every player Fantrax knows, what our league has decided about him, and what
// Fantrax scores him. The numbers are theirs under our league's scoring, which
// is why the heading says which season they are and whether they were played or
// predicted — a column headed FPts that silently switched between the two would
// be the confident wrong answer. (That read defaulted to a PROJECTION until
// 5 Sep 2026 and now defaults to year-to-date; the heading followed the payload
// without anyone touching it, which is the whole reason it is read off the
// answer. PLATFORM_NOTES carries the re-probe.)
//
// **It is its own section as of 6 Sep 2026** (Craig: *"I think this function
// will be its own section away from the league etc"*), so it wears `ScoutShell`
// rather than `LeagueShell`. It wore the league's frame for a day, which fixed
// the real fault of the day before — a bar of a third shape, no panel, and the
// directory printed straight onto the match photograph, which is the one thing
// DESIGN §2 forbids and was 40 of `groundfit`'s findings — but it did it by
// putting a screen about six hundred Premier League footballers under a bar
// naming our ten-team fantasy competition. True about who PRICES them and wrong
// about who they are.
//
// **The caption is the CATEGORY, not the view.** `cm9900/16.jpg` captions its
// stat list `Average Rating` and lets the frame say where you are, which is the
// arrangement here: the bar names the section, and the caption names what the
// board is ranked by. That is why `Board` draws no `Caption` of its own — two
// captions stacked is the screen saying its own name twice.

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

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
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
      <ScoutShell>
        <Nothing title={FANTRAX_SILENT} code={pool.unavailable}>
          The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
          that would go stale first, so this shows nothing rather than yesterday&apos;s.
        </Nothing>
      </ScoutShell>
    );
  }

  const shown = shownRows(pool.rows, query, raw);
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // Skipped rather than counted under a blank label: a player our league has
    // said nothing about is still listed, he simply has no status to filter by.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <ScoutShell
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
    >
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
        <PlayerTable rows={capped} query={query} teamNames={pool.teamNames} raw={raw} />
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

      {/* **The way out.** This screen is where a manager decides who to claim,
          and Fantrax is where the claim happens — we read their league and never
          write to it. Their own list rather than their home page, on the
          matrix-parameter path taken off a real browser session; a deeper guess
          would break silently the day they reorganise their routes, which is the
          reason `FANTRAX_APP_BASE` has carried that warning since it was added. */}
      <a
        href={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}/${FANTRAX_PLAYERS_PATH}`}
        target="_blank"
        rel="noopener noreferrer"
        className={BUTTON}
      >
        Claim on Fantrax &nearr;
      </a>
    </ScoutShell>
  );
}
