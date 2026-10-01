import ScrollBoard from "../../components/league/ScrollBoard";
import Link from "next/link";
import {
  categoryFor,
  isMeasure,
  groupFor,
  offeredIn,
  ordinal,
  rankBy,
  type Measure,
  type StatCategory,
  DASH,
  thousands,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import TeamBadge from "../../components/league/TeamBadge";
import { Head, HeadRow, NameHead, SortHead } from "../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../components/league/TableCells";
import GroupNav from "../../components/league/GroupNav";
import { TEAM_STATS } from "../SectionNav";
import LeagueShell from "../Shell";
import Measures from "./Measures";
import { getSeasonStats } from "./seasonStats";
import { getSchedule } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { teamBadges } from "../../standings";
import { BOARD, BOARD_FIGURE, INDEX_WIDTH, ROW_NAME, ROW_RULE } from "@/app/desk";
import { teamHref } from "@/app/squad/routes";
import FantraxSilent from "../../components/shell/FantraxSilent";

// Every team against a whole GROUP of scoring categories — CM's stat board, on
// fantasy data.
//
// **One group across the top, one figure in every cell** (Craig, 11 Sep 2026:
// *"for each section, we can get all the columns in one go, but at the top,
// allow a toggle between fantasy points and actual raw values, so all attacking
// columns on one view"*). It showed ONE category for ten days — the CM "Average
// Rating" shot, a leaderboard rather than a spreadsheet — and the two things
// that made that right are what changed: the group row at the foot had already
// cut twelve categories to three or four, and the second measure column had
// already proved a row can carry more than one number. Four is the ceiling any
// group reaches, which is a board and still not Fantrax's twenty-two.
//
// **The measure is a toggle and no longer a pair of columns.** `Measures.tsx`
// carries why: two numbers per category is eight columns of alternating meaning,
// and a reader compares a column against the one beside it.
//
// **The category select went with it.** It picked which single category the
// board drew, and every category is drawn now; a control that changes nothing
// you cannot already see is furniture — the same argument that took the first
// dropdown off this page on 1 Sep. What it chose is now the ORDER, and the
// column heads say that, which is how `/league` has always sorted: a link, so
// the server orders, the phone gets HTML, and the ordering survives being shared.
//
// **The categories are ours and the totals are Fantrax's** — their SEASON_STATS
// view publishes each one twice, split by position, and `mapSeasonStats` adds
// the two halves back together along with the two traps that split creates.
//
// **No owner column, and not for want of asking.** CM's board names a player and
// his club, and the fantasy equivalent would be the team and its manager. Fantrax
// publishes no such field: `getLeagueInfo.teamInfo` is `{name, id}` and nothing
// else, checked against both leagues on 1 Sep 2026, and we hold no owner list of
// our own — `TEAM_CODES` maps a code to a team, never to a person. So the column
// was dropped rather than filled with a name we would have had to invent
// (Craig, 1 Sep: "ok ditch the manager name then"). If owners ever want naming,
// they are ours to collect and not Fantrax's to supply.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string; by?: string; group?: string }>;

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // The group first, then the category WITHIN it — which is the column the board
  // is ORDERED by now rather than the only one it draws. A category from another
  // group is not an error, it just falls back to this group's first: the choice
  // arrives in a URL, and a shared link should survive the row being reorganised.
  const group = groupFor(query.group);
  const measure: Measure = isMeasure(query.by) ? query.by : "points";

  const [schedule, mine, badges, categories] = await Promise.all([
    getSchedule(),
    readerTeamId(),
    teamBadges(),
    getSeasonStats(),
  ]);

  const columns = offeredIn(group, categories);
  const category =
    columns.find((entry) => entry.key === query.cat) ?? columns[0] ?? categoryFor(undefined);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell current="teamStats">
        <FantraxSilent code={schedule.unavailable}>
          The season table is Fantrax&apos;s own, and we cannot read it right now.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = schedule;

  // Finished rounds only, the same test Results uses — see `gameweekStatus` in
  // core. Kept for the empty state's count and nothing else now: a group with no
  // readings should say how far into the season that is.
  const played = new Set(
    rounds
      .filter((round) => round.status === "finished")
      .map((round) => round.period),
  );

  const board = rankBy(columns, categories, category, measure);
  const named = new Map(table.map((row) => [row.teamId, row.teamName]));
  const groupLabel = columns.map((entry) => entry.label).join(", ");

  return (
    <LeagueShell current="teamStats" teams={info.teams.length}>
      <Measures measure={measure} href={(by) => boardHref(by, group, category.key)} />

      {board.length === 0 ? (
        <Nothing title="Nothing recorded yet" code={`${played.size} finished rounds scored`}>
          {groupLabel} fill in as {info.name} plays.
        </Nothing>
      ) : (
        <ScrollBoard>
          {/* `border-collapse`, exactly as `/league` sets it: with
              `border-separate` the `border-b` on each `<tr>` is not drawn at all
              — CSS tables only render row borders when collapsed — and the index
              column runs together into one unbroken blue bar down the left.

              **`table-fixed`, and it is load-bearing rather than tidy.** The
              name is the column that gives, but only a fixed table makes it
              give: measured at 390 with a 32-character team name in every row,
              auto layout sized the name column to the TEXT, squeezed the four
              figures to 25–36px and scrolled the board 98px sideways, and
              `truncate` never bit because nothing constrained the cell. Fixed
              holds each figure at its declared width and hands the name the
              remainder; a board of eleven measures scrolls instead, and four fit. */}
          <table className={`${BOARD} table-fixed`}>
            <caption className="sr-only">
              Every team across {groupLabel}, ordered by {category.label} in{" "}
              {ORDERED_BY[measure]}
            </caption>
            <thead>
              <HeadRow>
                {/* The first two columns carry no head (DESIGN §2): a column of
                    `1st 2nd 3rd` in a blue block says what it is, and so does a
                    column of names with a crest on each. The empty span holds
                    the strip's height where the plate would have. */}
                <Head width={INDEX_WIDTH}>
                  <span className="flex h-7 items-center justify-center px-1.5" />
                </Head>
                <NameHead label="Team" />
                {columns.map((entry) => (
                  <SortHead
                    key={entry.key}
                    width={FIGURE_WIDTH}
                    title={`${entry.label} — ${entry.key}`}
                    href={boardHref(measure, group, entry.key)}
                    label={entry.short}
                    align="right"
                    sorted={entry.key === category.key ? direction(entry, measure) : undefined}
                  />
                ))}
              </HeadRow>
            </thead>
            <tbody>
              {board.map((row) => {
                const yours = row.teamId === mine;

                return (
                  <tr
                    key={row.teamId}
                    className={`${ROW_RULE} ${yours ? "bg-raised" : "hover:bg-surface"}`}
                  >
                    {/* The ordinal, in CM's own index block. `24.jpg` runs
                        `1st 2nd 3rd` down the left of every table it draws, and
                        a column of bare numbers is a list where a column of
                        ordinals is a league. */}
                    <IndexCell>{ordinal(row.rank)}</IndexCell>
                    <td className="pl-2">
                      <Link
                        href={teamHref(row.teamId)}
                        className={`${ROW_LINK} ${yoursInk(yours)}`}
                      >
                        <TeamBadge
                          team={{ teamId: row.teamId, name: named.get(row.teamId) ?? row.teamId }}
                          url={badges.get(row.teamId)}
                        />
                        <span className={`min-w-0 truncate ${ROW_NAME}`}>
                          {named.get(row.teamId) ?? row.teamId}
                        </span>
                      </Link>
                    </td>
                    {row.figures.map((figure, at) => (
                      // **Every figure is ink, including the sorted column's.**
                      // The single-category board tinted the column it was
                      // ordered by, which worked when there were two; four
                      // columns with one of them yellow is a stripe down the
                      // board, and the accent slot means "yours" — which the row
                      // beside it is already using it to say. Which column sorts
                      // is said by the pressed plate above it, exactly as
                      // `/league` says it across ten columns.
                      <td key={columns[at]?.key ?? at} className={`${BOARD_FIGURE} text-ink`}>
                        {figure === null ? DASH : thousands(figure)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollBoard>
      )}
      {/* A gap between the last row and the buttons — Craig, 1 Sep: "add a small
          gap between bottom of the table and rows". CM leaves air there too; the
          row was sitting hard against the final rule, which read as one more
          line of the table rather than as a bar under it. */}
      <div className="pt-2">
        <GroupNav group={group} href={(key) => `${TEAM_STATS}?group=${key}`} />
      </div>
    </LeagueShell>
  );
}

/** Where a head or a measure plate leads.
 *
 *  One function for both, because both links say the same three things and only
 *  one of the three moves: a head keeps the measure and changes the category, a
 *  plate keeps the category and changes the measure.
 *
 *  Fantasy points is the default, so it is spelled as no parameter at all — one
 *  URL for the default rather than two, as `/league` does with `rank`. */
function boardHref(by: Measure, group: string, category: string): string {
  const query = new URLSearchParams({ group, cat: category });
  if (by !== "points") query.set("by", by);
  return `${TEAM_STATS}?${query.toString()}`;
}

/** Which way the board runs when it is ordered by this column.
 *
 *  Fantasy points always run high-to-low; a raw figure runs low-to-high in the
 *  categories where topping the table is bad news. `rankBy` makes the same call
 *  in core, and the arrow exists so the reader is not left to infer it from the
 *  numbers — which is why the sorted head takes one here where the old
 *  FPts/Total pair did not. */
function direction(category: StatCategory, measure: Measure): "ascending" | "descending" {
  return measure === "value" && category.lowIsGood === true ? "ascending" : "descending";
}

/** How much of the row one category takes.
 *
 *  Measured rather than chosen, and against the SEASON'S widest figure rather
 *  than today's: `table-fixed` means a cell too narrow clips instead of growing.
 *  The broadest reading on the board now is 2,747 minutes at 29px, and minutes
 *  are the category that reaches six characters by May — 48px carries those at
 *  `BOARD_FIGURE`'s 14px with the plate's 6px either side, and a three-letter
 *  head (`PKM`) at `text-3xs`.
 *
 *  **The trade is against the NAME, and it is why this is 48 and not 56.** Four
 *  columns — the most any group has — leave a 390 phone 122px for the name at
 *  this width and 90 at the next one up, and 90 is a badge and six characters.
 *  The group that actually needs the six-figure cell is Appearances, which has
 *  ONE column and 258px of name to spare. The desk gets the roomier 80. */
const FIGURE_WIDTH = "w-12 lg:w-20";

/** How the caption says which way the board is ordered. */
const ORDERED_BY: Record<Measure, string> = {
  points: "fantasy points",
  value: "raw totals",
};
