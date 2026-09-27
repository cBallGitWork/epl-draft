// The league's two cups, one in each half of the season. Ours, not Fantrax's: it runs no cups.
// What Craig has not settled is left out rather than guessed; PLATFORM_NOTES lists it.

export interface GroupStage {
  groups: number;
  /** How many from each group reach the knockout; `seededBracket` gives the top of each a bye. */
  qualify: number;
  /** A cup rule, so ours: what a group win and draw are worth. */
  points: { won: number; drawn: number };
}

export interface Cup {
  id: string;
  name: string;
  half: 1 | 2;
  /** Null for a straight knockout. */
  groupStage: GroupStage | null;
}

export const CUPS: readonly Cup[] = [
  { id: "cup-1", name: "Cup 1", half: 1, groupStage: null },
  {
    id: "cup-2",
    name: "Cup 2",
    half: 2,
    groupStage: { groups: 2, qualify: 3, points: { won: 3, drawn: 1 } },
  },
];
