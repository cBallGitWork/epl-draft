import Link from "next/link";
import {
  categoryFor,
  isMeasure,
  groupFor,
  inGroup,
  ordinal,
  rankBy,
  type Measure,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import TeamBadge from "../../components/league/TeamBadge";
import { Head, HeadRow, NameHead, SortHead } from "../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../components/league/TableCells";
import GroupNav from "../../components/league/GroupNav";
import { TEAM_STATS } from "../SectionNav";
import LeagueShell from "../Shell";
import Filters from "./Filters";
import { getSeasonStats } from "./seasonStats";
import { getSchedule } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { teamBadges } from "../../standings";
import { FANTRAX_SILENT } from "../../config";
import { BOARD, ROW_RULE, SCROLL } from "@/app/desk";

// Every team ranked by one category — CM's stat board, on fantasy data.
//
// **The screen is a leaderboard and not a spreadsheet** (Craig, 1 Sep 2026,
// against CM's "Average Rating" shot). One category at a time, every side in
// order, the figure at the end. The alternative — twelve categories as twelve
// columns — is what Fantrax's own page does, and it is unreadable on a phone and
// answers no question anybody asks.
//
// **Two grey boxes, at the two ends of the strip.** Left picks the category,
// right picks whether the order is by fantasy points or by the raw figure.
// Fantasy points is the default because this is a fantasy league: 1,500 minutes
// is not better than 1,400 unless those minutes were worth more.
//
// **The categories are ours and the totals are Fantrax's.** Their SEASON_STATS
// view publishes each category TWICE, split into a goalkeeper block and an
// outfielder block, and nobody thinks of clean sheets kept by their keeper and
// clean sheets kept by their defenders as two statistics. `mapSeasonStats` adds
// them, and carries the two traps that split creates.
//
// **One figure per row, and it is the category's.** High and Low rode along for
// a day and came off on sight (Craig, 1 Sep: "ditch high low, looks bad") — they
// answered a different question from the one the board asks, and three number
// columns on a leaderboard is a spreadsheet again. A best and worst round is
// still worth having; it belongs to a screen about ROUNDS, which this is not.
//
// **No owner column, and not for want of asking.** CM's board names a player and
// his club, and the fantasy equivalent would be the team and its manager. Fantrax
// publishes no such field: `getLeagueInfo.teamInfo` is `{name, id}` and nothing
// else, checked against both leagues on 1 Sep 2026, and we hold no owner list of
// our own — `TEAM_CODES` maps a code to a team, never to a person. So the column
// was dropped rather than filled with a name we would have had to invent
// (Craig, 1 Sep: "ok ditch the manager name then"). If owners ever want naming,
// they are ours to collect and not Fantrax's to supply.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string; by?: string; group?: string }>;

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown category falls back to the first rather than throwing: the choice
  // arrives in a URL, and a shared link with a stale name should still show a
  // board.
  // The group first, then the category WITHIN it. A category from another group
  // is not an error — a shared link survives the row being reorganised — it just
  // falls back to that group's first, which is a board rather than a blank.
  const group = groupFor(query.group);
  const choices = inGroup(group);
  const category =
    choices.find((entry) => entry.key === query.cat) ?? choices[0] ?? categoryFor(undefined);

  // Which column the board is ordered by. The dropdown that used to ask this
  // went when both columns started printing — it was choosing between two things
  // already on screen — but the CHOICE is still real, and for a beat there was
  // no way to make it (Craig, 1 Sep: "cant select total as filter"). It is the
  // column heads now, which is how `/league` has always sorted: a link, so the
  // server orders, the phone gets HTML, and the ordering survives being shared.
  const measure: Measure = isMeasure(query.by) ? query.by : "points";

  const [schedule, mine, badges, categories] = await Promise.all([
    getSchedule(),
    readerTeamId(),
    teamBadges(),
    getSeasonStats(),
  ]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell title="Team Stats" current="teamStats">
        <Nothing title={FANTRAX_SILENT} code={schedule.unavailable}>
          The season table is Fantrax&apos;s own, and we cannot read it right now.
        </Nothing>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = schedule;

  // Finished rounds only, the same test Results uses — see `gameweekStatus` in
  // core. Kept for the empty state's count and nothing else now: a category with
  // no readings should say how far into the season that is.
  const played = new Set(
    rounds
      .filter((round) => round.status === "finished")
      .map((round) => round.period),
  );

  const lines = categories.get(category.key) ?? [];
  const board = rankBy(lines, category, measure);

  const named = new Map(table.map((row) => [row.teamId, row.teamName]));

  return (
    <LeagueShell title="Team Stats" current="teamStats" teams={info.teams.length}>
      <Filters categories={choices} category={category.key} group={group} />

      {board.length === 0 ? (
        <Nothing title="Nothing recorded yet" code={`${played.size} finished rounds scored`}>
          {category.label} fills in as {info.name} plays.
        </Nothing>
      ) : (
        <div className={SCROLL}>
          {/* `border-collapse`, exactly as `/league` sets it. With
              `border-separate` the `border-b` on each `<tr>` is not drawn at all
              — CSS tables only render row borders when collapsed — and the index
              column runs together into one unbroken blue bar down the left. */}
          <table
            // Full width, and the figures ride the right edge — Craig, 1 Sep:
            // "it just needs to be at the end of the far right i think". The cap
            // that pulled them in was the answer to ONE floating column; with
            // both printing, the pair holds together and the far right is where
            // a total belongs. CM does the same on its own stat board: the
            // rating column sits hard right against the scrollbar.
            className={BOARD}
          >
            <caption className="sr-only">
              Every team ranked by {category.label}, {LABEL[measure]}
            </caption>
            <thead>
              <HeadRow>
                <Head width="w-10 lg:w-16">
                  <span className="flex h-7 items-center justify-center px-1.5" />
                </Head>
                <NameHead label="Team" />
                {/* Both numbers, always. Craig, 1 Sep: "have fantasy points and
                    raw value in two columns" — which also answers the floating
                    figure, because one number on a full-width table flings
                    itself to the far edge and two hold each other in. The
                    right-hand select now only REORDERS; it no longer decides
                    what you can see, and the column it ordered by is drawn
                    pressed so the board says which one it is sorted on. */}
                {MEASURES.map((entry) => (
                  <SortHead
                    key={entry.by}
                    width="w-20 lg:w-32"
                    title={`${category.key} — order by ${entry.title}`}
                    href={measureHref(entry.by, group, category.key)}
                    label={entry.label}
                    sorted={measure === entry.by ? "descending" : undefined}
                    arrow={false}
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
                        href={`/squad/${row.teamId}`}
                        className={`${ROW_LINK} ${yoursInk(yours)}`}
                      >
                        <TeamBadge
                          team={{ teamId: row.teamId, name: named.get(row.teamId) ?? row.teamId }}
                          url={badges.get(row.teamId)}
                        />
                        <span className="min-w-0 truncate">
                          {named.get(row.teamId) ?? row.teamId}
                        </span>
                      </Link>
                    </td>
                    {/* **Both figures at one size.** They were set apart for a
                        few minutes — the sorted one large, the other small — and
                        it read as two different kinds of number rather than as
                        one row (Craig, 1 Sep: "keep same font for fpts and
                        total, two different looks terrible"). Which column the
                        board is ordered by is said ONCE, by the pressed plate
                        above it, and saying it twice made the table look
                        mis-set. Same size, same weight; the sorted one takes
                        the accent and the other `--color-mid`, which is the
                        figure slot either way. */}
                    <td
                      className={`${FIGURE} ${measure === "points" ? "text-accent" : "text-ink"}`}
                    >
                      {row.points === null ? DASH : row.points.toLocaleString("en-GB")}
                    </td>
                    {/* White, not amber. `--color-mid` is "a figure" in the
                        palette and it is the right slot — but beside
                        `--color-accent` on the same row the two are a shade
                        apart, and the board lost the one thing the pair has to
                        say: which column it is ordered by. The sorted one keeps
                        the accent; this takes `--color-ink`, which is the same
                        distance from it that CM puts between its yellow figures
                        and its white names. */}
                    <td
                      className={`${FIGURE} ${measure === "value" ? "text-accent" : "text-ink"}`}
                    >
                      {row.value === null ? DASH : row.value.toLocaleString("en-GB")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

/** Where a measure's head links to.
 *
 *  It carries the group and the category through, because a head that sorted and
 *  silently dropped which category you were looking at would be a worse control
 *  than none.
 *
 *  Fantasy points is the default, so it is spelled as no parameter at all — one
 *  URL for the default rather than two, as `/league` does with `rank`. */
function measureHref(by: Measure, group: string, category: string): string {
  const query = new URLSearchParams({ group, cat: category });
  if (by !== "points") query.set("by", by);
  return `${TEAM_STATS}?${query.toString()}`;
}

/** Absence, never a nought — a team with no reading has not recorded nought of
 *  it (DESIGN §7). */
const DASH = "—";

/** One figure cell. Set at the row's own size rather than the head's small
 *  caps: this board has two number columns where the league table has ten, so
 *  they can afford to be read rather than scanned. */
const FIGURE = "numeric px-1.5 text-center text-base font-bold lg:text-lg";

const LABEL: Record<Measure, string> = {
  points: "by fantasy points",
  value: "by raw total",
};

/** The two heads, which are a pair of MEASURES rather than a row of columns —
 *  both are always descending, which is why they take no arrow. */
const MEASURES: readonly { by: Measure; label: string; title: string }[] = [
  { by: "points", label: "FPts", title: "fantasy points" },
  { by: "value", label: "Total", title: "raw total" },
];

