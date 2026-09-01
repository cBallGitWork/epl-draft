import { teamPeriodStats } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import TeamBadge from "../../components/league/TeamBadge";
import { Head, HeadRow, NameHead, PLATE } from "../../components/league/TableHeads";
import LeagueShell from "../Shell";
import { getSchedule, getSeasonResults } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { teamBadges } from "../../standings";
import { FANTRAX_SILENT } from "../../config";

// How each side got to its total, which is the one thing the table cannot say.
//
// The fifth blue button (Craig, 31 Aug). It was deferred that morning for a good
// reason — `getStandings` carries `streak` and `wwOrder` beyond what the table
// prints and nothing else, so a screen built on the standings payload would open
// on a near-copy of the table. This is built on the RESULTS payload instead, and
// that is a different question: a total throws away the distribution that made
// it, and two sides level on points-for can be a metronome and a coin-flip.
//
// No provider read of its own. `getSeasonResults` is already cached for the
// table's form guide and `getSchedule` already numbers the rounds.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function TeamStatsPage() {
  const [schedule, results, badges, mine] = await Promise.all([
    getSchedule(),
    getSeasonResults(),
    teamBadges(),
    readerTeamId(),
  ]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell title="Team Stats" current="teamStats">
        <Nothing title={FANTRAX_SILENT} code={schedule.unavailable}>
          These are read off the league&apos;s own results, and we cannot reach
          them right now.
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
  const stats = new Map(
    teamPeriodStats(results, played).map((row) => [row.teamId, row]),
  );

  if (stats.size === 0) {
    return (
      <LeagueShell
        title="Team Stats"
        current="teamStats"
        teams={info.teams.length}
      >
        <Nothing
          title="Nothing to average yet"
          code={`${played.size} finished rounds scored`}
        >
          A distribution needs rounds in it. These fill in as {info.name} plays.
        </Nothing>
      </LeagueShell>
    );
  }

  // The league's own order, so a reader moving between the two tabs finds the
  // same sixteen names in the same places. Ordering by average here would be a
  // second opinion about the table on a screen that is not the table.
  const rows = [...table].sort((a, b) => a.rank - b.rank);

  return (
    <LeagueShell
      title="Team Stats"
      current="teamStats"
      teams={info.teams.length}
    >
      <div className="overflow-x-auto">
        {/* `border-collapse`, exactly as `/league` sets it. With
            `border-separate` the `border-b` on each `<tr>` is not drawn at all —
            CSS tables only render row borders when collapsed — and the index
            column runs together into one unbroken blue bar down the left, which
            is how the first cut of this shipped. */}
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Each team&apos;s scoring across finished rounds
          </caption>
          <thead>
            <HeadRow>
              {/* The index column's head is empty and still plated-less: a
                  numbered column needs no label, and the strip starts at the
                  first figure either way. */}
              <Head width="w-8 lg:w-14">
                <span className="flex h-7 items-center justify-center px-1.5" />
              </Head>
              <NameHead label="Team" />
              {HEADS.map((head) => (
                <Head key={head.label} width={head.width} title={head.title}>
                  <span className={PLATE}>{head.label}</span>
                </Head>
              ))}
            </HeadRow>
          </thead>
          <tbody>
            {rows.map((row) => {
              const stat = stats.get(row.teamId);
              const yours = row.teamId === mine;
              return (
                <tr
                  key={row.teamId}
                  className={`border-b border-bg ${yours ? "bg-raised" : "hover:bg-surface"}`}
                >
                  <td className="cm-index numeric px-1.5 text-center text-2xs font-bold">
                    {row.rank}
                  </td>
                  <td className="pl-2">
                    <span
                      className={`cm-row flex min-h-11 items-center gap-2 text-base font-bold lg:text-lg ${yoursInk(
                        yours,
                      )}`}
                    >
                      <TeamBadge
                        team={{ teamId: row.teamId, name: row.teamName }}
                        url={badges.get(row.teamId)}
                      />
                      <span className="min-w-0 truncate">{row.teamName}</span>
                    </span>
                  </td>
                  <td className={FIGURE}>{stat?.scored ?? DASH}</td>
                  <td className={`${FIGURE} text-mid`}>{stat?.high ?? DASH}</td>
                  <td className={`${FIGURE} text-mid`}>{stat?.low ?? DASH}</td>
                  <td className={`${FIGURE} text-mid`}>
                    {mean(stat?.average)}
                  </td>
                  <td className={`${FIGURE} text-mid`}>{row.pointsFor}</td>
                  <td className={`${FIGURE} text-mid`}>{row.pointsAgainst}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </LeagueShell>
  );
}

/** Absence, never a nought — a team with no scored round has not averaged nought
 *  (DESIGN §7). */
const DASH = "—";

const FIGURE = "numeric px-1.5 text-center text-2xs font-bold text-ink";

const HEADS = [
  {
    label: "Rds",
    title: "Finished rounds with a readable total",
    width: "w-9 lg:w-16",
  },
  { label: "High", title: "Best round", width: "w-11 lg:w-20" },
  { label: "Low", title: "Worst round", width: "w-11 lg:w-20" },
  {
    label: "Avg",
    title: "Mean per round, to one decimal",
    width: "w-12 lg:w-20",
  },
  {
    label: "For",
    title: "Fantasy points scored — Fantrax's FPtsF",
    width: "w-11 lg:w-20",
  },
  {
    label: "Ag",
    title: "Fantasy points conceded — Fantrax's FPtsA",
    width: "w-11 lg:w-20",
  },
] as const;

/** One decimal, and the trailing nought stays. `60.0` beside `59.5` reads as a
 *  column; `60` beside `59.5` reads as two different kinds of number — the same
 *  reason `tnum` is on every figure in the app. */
function mean(value: number | null | undefined): string {
  return value === null || value === undefined ? DASH : value.toFixed(1);
}
