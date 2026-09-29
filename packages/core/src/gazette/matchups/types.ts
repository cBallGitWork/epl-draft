// One draft match-up as the desk sees it at a cut-off: after Saturday's games, or at the end of the week. League facts
// (points, minutes, slots, bench order) from Fantrax; how many matches a man has had and has left from the football
// layer, joined by the script. Pure data: no clock, no network.

export interface DraftMan {
  fantraxId: string;
  name: string;
  /** His club's short name. */
  club: string;
  /** The slot Fantrax scores him at: his roster slot in the eleven, his own position on the bench. */
  slot: string;
  /** Fantrax points to the cut-off; null when he has no football behind him yet. Bench points count for nobody. */
  points: number | null;
  /** Minutes to the cut-off, from Fantrax's own minutes category. */
  minutes: number;
  /** His club's matches in the period kicked off by the cut-off, and still to come. */
  played: number;
  left: number;
  /** His first start for this side this season. */
  debut: boolean;
  /** Projected points for what he has left; orders who is named first and is never printed. Null when there is none. */
  projected: number | null;
  /** Who his club plays next in the period, in words ("Everton (A), a soft defence"); null when nothing is left. */
  next: string | null;
  /** Fitness news dated after his last match, in the league's words; null when there is none. */
  fitness: string | null;
}

export interface DraftSide {
  teamId: string;
  name: string;
  /** Fantrax's total to the cut-off. */
  total: number | null;
  eleven: DraftMan[];
  /** Every reserve, numbered ones first in their order. */
  bench: DraftMan[];
  /** The reserves Fantrax may bring on, by fantraxId in order: the manager's numbers, or the deadline's by points. */
  subOrder: string[];
}

export interface DraftMatchupInput {
  home: DraftSide;
  away: DraftSide;
}

/** A return a man can still make in a match, and what the league pays for it at his slot. */
export interface Worth {
  kind: "goal" | "assist" | "clean sheet" | "defensive bonus" | "saves";
  worth: number;
}

/** What the league pays at each slot, read from `getLeagueInfo`, or for a tiered rule it does not spell out, from what
 *  Fantrax paid this round. Only the returns a man in that slot realistically makes: a keeper's goal is left out. */
export interface SlotWorth {
  returns: Record<string, Worth[]>;
  /** What a full match pays for the minutes alone; 0 when nobody has played one. */
  appearance: number;
}

/** Position letter to the fewest and most the eleven may field there. */
export interface PositionLimits {
  min: Record<string, number>;
  max: Record<string, number>;
}
