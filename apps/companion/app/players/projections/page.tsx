import BoardKey from "../../components/league/BoardKey";
import Link from "@/app/components/shell/Link";
import { PLANNER_RUN, plannerGameweeks } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import QuerySelect from "../../components/shell/QuerySelect";
import ProjectionBoard, { projectionHeads } from "./ProjectionBoard";
import { Carried, Chip, clubOptions } from "../BoardControls";
import { PAGE_ROWS, boardHref, chosen, filterHref, isChosen, playersQuery, type PlayersSearchParams } from "../query";
import { getLeaguePool } from "../pool";
import { readerTeamId } from "../../squads";
import { leaguePositionLabel } from "../../positions";
import { footballNow, seasonFixtures } from "../../football";
import { intelLeagueProjections } from "../../intel";
import { PROJECTIONS, PROJECTIONS_SHOWN } from "../routes";
import { QUIET_NOTE } from "@/app/desk";
import { notFound } from "next/navigation";
import {
  PROJECTION_CATEGORIES,
  knownMen,
  projectionCategory,
  projectionRows,
  projectionSort,
  sortedProjections,
} from "./rows";

// Data › Projections: who the sister model tips over the next six, repriced in our league's points at each man's best
// slot (Craig, 2 Oct 2026: "projections for all players using real league's points"). FPL's own figure is never here.

export const revalidate = 30;

export default async function ProjectionsPage({ searchParams }: { searchParams: Promise<PlayersSearchParams> }) {
  if (!PROJECTIONS_SHOWN) notFound();
  const query = playersQuery(await searchParams);
  const [pool, fixtures, snapshot, reader] = await Promise.all([getLeaguePool(), seasonFixtures(), footballNow(), readerTeamId()]);
  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN);

  if (intelLeagueProjections.size === 0 || gameweeks.length === 0) {
    return (
      <ScoutShell current="projections">
        <Nothing title="No projections yet">The sister model&apos;s projections have not been exported.</Nothing>
      </ScoutShell>
    );
  }

  const pooled = "unavailable" in pool ? null : pool;
  const known = knownMen(snapshot.players, pooled?.rows ?? []);

  const sort = projectionSort(query.sort, gameweeks);
  const descending = (query.dir ?? "desc") === "desc";
  const positions = chosen(query.pos);
  const club = (query.club ?? "").trim();
  const category = projectionCategory(query.cat);
  const categoryLabel = PROJECTION_CATEGORIES.find((entry) => entry.value === category)?.label ?? category;
  const shown = sortedProjections(
    projectionRows(intelLeagueProjections, gameweeks, known, category).filter(
      (row) =>
        (club === "" || row.club === club) &&
        (positions.length === 0 || positions.some((position) => row.positions.includes(position))),
    ),
    sort,
    gameweeks,
    descending,
  );
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);
  const clubs = [...new Set([...intelLeagueProjections.values()].map((player) => player.club))].sort();
  const leaguePositions = pooled?.positions ?? [];

  return (
    <ScoutShell current="projections">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip on={positions.length === 0} href={boardHref(query, { pos: undefined }, PROJECTIONS)}>
          All
        </Chip>
        {leaguePositions.map((position) => (
          <Chip key={position} on={isChosen(query, "pos", position)} href={filterHref(query, "pos", position, PROJECTIONS)}>
            {leaguePositionLabel(position)}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 lg:max-w-md">
        <QuerySelect
          name="cat"
          label="Category"
          value={category === "points" ? "" : category}
          options={PROJECTION_CATEGORIES.map((entry) => ({ ...entry, value: entry.value === "points" ? "" : entry.value }))}
          action={PROJECTIONS}
        >
          <Carried query={query} except={["cat"]} />
        </QuerySelect>
        <QuerySelect
          name="club"
          label="Club"
          value={club}
          options={clubOptions(clubs)}
          action={PROJECTIONS}
        >
          <Carried query={query} except={["club"]} />
        </QuerySelect>
      </div>

      {shown.length === 0 ? (
        <p className="border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody the model projects matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <ProjectionBoard
          rows={capped}
          gameweeks={gameweeks}
          category={categoryLabel}
          sort={sort}
          descending={descending}
          href={(key, down) => boardHref(query, { sort: key, dir: down ? "desc" : "asc" }, PROJECTIONS)}
          teamNames={pooled?.teamNames ?? new Map()}
          reader={reader}
        />
      )}

      {capped.length < shown.length ? (
        <p className={QUIET_NOTE}>
          Showing the first {capped.length}.{" "}
          <Link href={boardHref(query, { all: "1" }, PROJECTIONS)} className="font-bold text-accent underline">
            Show all {shown.length}
          </Link>
          .
        </p>
      ) : null}
      {shown.length === 0 ? null : (
        <BoardKey
          entries={projectionHeads(categoryLabel, gameweeks)
            .slice(0, 2)
            .concat(gameweeks.length === 0 ? [] : [{ key: "gw", label: "GW", title: `Each gameweek: ${categoryLabel}, projected` }])}
        />
      )}
    </ScoutShell>
  );
}
