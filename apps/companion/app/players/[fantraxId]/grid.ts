import {
  KEEPER_ONLY,
  KEEPER_RANKINGS,
  OUTFIELD_ONLY,
  OUTFIELD_RANKINGS,
  attributes,
  clubById,
  mapPastSeasons,
  fetchElementSummary,
  onTheBooks,
  preferredFoot,
  rankings,
  shotLine,
} from "@epl/core";
import type { Attribute, FootballPlayer, IntelPlayer, PastSeason, Ranked, Scouted } from "@epl/core";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { footballNow } from "../../football";
import { intelSetPieces, intelShots, intelSquads, intelTouches } from "../../intel";
import { PAGE_REVALIDATE } from "../../config";

// The Championship Manager half of the player screen: the attribute grid, his rankings, the real
// position under them, and the seasons behind them. Every rating is a percentile, so this needs
// the division in hand; it is the snapshot every other screen keeps warm.

/** The sister's position lines, gathered into the groups a man is rated within. */
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

/** Every man on the books, with the sister's readings attached. Once per request. */
const division = cache(async (): Promise<Scouted[]> => {
  const snapshot = await footballNow();
  const clubs = clubById(snapshot);
  const created = new Map<number, number>();
  for (const shots of intelShots.values()) {
    for (const shot of shots) {
      if (shot.assistCode !== null) created.set(shot.assistCode, (created.get(shot.assistCode) ?? 0) + 1);
    }
  }
  return snapshot.players.filter(onTheBooks).map((player) => {
    const pieces = intelSetPieces.clubs[clubs.get(player.clubId)?.shortName ?? ""];
    const share = (duties: readonly ({ code: number; share: number }[] | undefined)[]) =>
      pieces === undefined
        ? null
        : duties.flatMap((duty) => duty ?? []).reduce((sum, taker) => sum + (taker.code === player.code ? taker.share : 0), 0);
    const touches = intelTouches.get(player.code);
    return {
      player,
      penaltyShare: share([pieces?.penalties]),
      setPieceShare: share([pieces?.freeKicks, pieces?.corners]),
      shots: intelShots.size === 0 ? null : shotLine(intelShots.get(player.code) ?? [], created.get(player.code) ?? 0),
      touches: touches === undefined ? null : touches.fixtures.reduce((sum, fixture) => sum + fixture.p.length / 2, 0),
    };
  });
});

/** Him, and who he is measured against: his group, or the whole division when he has none. */
async function measured(player: FootballPlayer) {
  const everyone = await division();
  const group = groupOf(player.code);
  const man = everyone.find((other) => other.player.code === player.code) ?? {
    player,
    penaltyShare: null,
    setPieceShare: null,
    shots: null,
    touches: null,
  };
  const cohort = group === null ? everyone : everyone.filter((other) => groupOf(other.player.code) === group);
  return { man, cohort, group, keeper: intelSquads.get(player.code)?.line === "GK" };
}

/** His grid, rated within his group; a keeper's rows for a keeper and an outfielder's for the rest. */
export async function playerGrid(player: FootballPlayer): Promise<Attribute[]> {
  const { man, cohort, keeper } = await measured(player);
  const skip = keeper ? OUTFIELD_ONLY : KEEPER_ONLY;
  return attributes(man, cohort).filter((row) => !skip.includes(row.name));
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
