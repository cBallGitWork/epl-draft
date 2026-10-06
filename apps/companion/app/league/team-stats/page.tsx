import ScrollBoard from "../../components/league/ScrollBoard";
import Link from "next/link";
import {
  categoryFor,
  groupFor,
  leagueSeason,
  londonDayAndDate,
  offeredIn,
  ordinal,
  rankBy,
  type Measure,
  type StatCategory,
  DASH,
  thousands,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import { Head, HeadRow, NameHead, SortHead } from "../../components/league/TableHeads";
import { IndexCell, ROW_LINK } from "../../components/league/TableCells";
import GroupNav from "../../components/league/GroupNav";
import { TEAM_STATS } from "../SectionNav";
import LeagueShell from "../Shell";
import Measures, { viewFor, type View } from "./Measures";
import { getSeasonStats } from "./seasonStats";
import { getSquadStats } from "./squadStats";
import { squadColumnsIn } from "./squadColumns";
import { intelStatsManifest } from "../../intel";
import { getSchedule } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { BOARD, FIGURE_CELL, INDEX_WIDTH, MINOR_LABEL, ROW_NAME, ROW_RULE } from "@/app/desk";
import { teamHref } from "@/app/squad/routes";
import FantraxSilent from "../../components/shell/FantraxSilent";
import TeamName from "../../components/league/TeamName";

// Every team against one group of scoring categories, ordered by the head pressed: CM's stat board on fantasy data.
// FPts and Total are Fantrax's for each lineup from the league's first pairing; Squad adds up the stats league's counts for the men each team holds.
// No owner column: Fantrax's teamInfo is `{name, id}` and we hold no list of managers (Craig, 1 Sep: "ditch the manager name").

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string; by?: string; group?: string }>;

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // A category outside the group falls back to the group's first, so a shared link survives a regrouping.
  const group = groupFor(query.group);
  const view = viewFor(query.by);
  const squad = view === "squad";
  // A squad's counts are raw figures, so they rank as Total does.
  const measure: Measure = squad ? "value" : view;

  const [schedule, mine] = await Promise.all([getSchedule(), readerTeamId()]);

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

  // The league's own gameweeks that have kicked off: the calendar's weeks before its first pairing are not its own.
  const season = leagueSeason(info);
  const begun = rounds.filter((round) => season !== null && round.period >= season.firstPeriod && round.started);
  const opening = rounds.find((round) => round.period === season?.firstPeriod);
  const lines = await (squad ? getSquadStats() : getSeasonStats(season));
  const columns = squad ? squadColumnsIn(group) : offeredIn(group, lines);
  const category = columns.find((entry) => entry.key === query.cat) ?? columns[0] ?? categoryFor(undefined);

  const board = rankBy(columns, lines, category, measure);
  const named = new Map(table.map((row) => [row.teamId, row.teamName]));
  const groupLabel = columns.map((entry) => entry.label).join(", ");

  return (
    <LeagueShell current="teamStats" teams={info.teams.length}>
      <div className="flex items-center justify-between gap-2">
        <Measures view={view} href={(by) => boardHref(by, group, category.key)} />
        {squad ? <p className={MINOR_LABEL}>Season to {londonDayAndDate(intelStatsManifest.exportedAt)}</p> : null}
      </div>

      {!squad && begun.length === 0 ? (
        <Nothing title="No gameweek played yet" code={`getLeagueInfo → first pairing in period ${season?.firstPeriod ?? DASH}`}>
          Nothing counts until {opening === undefined ? "the league's first gameweek" : `Gameweek ${opening.gameweek}, the league's first`}.
        </Nothing>
      ) : board.length === 0 ? (
        squad ? (
          <Nothing title="No squads yet" code="getTeamRosters → no squads">
            Each squad&apos;s season adds up here once {info.name} has drafted.
          </Nothing>
        ) : (
          <Nothing title="Nothing recorded yet" code={`${begun.length} gameweeks begun`}>
            {groupLabel} fill in as {info.name} plays.
          </Nothing>
        )
      ) : (
        <ScrollBoard>
          {/* `border-collapse` draws the row rules; `table-fixed` holds each figure at its width and lets the name give. */}
          <table className={`${BOARD} table-fixed`}>
            <caption className="sr-only">
              Every team across {groupLabel}, ordered by {category.label} in{" "}
              {ORDERED_BY[view]}
            </caption>
            <thead>
              <HeadRow>
                {/* No heads over the ordinals and the names (DESIGN §2); the empty span holds the strip's height. */}
                <Head width={INDEX_WIDTH}>
                  <span className="flex h-7 items-center justify-center px-1.5" />
                </Head>
                <NameHead label="Team" />
                {columns.map((entry) => (
                  <SortHead
                    key={entry.key}
                    width={FIGURE_WIDTH}
                    title={entry.title ?? entry.label}
                    href={boardHref(view, group, entry.key)}
                    label={entry.short}
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
                    <IndexCell>{ordinal(row.rank)}</IndexCell>
                    <td className="pl-2">
                      <Link
                        href={teamHref(row.teamId)}
                        className={`${ROW_LINK} ${yoursInk(yours)}`}
                      >
                        <span className={`min-w-0 truncate ${ROW_NAME}`}>
                          <TeamName teamId={row.teamId} name={named.get(row.teamId) ?? row.teamId} />
                        </span>
                      </Link>
                    </td>
                    {row.figures.map((figure, at) => (
                      // Every figure is ink: the accent means "yours", and the pressed plate says which column sorts.
                      <td key={columns[at]?.key ?? at} className={`${FIGURE_CELL} text-ink`}>
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
      {/* Air between the last row and the foot row (Craig, 1 Sep). */}
      <div className="pt-2">
        <GroupNav group={group} href={(key) => `${TEAM_STATS}?group=${key}`} />
      </div>
    </LeagueShell>
  );
}

/** Where a head or a measure plate leads; the default measure is spelled as no parameter, one URL rather than two. */
function boardHref(by: View, group: string, category: string): string {
  const query = new URLSearchParams({ group, cat: category });
  if (by !== "points") query.set("by", by);
  return `${TEAM_STATS}?${query.toString()}`;
}

/** Which way the board runs ordered by this column: `rankBy`'s call, said by the arrow. */
function direction(category: StatCategory, measure: Measure): "ascending" | "descending" {
  return measure === "value" && category.lowIsGood === true ? "ascending" : "descending";
}

/** One category's width: 48px carries May's six-character minutes and leaves a 390 phone 122px of name at four columns. */
const FIGURE_WIDTH = "w-12 lg:w-20";

/** How the caption says which way the board is ordered. */
const ORDERED_BY: Record<View, string> = {
  points: "fantasy points",
  value: "raw totals",
  squad: "the season counts of the men each team holds",
};
