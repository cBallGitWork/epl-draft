/** One side's totals over every leg of a knockout tie (its starting eleven, assumed). Null is unread. */
export interface TieTotals {
  points: number | null;
  goals: number | null;
  assists: number | null;
  cleanSheets: number | null;
  minutes: number | null;
}

/** Craig's order, 27 Sep: points, then goals, assists, clean sheets, minutes played in the tie. */
const DECIDERS = ["points", "goals", "assists", "cleanSheets", "minutes"] as const;

/** Who goes through, "coin toss" when every decider is equal (Craig tosses it), or null when the
 *  one that would decide it has not been read. */
export function knockoutWinner(home: TieTotals, away: TieTotals): "home" | "away" | "coin toss" | null {
  for (const decider of DECIDERS) {
    const ours = home[decider];
    const theirs = away[decider];
    if (ours === null || theirs === null) return null;
    if (ours !== theirs) return ours > theirs ? "home" : "away";
  }
  return "coin toss";
}
