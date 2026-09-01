import Link from "next/link";
import {
  categoryFor,
  isMeasure,
  rankBy,
  type Measure,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import TeamBadge from "../../components/league/TeamBadge";
import { Head, HeadRow, NameHead, PLATE } from "../../components/league/TableHeads";
import LeagueShell from "../Shell";
import Filters from "./Filters";
import { getSeasonStats } from "./seasonStats";
import { getSchedule } from "../schedule/schedule";
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
type Search = Promise<{ cat?: string; by?: string }>;

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown category falls back to the first rather than throwing: the choice
  // arrives in a URL, and a shared link with a stale name should still show a
  // board.
  const category = categoryFor(query.cat);
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
        <Nothing title="Team Stats unavailable" code={FANTRAX_SILENT}>
          {schedule.unavailable}
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
          <table
            // `max-w` on the TABLE and not on a column: `max-width` on a `<th>`
            // is ignored under automatic table layout, which is why capping the
            // name column changed nothing. Two number columns cannot fill 1440,
            // so the table stops short of it and the pair sits where the eye
            // already is instead of at the far edge.
            className="w-full max-w-3xl border-collapse text-sm"
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
                <Head
                  width="w-20 lg:w-32"
                  title={`${category.key} — fantasy points`}
                  sorted={measure === "points" ? "descending" : undefined}
                >
                  <span className={measure === "points" ? PRESSED : PLATE}>FPts</span>
                </Head>
                <Head
                  width="w-20 lg:w-32"
                  title={`${category.key} — raw total`}
                  sorted={measure === "value" ? "descending" : undefined}
                >
                  <span className={measure === "value" ? PRESSED : PLATE}>Total</span>
                </Head>
              </HeadRow>
            </thead>
            <tbody>
              {board.map((row) => {
                const yours = row.teamId === mine;

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
                    {/* The sorted column carries the weight — Craig, 1 Sep:
                        "TOTAL could be a bigger font". Set at the name's own
                        size and a step up above `lg`, which is the pairing
                        `24.jpg` uses: CM runs its club name and its figures at
                        the same height. The other column stays in `--color-mid`
                        at the row size, so the board says at a glance which
                        number it is ordered on without a second colour or an
                        arrow doing it. */}
                    <td
                      className={`${FIGURE} ${
                        measure === "points"
                          ? "text-lg text-accent lg:text-2xl"
                          : "text-mid"
                      }`}
                    >
                      {row.points === null ? DASH : row.points.toLocaleString("en-GB")}
                    </td>
                    <td
                      className={`${FIGURE} ${
                        measure === "value"
                          ? "text-lg text-accent lg:text-2xl"
                          : "text-mid"
                      }`}
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
    </LeagueShell>
  );
}

/** Absence, never a nought — a team with no reading has not recorded nought of
 *  it (DESIGN §7). */
const DASH = "—";

const FIGURE = "numeric px-1.5 text-center text-2xs font-bold text-ink";

/** The sorted column's plate, drawn pressed. The same object the league table's
 *  sortable heads use, so "the column this is ordered by" looks the same in both
 *  places rather than being invented twice. */
const PRESSED = "cm-bevel-pressed flex h-7 items-center justify-center whitespace-nowrap px-1.5";
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
