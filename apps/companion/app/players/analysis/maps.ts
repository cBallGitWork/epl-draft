import type { Shot, TouchPlayer } from "@epl/core";

// Which maps this screen can offer, and for whom.
//
// **Built from the data and never from a list of its own.** The export contract
// states it and `docs/ui/analysis.md` recorded it as the reason the control went
// unbuilt for four days: a picker offering a map with nothing behind it is worse
// than a shorter picker. So a kind that neither man has does not appear, and a
// screen where only one kind survives draws no picker at all — one plate to
// choose between is furniture.

/** The kinds, in the order the picker lists them. */
export const MAP_KINDS = ["touches", "shots"] as const;

export type MapKind = (typeof MAP_KINDS)[number];

/** What each is called on its plate, and what the section is headed while it is
 *  chosen. Written out rather than derived: a label is prose, and deriving
 *  "Touches" from `touches` works right up to the kind whose name is not its
 *  label. */
export const MAP_LABEL: Record<MapKind, string> = {
  touches: "Touch map",
  shots: "Shot map",
};

/** What either man has. A kind neither of them has is not offered. */
export function kindsPresent(
  men: readonly { touches: TouchPlayer | undefined; shots: readonly Shot[] }[],
): MapKind[] {
  return MAP_KINDS.filter((kind) =>
    men.some((man) => (kind === "touches" ? man.touches !== undefined : man.shots.length > 0)),
  );
}

/** The kind a URL asked for, narrowed to one this screen can actually draw.
 *
 *  Falls back to the first kind PRESENT rather than to a constant: a link to a
 *  shot map for a defender who has never shot should show him something, and the
 *  something is the map he does have. */
export function chosenKind(asked: string | undefined, present: readonly MapKind[]): MapKind | null {
  if (present.length === 0) return null;
  const found = MAP_KINDS.find((kind) => kind === asked && present.includes(kind));
  return found ?? present[0];
}
