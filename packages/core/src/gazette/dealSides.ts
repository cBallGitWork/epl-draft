import type { Deal, DealSide } from "./types";

// One manager's side of a deal, and what to call it.
//
// **In core because it is pure and it was wrong.** Both functions lived in
// `transfers/Ledger.tsx`, where `vitest.config.ts`'s glob — `packages/*/src`
// and `scripts` — cannot reach them, and both shipped with a bug a test would
// have caught on the first case anybody wrote down. Pure logic in a component
// file is logic nobody can test, and that is the whole reason it moved.

/** Which way a deal ran for the manager whose screen this is.
 *
 *  The same row means opposite things to the two sides of a trade, and a ledger
 *  that says "in" on both is a ledger nobody can read.
 *
 *  **What LEFT is not simply his own outbound rows.** `deals()` files each half
 *  of a trade under the team that GAINED that player, so a two-way swap gives
 *  this manager one inbound row and his partner the other — filtering outbound
 *  to his own id finds nothing and prints a dash where the man he gave up
 *  belongs. A trade's outgoing side is every inbound row belonging to somebody
 *  else.
 *
 *  **`partners` is a list, and that is the three-way fix.** It was
 *  `inbound.find(theirs)`, which names one team on a deal that may have two —
 *  and on a three-way swap the Out column then attributes both other managers'
 *  gains to a single named partner. A caller that can draw only one plate should
 *  take the first itself rather than be handed a truncation as if it were the
 *  whole answer. */
export function movement(deal: Deal, teamId: string) {
  const mine = (side: DealSide) => side.teamId === teamId;
  const theirs = (side: DealSide) => side.teamId !== teamId;

  return {
    in: deal.inbound.filter(mine),
    out: [...deal.outbound.filter(mine), ...deal.inbound.filter(theirs)],
    /** Everyone he dealt WITH, in row order and without repeats. Empty for a
     *  claim off the pool, which is nobody. */
    partners: [...new Set(deal.inbound.filter(theirs).map((side) => side.teamId))].filter(
      (id): id is string => id !== null,
    ),
  };
}

/** What a deal is called, in the words this league says it in (Craig, 2 Sep).
 *
 *  **A claim is three different things and Fantrax files them as one.** Taking a
 *  man another manager dropped is a WAIVER; taking one nobody has ever owned is
 *  a pick-up off the free pool, which this league calls the Bin; and dropping a
 *  man while claiming nobody is the opposite trip, To The Bin.
 *
 *  The rows do not distinguish them and they do not have to: a waiver has both
 *  sides, a bin pick-up has only an arrival, and a bare drop has only a
 *  departure. This docblock used to say "two different things" and name two
 *  states where there are three — which is exactly how a bare drop came to be
 *  reported as a waiver claim that claimed nobody.
 *
 *  Championship Manager names a transaction for what it IS rather than for the
 *  API method behind it, which is the same reason its buttons say `Offer` rather
 *  than `Submit`. */
export function kindOf(deal: Deal, arrived: number, left: number): string {
  if (deal.kind === "trade") return "Trade";
  if (deal.kind === "lineup") return "Lineup";
  if (deal.kind !== "claim") return "Move";

  // Read against the claim branch explicitly rather than as a general "nothing
  // arrived" test: `movement` deliberately files a trade partner's gain under
  // `out`, so a bare `left > 0` means something else there.
  if (arrived === 0 && left > 0) return "To The Bin";
  return left === 0 ? "Bin Pick Up" : "Waiver";
}
