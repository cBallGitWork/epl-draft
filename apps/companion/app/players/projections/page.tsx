import Link from "next/link";
import { PLANNER_RUN, gameweekSpan, londonDayAndDate, plannerGameweeks } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import ClubPicker from "../ClubPicker";
import ProjectionBoard from "./ProjectionBoard";
import { Carried, Chip } from "../BoardControls";
import { PAGE_ROWS, boardHref, chosen, filterHref, isChosen, playersQuery, type PlayersSearchParams } from "../query";
import { getLeaguePool } from "../pool";
import { positionLabel } from "../../positions";
import { footballNow, seasonFixtures } from "../../football";
import { intelProjections, intelProjectionsManifest } from "../../intel";
import { PROJECTIONS } from "../routes";
import { projectionRows, projectionSort, sortedProjections, type Known } from "./rows";
import { BOARD_KEY } from "@/app/desk";

// Data › Projections, a scaffold (Craig, 24 Sep 2026: "just scaffold this … next 6 gameweeks … could import the
// current projections"): who the sister model tips over the next six, FPL-scoring, never Fantrax's.

export const revalidate = 30;


export default async function ProjectionsPage({ searchParams }: { searchParams: Promise<PlayersSearchParams> }) {
  const query = playersQuery(await searchParams);
  const [pool, fixtures, snapshot] = await Promise.all([getLeaguePool(), seasonFixtures(), footballNow()]);
  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN);

  if (intelProjections.size === 0 || gameweeks.length === 0) {
    return (
      <ScoutShell current="projections" title="Projected Points" rows={0}>
        <Nothing title="No projections yet">The sister model&apos;s projections have not been exported.</Nothing>
      </ScoutShell>
    );
  }

  // Our side of each man: FPL's short name, and the pool's full name, page and eligibility when it holds him.
  const rows = "unavailable" in pool ? [] : pool.rows;
  const byCode = new Map(rows.flatMap((row) => (row.fplCode === null ? [] : [[row.fplCode, row] as const])));
  const known = new Map<number, Known>();
  for (const player of snapshot.players) {
    const row = byCode.get(player.code);
    known.set(player.code, {
      name: player.name,
      fullName: row?.entry.player.displayName ?? player.name,
      fantraxId: row?.entry.player.fantraxId ?? null,
      positions: row?.entry.eligiblePositions ?? [],
    });
  }

  const sort = projectionSort(query.sort, gameweeks);
  const descending = (query.dir ?? "desc") === "desc";
  const positions = chosen(query.pos);
  const club = (query.club ?? "").trim();
  const shown = sortedProjections(
    projectionRows(intelProjections, gameweeks, known).filter(
      (row) =>
        (club === "" || row.club === club) &&
        (positions.length === 0 || positions.some((position) => row.positions.includes(position))),
    ),
    sort,
    gameweeks,
    descending,
  );
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);
  const clubs = [...new Set([...intelProjections.values()].map((player) => player.club))].sort();
  const leaguePositions = "unavailable" in pool ? [] : pool.positions;
  const window = gameweekSpan(gameweeks);

  return (
    <ScoutShell current="projections" title="Projected Points" rows={0}>
      {/* Provenance at the point of use (DESIGN §7): these are the sister model's FPL points, not Fantrax's. */}
      <p className={BOARD_KEY}>
        FPL-scoring projections by the sister model, {window}, exported{" "}
        {londonDayAndDate(intelProjectionsManifest.exportedAt)} · <span className="text-info">ours</span>
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip on={positions.length === 0} href={boardHref(query, { pos: undefined }, PROJECTIONS)}>
          All
        </Chip>
        {leaguePositions.map((position) => (
          <Chip key={position} on={isChosen(query, "pos", position)} href={filterHref(query, "pos", position, PROJECTIONS)}>
            {positionLabel(position) ?? position}
          </Chip>
        ))}
        <ClubPicker clubs={clubs} club={club} action={PROJECTIONS}>
          <Carried query={query} except={["club"]} />
        </ClubPicker>
      </div>

      {shown.length === 0 ? (
        <p className="border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody the model projects matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <ProjectionBoard
          rows={capped}
          gameweeks={gameweeks}
          sort={sort}
          descending={descending}
          href={(key, down) => boardHref(query, { sort: key, dir: down ? "desc" : "asc" }, PROJECTIONS)}
        />
      )}

      {capped.length < shown.length ? (
        <p className="text-2xs text-faint">
          Showing the first {capped.length}.{" "}
          <Link href={boardHref(query, { all: "1" }, PROJECTIONS)} className="font-bold text-accent underline">
            Show all {shown.length}
          </Link>
          .
        </p>
      ) : null}
    </ScoutShell>
  );
}
