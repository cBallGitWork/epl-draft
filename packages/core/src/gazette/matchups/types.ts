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
}

export interface DraftSide {
  teamId: string;
  name: string;
  /** Fantrax's total to the cut-off. */
  total: number | null;
  eleven: DraftMan[];
  /** In the order Fantrax brings them on. */
  bench: DraftMan[];
  /** Whether the manager numbered his bench, or the order is the page's listing. */
  benchNumbered: boolean;
}

export interface DraftMatchupInput {
  home: DraftSide;
  away: DraftSide;
}

/** What the league's scoring pays for a goal and a clean sheet at each slot, read from `getLeagueInfo`. */
export interface SlotWorth {
  goal: Record<string, number>;
  cleanSheet: Record<string, number>;
}

/** Position letter to the fewest and most the eleven may field there. */
export interface PositionLimits {
  min: Record<string, number>;
  max: Record<string, number>;
}
