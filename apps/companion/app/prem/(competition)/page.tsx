import { Fragment } from "react";
import {
  PREMIERSHIP_CUTS,
  clubStats,
  defaultDescendingTable,
  isTableSortKey,
  leagueTable,
  placed,
  sortTable,
} from "@epl/core";
import Columns, { COLUMNS } from "../Columns";
import ClubRow from "../ClubRow";
import PremShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import { footballNow, seasonFixtures } from "../../football";
import { BOARD, SCROLL } from "@/app/desk";

// The Premier League table.
//
// **Computed, and it has to be** — `packages/core/src/football/table.ts` carries
// the probe: FPL's bootstrap has `played`, `win`, `draw`, `loss` and `points` on
// every club and every one of them is nought with two rounds finished. This
// belongs in the football layer precisely because its rules are fixed for
// everyone: three for a win, then goal difference, then goals scored is the
// competition's own arrangement and not a setting anybody can change. It is the
// exact inverse of `/league`, which quotes Fantrax's arithmetic and never does
// its own.
//
// **It costs no provider request.** `footballNow` and `seasonFixtures` are both
// `unstable_cache`d and both already warm on every page view — the layout reads
// one to decide whether the Live tab exists, and the league schedule reads the
// other. The real Premier League is the same for everybody, which is exactly why
// it is cacheable.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ sort?: string; dir?: string }>;

export default async function TablePage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown column falls back to the competition's own order rather than
  // throwing: the sort arrives in a URL, and a shared link with a stale column
  // name should still show the table.
  const sort = isTableSortKey(query.sort) ? query.sort : "place";
  const descending =
    query.dir === undefined ? defaultDescendingTable(sort) : query.dir === "desc";

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const table = leagueTable(fixtures, snapshot.clubs);

  if (table.length === 0) {
    return (
      <PremShell current="table">
        <Nothing title="No clubs to rank" code="bootstrap-static → 0 teams">
          The table is built from the clubs and fixtures FPL publishes, and it has named none.
        </Nothing>
      </PremShell>
    );
  }

  // The run each club is on, for the form column. Off the same fixtures the
  // table was built from, so the guide and the record can never disagree about
  // what happened.
  // No players passed: this page wants the run and not the squads, and handing
  // over six hundred men to have their seasons added up for a column nobody
  // prints here is work with no reader. Team Stats is where that half is spent.
  const form = new Map(
    clubStats(fixtures, snapshot.clubs, []).map((club) => [club.clubId, club.form]),
  );

  // Where the cuts fall. The count comes from the table rather than from a
  // constant, so a division of any size draws its relegation line where the
  // division actually ends.
  const relegation = table.length - PREMIERSHIP_CUTS.relegate;

  return (
    <PremShell current="table" rows={table.length}>
      {/* Out to the page's edges and back in again, so a table wider than the
          phone scrolls sideways inside its own box instead of scrolling the
          page. */}
      <div className={SCROLL}>
        <table className={BOARD}>
          <Columns sort={sort} descending={descending} />
          <tbody>
            {sortTable(placed(table), sort, descending).map(({ row, place }) => (
              <Fragment key={row.clubId}>
                <ClubRow row={row} place={place} form={form.get(row.clubId) ?? []} />
                {/* The two lines the season is decided by, drawn across the
                    table under the last qualifying place rather than shaded
                    over the rows above — a tinted band reads as "these are
                    yours", which is a claim no row on this table gets to make.

                    **Dashed, labelled, and in two different slots.** DESIGN §3
                    refuses yellow for the DRAFT table's cut because the accent
                    is already spoken for there twice, by the "yours" border and
                    the YOURS chip, on the very row a manager is hunting for.
                    Neither exists here: nobody owns Arsenal, so the accent is
                    free and `cm9900/24.jpg`'s own dashed yellow rule under 1st
                    is the thing to copy. Relegation takes `--color-bad`, whose
                    one meaning is a loss, a doubt, a negative — which is what
                    going down is. Both carry their name, so neither depends on
                    colour to be read.

                    Only in the competition's own order: a table sorted by goals
                    scored has no cut in it, because fourth on that list is not
                    fourth in the league. */}
                {ordered(sort, descending) && place === PREMIERSHIP_CUTS.qualify && place < table.length ? (
                  <Cut label="Champions League" tone="border-accent/80" />
                ) : null}
                {ordered(sort, descending) && place === relegation && place < table.length ? (
                  <Cut label="Relegation" tone="border-bad/80" />
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </PremShell>
  );
}

/** A rule across the whole table, naming what it separates. */
function Cut({ label, tone }: { label: string; tone: string }) {
  return (
    <tr aria-hidden>
      <td colSpan={COLUMNS.length} className="p-0">
        <span className="flex items-center gap-2 py-1.5 text-3xs font-bold uppercase text-faint">
          <span className={`flex-1 border-t border-dashed ${tone}`} />
          {label}
          <span className={`flex-1 border-t border-dashed ${tone}`} />
        </span>
      </td>
    </tr>
  );
}

/** Whether the rows are in the competition's own order, which is the only
 *  arrangement a cut line means anything in. */
function ordered(sort: string, descending: boolean): boolean {
  return sort === "place" && !descending;
}
