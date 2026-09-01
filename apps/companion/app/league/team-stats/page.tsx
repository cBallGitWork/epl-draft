import Link from "next/link";
import {
  categoryFor,
  isMeasure,
  rankBy,
  teamPeriodStats,
  type Measure,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import TeamBadge from "../../components/league/TeamBadge";
import { Head, HeadRow, NameHead, PLATE } from "../../components/league/TableHeads";
import LeagueShell from "../Shell";
import Filters from "./Filters";
import { getSeasonStats } from "./seasonStats";
import { getSchedule, getSeasonResults } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { teamBadges } from "../../standings";
import { FANTRAX_SILENT } from "../../config";

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
// High and Low stay, on Craig's call ("i like having a best and worst score,
// just for fantasy points for a week") — they are the one thing the board cannot
// say, because they are about a ROUND and every category here is a season total.
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
type Search = Promise<{ cat?: string; by?: string }>;

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown category falls back to the first rather than throwing: the choice
  // arrives in a URL, and a shared link with a stale name should still show a
  // board.
  const category = categoryFor(query.cat);
  const measure: Measure = isMeasure(query.by) ? query.by : "points";

  const [schedule, mine, badges, results, categories] = await Promise.all([
    getSchedule(),
    readerTeamId(),
    teamBadges(),
    getSeasonResults(),
    getSeasonStats(),
  ]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell title="Team Stats" current="teamStats">
        <Nothing title="Team Stats unavailable" code={FANTRAX_SILENT}>
          {schedule.unavailable}
        </Nothing>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = schedule;

  // Finished rounds only, the same test Results uses — see `gameweekStatus` in
  // core. A round in play has a total that is still moving, and a high-water
  // mark that changes while you read it is not a statistic.
  const played = new Set(
    rounds
      .filter((round) => round.status === "finished")
      .map((round) => round.period),
  );
  const rounds5 = new Map(
    teamPeriodStats(results, played).map((row) => [row.teamId, row]),
  );

  const lines = categories.get(category.key) ?? [];
  const board = rankBy(lines, category, measure);
  const named = new Map(table.map((row) => [row.teamId, row.teamName]));

  return (
    <LeagueShell title="Team Stats" current="teamStats" teams={info.teams.length}>
      <Filters category={category.key} measure={measure} />

      {board.length === 0 ? (
        <Nothing title="Nothing recorded yet" code={`${played.size} finished rounds scored`}>
          {category.label} fills in as {info.name} plays.
        </Nothing>
      ) : (
        <div className="overflow-x-auto">
          {/* `border-collapse`, exactly as `/league` sets it. With
              `border-separate` the `border-b` on each `<tr>` is not drawn at all
              — CSS tables only render row borders when collapsed — and the index
              column runs together into one unbroken blue bar down the left. */}
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Every team ranked by {category.label}, {LABEL[measure]}
            </caption>
            <thead>
              <HeadRow>
                <Head width="w-10 lg:w-16">
                  <span className="flex h-7 items-center justify-center px-1.5" />
                </Head>
                <NameHead label="Team" />
                <Head width="w-16 lg:w-28" title="Best round — fantasy points in one period">
                  <span className={PLATE}>High</span>
                </Head>
                <Head width="w-16 lg:w-28" title="Worst round — fantasy points in one period">
                  <span className={PLATE}>Low</span>
                </Head>
                <Head width="w-20 lg:w-32" title={category.key}>
                  <span className={PLATE}>{HEAD[measure]}</span>
                </Head>
              </HeadRow>
            </thead>
            <tbody>
              {board.map((row) => {
                const yours = row.teamId === mine;
                const week = rounds5.get(row.teamId);
                const figure = measure === "points" ? row.points : row.value;

                return (
                  <tr
                    key={row.teamId}
                    className={`border-b border-bg ${yours ? "bg-raised" : "hover:bg-surface"}`}
                  >
                    {/* The ordinal, in CM's own index block. `24.jpg` runs
                        `1st 2nd 3rd` down the left of every table it draws, and
                        a column of bare numbers is a list where a column of
                        ordinals is a league. */}
                    <td className="cm-index numeric px-1.5 text-center text-2xs font-bold">
                      {ordinal(row.rank)}
                    </td>
                    <td className="pl-2">
                      <Link
                        href={`/squad/${row.teamId}`}
                        className={`cm-row flex min-h-11 items-center gap-2 text-base font-bold hover:underline lg:text-lg ${yoursInk(
                          yours,
                        )}`}
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
                    <td className={`${FIGURE} text-mid`}>{week?.high ?? DASH}</td>
                    <td className={`${FIGURE} text-mid`}>{week?.low ?? DASH}</td>
                    {/* The category's own figure, and the only column on this
                        screen the order is about. Yellow because CM pays every
                        stat figure the same `#faff00` (measured, `21.jpg`). */}
                    <td className={`${FIGURE} text-base text-accent lg:text-lg`}>
                      {figure === null ? DASH : figure.toLocaleString("en-GB")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Why the two boxes can disagree, said once under the board rather
              than left for a reader to work out from a rank that moved.
              Flipping the measure genuinely inverts some categories: a side
              conceding fewest goals across the fewest minutes tops the raw
              column and sits bottom of the points one, and both are right.
              Fantrax has already priced the minutes; the raw figure has not. */}
          <p className="px-1.5 pt-2 text-2xs text-faint">
            Fantasy points are Fantrax&apos;s own and already account for how
            long a squad was on the pitch. A raw total does not, so the two
            orders can differ.
          </p>
        </div>
      )}
    </LeagueShell>
  );
}

/** Absence, never a nought — a team with no reading has not recorded nought of
 *  it (DESIGN §7). */
const DASH = "—";

const FIGURE = "numeric px-1.5 text-center text-2xs font-bold text-ink";

/** What the ranked column is headed. `FPts` is Fantrax's own abbreviation and is
 *  reserved for Fantrax's own numbers, which these are. */
const HEAD: Record<Measure, string> = { points: "FPts", value: "Total" };
const LABEL: Record<Measure, string> = {
  points: "by fantasy points",
  value: "by raw total",
};

/** `1` becomes `1st`. CM's index cell carries the ordinal and not the number,
 *  which is a small thing that reads as the game immediately — a column of
 *  `1st 2nd 3rd` is a league table and a column of `1 2 3` is a list. */
function ordinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return `${rank}th`;
  return `${rank}${["th", "st", "nd", "rd"][rank % 10] ?? "th"}`;
}
