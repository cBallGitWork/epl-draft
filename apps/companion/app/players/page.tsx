import Link from "next/link";
import ScoutShell from "./Shell";
import PlayerTable from "./PlayerTable";
import BoardBar from "./BoardBar";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { readerTeamId } from "../squads";
import {
  PAGE_ROWS,
  activeGroup,
  activeSort,
  isPer90,
  playersQuery,
  showAllHref,
  shownRows,
} from "./query";
import type { PlayersSearchParams } from "./query";
import { POOL } from "./routes";
import { POOL_GROUPS, columnsIn } from "./groups";
import type { PoolGroupKey } from "./groups";
import { figureOf } from "./figure";
import { cutsFor } from "./standout";
import { FANTRAX_APP_BASE, FANTRAX_LEAGUE_ID, FANTRAX_PLAYERS_PATH } from "@epl/core";
import type { StatSeason } from "@epl/core";
import OutLink from "../components/shell/OutLink";
import FantraxSilent from "../components/shell/FantraxSilent";

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

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/* The filter chips and the stat-group strip moved to `BoardBar.tsx` on 10 Sep
   2026, with the docblock recording why they are bevels rather than tabs. This
   page had reached 256 lines and most of them were a control field it was
   drawing by hand; what is left here is the page's own job — read, filter, count
   and say what could not be read. */

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines, reader] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
    readerTeamId(),
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
        <FantraxSilent code={pool.unavailable}>
          The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
          that would go stale first, so this shows nothing rather than yesterday&apos;s.
        </FantraxSilent>
      </ScoutShell>
    );
  }

  const shown = shownRows(pool.rows, query, raw);
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);

  const group = activeGroup(query);
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
    <ScoutShell
      title={caption(group, pool.season)}
    >
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

      {/* The caption carries this on a desk; a phone has no caption, and a projection must still say so. */}
      {pool.season?.projected ? (
        <p className="text-2xs font-bold text-accent lg:hidden">{pool.season.name || "This season"} — Fantrax projection</p>
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
        />
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
      <OutLink href={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}/${FANTRAX_PLAYERS_PATH}`}>
        Claim on Fantrax
      </OutLink>
    </ScoutShell>
  );
}

/** What the caption says.
 *
 *  **It names the plate, because the drawer can hide it.** DESIGN §2's reading of
 *  `cm9900/16.jpg` is that the bar says where you are and the caption says what
 *  the board IS — that shot captions its stat list `Average Rating`. Below `lg`
 *  the stat groups live behind the Filter plate, so the caption is the only
 *  thing left saying which columns are on screen. `all` falls through to the
 *  section's own caption rather than printing "All", which is a word about a control and
 *  not a name for a board.
 *
 *  **And it carries the provenance, but only when the provenance bites.** The
 *  count-and-season line under the title bar came off on 10 Sep 2026 (Craig:
 *  *"remove that row"*), and it was doing one job worth keeping: saying whether
 *  the `FPts` column holds what a man SCORED or what Fantrax PREDICTS he will.
 *  That read defaulted to a projection until 5 Sep and now defaults to
 *  year-to-date, and it can change again without anybody touching this app — a
 *  column headed `FPts` that silently switched between the two is the confident
 *  wrong answer DESIGN §7 exists to prevent.
 *
 *  So the label appears exactly when it changes the meaning of the board. Actual
 *  season-to-date figures are what a reader already assumes and get no words; a
 *  projection says so, in the caption, every time. A permanent bar saying "YTD"
 *  is furniture, and furniture is what gets stopped being read. */
function caption(group: PoolGroupKey, season: StatSeason | null): string | undefined {
  const name = group === "all" ? undefined : POOL_GROUPS.find((e) => e.key === group)?.label;
  if (!season?.projected) return name;
  const warning = `${season.name || "This season"} — Fantrax projection`;
  return name ? `${name} · ${warning}` : warning;
}
