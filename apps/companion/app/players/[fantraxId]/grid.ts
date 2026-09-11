import {
  KEEPER_ONLY,
  OUTFIELD_ONLY,
  attributes,
  mapPastSeasons,
  fetchElementSummary,
  onTheBooks,
} from "@epl/core";
import type { Attribute, FootballPlayer, IntelPlayer, PastSeason, Scouted } from "@epl/core";
import { unstable_cache } from "next/cache";
import { PAGE_REVALIDATE } from "@epl/core";
import { footballNow } from "../../football";
import { intelSetPieces, intelSquads } from "../../intel";

// The Championship Manager half of the player screen: the attribute grid, the
// real position under it, and the seasons behind it.
//
// The grid is the one read on this page that needs the WHOLE league in hand.
// Every rating is a percentile, so a man cannot be rated without the population
// he is being rated against — `attributes.ts` says why that is the only honest
// way to turn a per-ninety rate into a 1-20. It costs nothing extra: the
// snapshot is the read every other screen already keeps warm.

/** His grid, rated against everyone in the division who has played.
 *
 *  The set-piece shares come from the sister repo rather than FPL. FPL publishes
 *  an ORDER — first penalty taker, second — and the sister publishes a SHARE of
 *  the ones actually taken, which is the better reading of the same duty and the
 *  one already on disk for `/prem/club/[code]/set-pieces`. */
export async function playerGrid(player: FootballPlayer): Promise<Attribute[]> {
  const snapshot = await footballNow();
  const shares = setPieceShares();
  const scouted = (man: FootballPlayer): Scouted => ({
    player: man,
    setPieceShare: shares.get(man.code) ?? null,
  });
  // **Rated against EVERYONE, then filtered.** The percentile still runs over
  // the whole division — a keeper's Handling means "better than most players",
  // which is the only reading a percentile has — and what the position decides
  // is which rows are worth printing, never what they are measured against.
  //
  // "The division" is the site rule's reading of it: the 104 who have left carry
  // a frozen season, most of it nought, and rating a man against them is what
  // makes an ordinary one look good.
  const division = snapshot.players.filter(onTheBooks).map(scouted);
  return keeperGrid(player.code)
    ? attributes(scouted(player), division).filter((row) => !OUTFIELD_ONLY.includes(row.name))
    : attributes(scouted(player), division).filter((row) => !KEEPER_ONLY.includes(row.name));
}

/** Whether to draw him a keeper's grid.
 *
 *  **The sister repo's real position, never FPL's `element_type`.** That one is
 *  a fantasy classification and the football layer refuses it by rule, which is
 *  also why this decision cannot live in `attributes.ts` — core has no position
 *  to ask. `line` is the export's own bucketing.
 *
 *  A man with no settled position — 146 of 651, all of them the ones whose
 *  position came from FPL's letter — gets the outfielder's grid. It is the
 *  commoner answer by twelve to one, and the two rows he loses by it are the two
 *  an outfielder is bottom of anyway. */
function keeperGrid(code: number): boolean {
  return intelSquads.get(code)?.line === "GK";
}

/** Every man's share of his club's set pieces, added across the three duties.
 *
 *  Null and nought are different answers and this returns neither for a man the
 *  file does not mention: `attributes` reads a missing key as "we were not told"
 *  and leaves the row blank, where a nought would say "takes none". A club with
 *  no entry at all leaves all eleven of them blank, which is correct — the
 *  export covers the clubs it covers. */
function setPieceShares(): Map<number, number> {
  const shares = new Map<number, number>();
  for (const club of Object.values(intelSetPieces.clubs)) {
    for (const duty of [club.penalties, club.freeKicks, club.corners]) {
      for (const taker of duty ?? []) {
        shares.set(taker.code, (shares.get(taker.code) ?? 0) + taker.share);
      }
    }
  }
  return shares;
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
