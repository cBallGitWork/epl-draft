import type { Deal, DealSide } from "./types";

// One manager's side of a deal, and what to call it.

/** Which way a deal ran for `teamId`. `deals()` files a trade's halves under the gainer,
 *  so what he gave up is every inbound row of somebody else's, plus his own outbound. */
export function movement(deal: Deal, teamId: string) {
  const mine = (side: DealSide) => side.teamId === teamId;
  const theirs = (side: DealSide) => side.teamId !== teamId;

  return {
    in: deal.inbound.filter(mine),
    out: [...deal.outbound.filter(mine), ...deal.inbound.filter(theirs)],
    /** Everyone he dealt with, in row order, once each; a three-way deal has two. Empty for a claim. */
    partners: [...new Set(deal.inbound.filter(theirs).map((side) => side.teamId))].filter(
      (id): id is string => id !== null,
    ),
  };
}

/** Whose move a deal is, for the league's list of everyone's: the team that gained, or on a bare drop the one that
 *  let go; a trade's first side, whose partner `movement` names. */
export function moverOf(deal: Deal): string | null {
  const named = (side: DealSide) => side.teamId !== null;
  return deal.inbound.find(named)?.teamId ?? deal.outbound.find(named)?.teamId ?? null;
}

/** What a deal is called in this league's words. Fantrax's one "claim" is three: Waiver (both sides),
 *  Bin Pick Up (only an arrival) and To The Bin (only a departure). */
export function kindOf(deal: Deal, arrived: number, left: number): string {
  if (deal.kind === "trade") return "Trade";
  if (deal.kind === "lineup") return "Lineup";
  if (deal.kind !== "claim") return "Move";

  // Only for a claim: on a trade, `movement` files a partner's gain under `out`.
  if (arrived === 0 && left > 0) return "To The Bin";
  return left === 0 ? "Bin Pick Up" : "Waiver";
}
