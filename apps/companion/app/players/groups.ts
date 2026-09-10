import { COLUMNS, type PoolColumn } from "./columns";

// Which columns a reader is looking at, and the plates that choose between them.
//
// **The reference is Opta's stat groups** (Craig, 10 Sep 2026: *"it organises
// the data much better than us"*), whose grid puts `ALL · FPL · ATTACKING ·
// DEFENDING · GOALKEEPING` above six hundred players and lets one tap take
// forty columns down to eight. This board had two dozen and no way to put them
// down at all — twenty today, the four identity columns having since moved in
// beside the player's name.
//
// Split out of `columns.ts` when that file crossed CODE_RULES §4's 200-line
// soft ceiling. The seam is real rather than convenient: everything here is
// about the SET of columns on screen, and everything left there is about what a
// single column holds.

/** Which plate a column appears under.
 *
 *  **Not core's `GroupKey`**, and the difference is the pool's own. Core's four
 *  groups describe what a squad DID — attacking, defensive, appearances,
 *  discipline — and this board carries two kinds of column no other board has: a
 *  man's fantasy return, and what the market has decided about him. It also has
 *  no use for `appearances`, whose one category is minutes. Borrowing a
 *  vocabulary that fits two thirds of the columns would file `Ros` and `Opp`
 *  under a plate reading "Appearances", which is worse than a second list.
 *
 *  This is also why the pool draws its own strip rather than `league/GroupNav`:
 *  that component is typed to core's vocabulary, and it is down to ONE caller
 *  (counted 10 Sep 2026, against a docblock that still claims two). Widening a
 *  shared component's key type to `string` to serve a second caller with a
 *  different list would cost every existing caller its narrowing — so the strip
 *  is spelled twice, which is where CODE_RULES §1 leaves it until a third. */
export type PoolGroup = "scoring" | "attacking" | "defensive" | "discipline" | "market";

/** The plates, in the order a reader looks for them: what he returned, then what
 *  he did going forward, then at the back, then wrong, then what he costs.
 *
 *  **`All` is first and stays the default**, which is what keeps this an
 *  addition rather than a reversal. Craig asked for the whole width on 6 Sep
 *  2026 — *"the landing screen for scout should really be showing as many
 *  columns as possible like Fantrax"* — and the reference agrees: Opta's own
 *  grid opens on `ALL` with the groups beside it. Nothing that was on this board
 *  has left it; the plates are a way to put twenty columns down to four or seven,
 *  which is what a reader can hold in one look. */
export const POOL_GROUPS = [
  { key: "all", label: "All" },
  { key: "scoring", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
  { key: "market", label: "Market" },
] as const;

export type PoolGroupKey = (typeof POOL_GROUPS)[number]["key"];

/** What the URL asked for, narrowed to a plate that exists. An unknown value
 *  falls back to the whole board rather than to an empty one — a shared link
 *  with a typo in it should show a reader the table, not a spine. */
export function groupFor(key: string | undefined): PoolGroupKey {
  return POOL_GROUPS.find((group) => group.key === key)?.key ?? "all";
}

/** The columns one plate shows.
 *
 *  **The spine is always in it**, which is the rule that makes the plates safe:
 *  a column with no `group` — the man's name, his eligibility, his club — is
 *  drawn under every one of them. Opta's grid does the same, and it is the
 *  reason its groups are usable rather than disorienting: whatever you are
 *  looking at, you can still see who you are looking at.
 *
 *  **And so is the column the board is ORDERED by.** That is `desk.ts`'s
 *  `standDown` rule restated for a different mechanism — and since `deskOnly`
 *  was deleted from this board on 10 Sep 2026 with its last user, this is now
 *  the ONLY place the rule holds here. A hidden column is deleted, and
 *  it takes the pressed plate, the sort arrow and `aria-sort` with it: a reader
 *  who sorts by `FPts` and then taps Discipline would get a table in an order
 *  nothing on screen explains, and a screen reader would get one with no
 *  `aria-sort` anywhere in it. The sort is honoured over the plate because the
 *  reader chose it more recently and more deliberately.
 *
 *  `all` returns the list itself rather than a copy of it, because the caller
 *  only ever reads it — and a filter that rebuilds twenty objects on every
 *  render of a six-hundred-row table is a cost paid for nothing. */
export function columnsIn(group: PoolGroupKey, sorted: string): readonly PoolColumn[] {
  if (group === "all") return COLUMNS;
  return COLUMNS.filter(
    (column) =>
      column.group === undefined || column.group === group || column.key === sorted,
  );
}
