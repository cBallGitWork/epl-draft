import ScrollBoard from "../../../components/league/ScrollBoard";
import Link from "@/app/components/shell/Link";
import { clubStats, leagueTable, ordinal } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { Head, HeadRow, NameHead, PRESSED_PLATE } from "../../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../../components/league/TableCells";
import PremShell from "../../Shell";
import { CLUB } from "../../routes";
import { TEAM_STATS } from "../../PremNav";
import QuerySelect from "../../../components/shell/QuerySelect";
import { CATEGORIES, categoryFor, printed, type Club } from "./categories";
import { footballNow, seasonFixtures } from "../../../football";
import { BOARD, FIGURE, ROW_HOVER } from "@/app/desk";
import ClubLabel from "@/app/components/football/ClubLabel";

// Every club ranked by one measure at a time: a leaderboard, not a spreadsheet.
// Every figure is FPL's and the caption says so, as Fantrax counts the same men differently.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string }>;

const CATEGORY_OPTIONS = CATEGORIES.map((entry) => ({ value: entry.key, label: entry.label }));

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const category = categoryFor(query.cat);

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const table = leagueTable(fixtures, snapshot.clubs);
  const stats = new Map(
    clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club]),
  );

  const clubs: Club[] = table.flatMap((row) => {
    const club = stats.get(row.clubId);
    // Both halves or neither: a row with a record and no squad would print a
    // nought against a club whose players we simply did not see.
    return club === undefined ? [] : [{ table: row, stats: club }];
  });

  if (clubs.length === 0) {
    return (
      <PremShell current="teamStats">
        <Nothing title="No clubs to rank" code="bootstrap-static → 0 teams">
          The board is built from the clubs and fixtures FPL publishes, and it has named none.
        </Nothing>
      </PremShell>
    );
  }

  // Ties break on table place, so level clubs never swap between refreshes.
  const board = clubs
    .map((club, place) => ({ club, place: place + 1, figure: category.of(club) }))
    .sort((a, b) =>
      (category.descending ? b.figure - a.figure : a.figure - b.figure) || a.place - b.place,
    );

  return (
    <PremShell current="teamStats" rows={clubs.length}>
      {/* The picker on its own strip, with the figures' provenance beside it. */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5">
        <QuerySelect name="cat" label="Category" value={category.key} options={CATEGORY_OPTIONS} action={TEAM_STATS} />
        <p className="text-3xs uppercase text-faint">FPL&apos;s own figures</p>
      </div>

      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <Head width="w-8 lg:w-14" />
              <NameHead label="Club" />
              <Head width="w-20 lg:w-32" title={category.title} sorted="descending">
                {/* A plain plate, not a link: the picker is what changes the order. */}
                <span className={PRESSED_PLATE}>
                  {category.label}
                </span>
              </Head>
            </HeadRow>
          </thead>
          <tbody>
            {board.map(({ club, figure }, at) => (
              <tr key={club.table.clubId} className={ROW_HOVER}>
                {/* Counts the board, not the table: the ranking the reader asked for. */}
                <IndexCell>{ordinal(at + 1)}</IndexCell>
                <td className="pl-2">
                  <Link
                    href={`${CLUB}/${club.table.code}`}
                    className={ROW_LINK}
                  >
                    <ClubLabel club={club.table} />
                  </Link>
                </td>
                {/* The accent: this is the board's one ordered column. */}
                <td className={`${FIGURE} text-accent`}>
                  {printed(category, figure)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </PremShell>
  );
}
