import {
  KEEPER_RANKINGS,
  OUTFIELD_RANKINGS,
  attributes,
  clubById,
  divisionAttributes,
  mapPastSeasons,
  fetchElementSummary,
  onTheBooks,
  preferredFoot,
  projectedPlace,
  projectedPoints,
  rankings,
  ratedLine,
  ratedRunning,
  shotLine,
} from "@epl/core";
import type { Attribute, FootballPlayer, IntelPlayer, PastSeason, ProjectedPlace, Ranked, Scouted, Tallied } from "@epl/core";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { footballNow } from "../../football";
import {
  intelLines,
  intelProjections,
  intelSetPieces,
  intelShots,
  intelSquads,
  lineFloors,
  lineSeasons,
} from "../../intel";
import type { StandoutCut } from "../../components/league/standout";
import { poolCut } from "../standout";
import { PAGE_REVALIDATE } from "../../config";

// The Championship Manager half of the player screen: the attribute grid, his rankings, the real
// position under them, and the seasons behind them. Every rating is a percentile, so this needs
// the division in hand; it is the snapshot every other screen keeps warm.

/** The sister's position lines, gathered into the groups his Rankings and projections sit within. */
const GROUP: Readonly<Record<string, string>> = {
  GK: "goalkeepers",
  CB: "defenders",
  FB: "defenders",
  DM: "midfielders",
  CM: "midfielders",
  AM: "midfielders",
  WF: "forwards",
  CF: "forwards",
};

/** His position group, or null where the sister has no line for him (23 of 296 regulars, 25 Sep 2026). */
function groupOf(code: number): string | null {
  const line = intelSquads.get(code)?.line;
  return line ? (GROUP[line] ?? null) : null;
}

const isKeeper = (code: number) => intelSquads.get(code)?.line === "GK";

/** Every man on the books, as the grid rates him and as his Rankings count him. Once per request. */
const division = cache(async (): Promise<{ rated: Scouted[]; tallied: Tallied[] }> => {
  const snapshot = await footballNow();
  const clubs = clubById(snapshot);
  const created = new Map<number, number>();
  for (const shots of intelShots.values()) {
    for (const shot of shots) {
      if (shot.assistCode !== null) created.set(shot.assistCode, (created.get(shot.assistCode) ?? 0) + 1);
    }
  }
  const players = snapshot.players.filter(onTheBooks);
  return {
    rated: players.map((player) => {
      const pieces = intelSetPieces.clubs[clubs.get(player.clubId)?.shortName ?? ""];
      const share = (duties: readonly ({ code: number; share: number }[] | undefined)[]) =>
        pieces === undefined
          ? null
          : duties.flatMap((duty) => duty ?? []).reduce((sum, taker) => sum + (taker.code === player.code ? taker.share : 0), 0);
      const now = intelLines.now.get(player.code);
      return {
        code: player.code,
        keeper: isKeeper(player.code),
        line: ratedLine(intelLines.last.get(player.code), now, lineFloors),
        running: ratedRunning(now, lineFloors),
        penaltyShare: share([pieces?.penalties]),
        setPieceShare: share([pieces?.freeKicks, pieces?.corners]),
      };
    }),
    tallied: players.map((player) => ({
      player,
      shots: intelShots.size === 0 ? null : shotLine(intelShots.get(player.code) ?? [], created.get(player.code) ?? 0),
    })),
  };
});

/** Him, and his position group: the men his Rankings and projections are placed among. */
async function measured(player: FootballPlayer) {
  const { tallied } = await division();
  const group = groupOf(player.code);
  const man = tallied.find((other) => other.player.code === player.code) ?? { player, shots: null };
  const cohort = group === null ? tallied : tallied.filter((other) => groupOf(other.player.code) === group);
  return { man, cohort, group, keeper: isKeeper(player.code) };
}

/** His grid, and which season it is rated on: `season` is null when he has played enough of neither. */
interface RatedGrid {
  attributes: Attribute[];
  season: string | null;
  keeper: boolean;
}

/** His grid, rated against every man of his role: keepers against keepers, the rest against outfielders. */
export async function playerGrid(player: FootballPlayer): Promise<RatedGrid> {
  const { rated } = await division();
  const keeper = isKeeper(player.code);
  const man = rated.find((other) => other.code === player.code) ?? {
    code: player.code,
    keeper,
    line: null,
    running: null,
    penaltyShare: null,
    setPieceShare: null,
  };
  const season = man.line === null ? null : man.line === intelLines.last.get(player.code) ? lineSeasons.last : lineSeasons.now;
  return { attributes: attributes(man, rated), season, keeper };
}

/** Every rated man's grid by FPL code, for ranking the pool by an attribute. */
export async function divisionGrids(): Promise<Map<number, Attribute[]>> {
  const { rated } = await division();
  const grids = divisionAttributes(rated);
  return new Map(rated.filter((man) => man.line !== null || man.running !== null).map((man) => [man.code, grids.get(man.code) ?? []]));
}

/** His season totals ranked within his group, the group's name, and whether he is a keeper. */
export async function playerStanding(player: FootballPlayer): Promise<{
  ranked: Ranked[];
  group: string | null;
  keeper: boolean;
  foot: string | null;
}> {
  const { man, cohort, group, keeper } = await measured(player);
  return {
    ranked: rankings(man, cohort, keeper ? KEEPER_RANKINGS : OUTFIELD_RANKINGS),
    group,
    keeper,
    foot: preferredFoot(man.shots),
  };
}

/** One gameweek of the model's projection: his points and place in his group, and the group's standout cuts. */
export interface ProjectedWeek {
  place: ProjectedPlace | null;
  cut: StandoutCut;
}

/** His projected gameweeks, each ranked within the group his grid is rated in. */
export async function projectedWeeks(player: FootballPlayer, gameweeks: readonly number[]): Promise<Map<number, ProjectedWeek>> {
  const { cohort } = await measured(player);
  const codes = cohort.map((other) => other.player.code);
  return new Map(
    gameweeks.map((gw) => [
      gw,
      {
        place: projectedPlace(player.code, codes, intelProjections, gw),
        cut: poolCut(codes.map((code) => projectedPoints(intelProjections, code, gw))),
      },
    ]),
  );
}

/** What he actually plays, as the sister repo settled it.
 *
 *  This is the cyan line at the foot of a Championship Manager profile, and it
 *  is the first thing in this app entitled to that colour. DESIGN §3 retired
 *  "cyan means a person" on 3 Sep and left the slot for "a derived reading —
 *  ours rather than recorded", which is exactly what a role weighted out of four
 *  providers is.
 *
 *  **Null is a real answer and a common one** — 146 of 651. Those are the men
 *  whose position came from FPL's `element_type`, which is a fantasy
 *  classification and not a fact about the footballer, and the exporter nulls
 *  them rather than passing it off. The screen says so rather than guessing. */
export function realPosition(code: number): IntelPlayer | null {
  return intelSquads.get(code) ?? null;
}

/** His completed seasons, most recent first.
 *
 *  Cached on the season-stable `code` rather than the per-season element id,
 *  even though the request needs the id: a career does not change between
 *  rounds, and the key that survives August is the one a cache should hold.
 *  `scouting.ts` keys its game log the same way and for the same reason. */
export function pastSeasons(player: FootballPlayer): Promise<PastSeason[]> {
  return unstable_cache(
    async () => mapPastSeasons(await fetchElementSummary(player.id)),
    ["past-seasons", String(player.code)],
    { revalidate: PAGE_REVALIDATE },
  )();
}
