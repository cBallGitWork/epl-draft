import Image from "next/image";
import Link from "next/link";
import { clubStats, crestUrl, leagueTable, ordinal } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { Head, HeadRow, NameHead } from "../../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../../components/league/TableCells";
import PremShell from "../../Shell";
import { CLUB } from "../../PremNav";
import Filters from "./Filters";
import { categoryFor, type Club } from "./categories";
import { footballNow, seasonFixtures } from "../../../football";
import { BOARD, ROW_RULE, SCROLL } from "@/app/desk";

// Every club ranked by one measure — CM's stat board, on the real competition.
//
// **A leaderboard and not a spreadsheet**, which is the ruling
// `league/team-stats` records from the same reference shot: one category at a
// time, every side in order, the figure at the end. Seventeen categories as
// seventeen columns is what a provider's own page does, and it is unreadable
// under a thumb.
//
// **Every figure is FPL's and the caption says so.** Half of these are the
// competition's own counting — goals, clean sheets — and half are FPL's model of
// the underlying play. A reader one tab away is looking at Fantrax's numbers for
// the same footballers under different rules, and DESIGN §7 wants provenance at
// the point of use.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string }>;

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

  // Ranked by the category, then by the competition's own order — two clubs
  // level on clean sheets should not swap places between refreshes, and the
  // table is the tiebreak everybody already agrees on.
  const board = clubs
    .map((club, place) => ({ club, place: place + 1, figure: category.of(club) }))
    .sort((a, b) =>
      (category.descending ? b.figure - a.figure : a.figure - b.figure) || a.place - b.place,
    );

  return (
    <PremShell current="teamStats" rows={clubs.length}>
      {/* The category picker on its own strip above the board, with the rule
          under it — `cm9900`'s stat screen puts its two grey controls exactly
          here, and `league/team-stats` follows the same shot. */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5">
        <Filters category={category.key} />
        <p className="text-3xs uppercase text-faint">FPL&apos;s own figures</p>
      </div>

      <div className={SCROLL}>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <Head width="w-8 lg:w-14" />
              <NameHead label="Club" />
              <Head width="w-20 lg:w-32" title={category.title} sorted="descending">
                {/* Not a link: this board has ONE ordered column and the picker
                    beside it is how you change which. A plate drawn as a button
                    that cannot be pressed is a control that lies, so the head is
                    a plain plate — the same distinction `TableHeads.NameHead`
                    makes for the name column. */}
                <span className="cm-bevel-pressed flex h-7 items-center justify-center whitespace-nowrap px-1.5">
                  {category.label}
                </span>
              </Head>
            </HeadRow>
          </thead>
          <tbody>
            {board.map(({ club, figure }, at) => (
              <tr key={club.table.clubId} className={`${ROW_RULE} hover:bg-surface`}>
                {/* The ordinal in CM's index block: `24.jpg` runs `1st 2nd 3rd`
                    down the left of every table it draws, and a column of bare
                    numbers is a list where a column of ordinals is a league.
                    This one counts the BOARD rather than the table — it is the
                    ranking the reader asked for. */}
                <IndexCell>{ordinal(at + 1)}</IndexCell>
                <td className="pl-2">
                  <Link
                    href={`${CLUB}/${club.table.code}`}
                    className={ROW_LINK}
                  >
                    <Image
                      src={crestUrl({ code: club.table.code })}
                      alt=""
                      width={26}
                      height={26}
                      className="h-[var(--row-badge)] w-[var(--row-badge)] shrink-0 object-contain"
                      aria-hidden
                      unoptimized
                    />
                    <span className="min-w-0 truncate lg:hidden">{club.table.shortName}</span>
                    <span className="hidden min-w-0 truncate lg:inline">{club.table.name}</span>
                  </Link>
                </td>
                {/* The accent, because this is the column the board is ordered
                    by and there is only one of it. `league/team-stats` prints
                    two figures and spends the accent on whichever is sorted;
                    here every figure on screen is that column. */}
                <td className="numeric px-1.5 text-center text-sm font-bold text-accent">
                  {figure.toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PremShell>
  );
}
