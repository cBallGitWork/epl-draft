// One draft match-up as the desk sees it at a cut-off: after Saturday's games, or at the end of the week. League facts
// (points, minutes, slots, bench order) from Fantrax; how many matches a man has had and has left from the football
// layer, joined by the script. Pure data: no clock, no network.

export interface DraftMan {
  fantraxId: string;
  name: string;
  /** His club's name as the paper prints it. */
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
  /** His first time in this side's eleven this season. */
  debut: boolean;
  /** Projected points for what he has left; orders who is named first and is never printed. Null when there is none. */
  projected: number | null;
  /** Who his club plays next in the round, in words ("away to Everton"); null when nothing is left. */
  next: string | null;
  /** His club's Premier League matches this round, by FPL code, with "Sunderland v Man City" to name each. */
  matches: { code: number; label: string }[];
  /** Fitness news dated after his last match, in the league's words; null when there is none. */
  fitness: string | null;
  /** His returns to the cut-off, from Fantrax's own counts: a clean sheet counts only where his slot is paid for one. */
  goals: number;
  assists: number;
  cleanSheets: number;
  /** When he scored, and when his club first conceded in a match he played; empty when he did neither. */
  scoredAt: GoalTime[];
  concededFirstAt: GoalTime[];
}

/** A goal's minute, and the added time on the clock when there was some. */
export interface GoalTime {
  minute: number;
  added?: number;
}

export interface DraftSide {
  teamId: string;
  name: string;
  /** Fantrax's total to the cut-off. */
  total: number | null;
  eleven: DraftMan[];
  /** Every reserve, those in `subOrder` first and in its order. */
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
  /** A return in the game's own sense (Craig, 29 Sep 2026): a DefCon bonus or saves are points, never a return. */
  kind: "goal" | "assist" | "clean sheet";
  worth: number;
}

/** What the league pays at each slot for a return, read from `getLeagueInfo`, and for a full match's minutes, from what
 *  Fantrax paid this round. Only the returns a man in that slot makes: a keeper's is a clean sheet. */
export interface SlotWorth {
  returns: Record<string, Worth[]>;
  /** What a full match pays for the minutes alone; 0 when nobody has played one. */
  appearance: number;
  /** The most a match pays at a slot beyond its returns and minutes (a defensive bonus, a keeper's saves), as Fantrax
   *  paid it this round: counted only before a lead is called out of reach. */
  extra: Record<string, number>;
}

/** Position letter to the fewest and most the eleven may field there. */
export interface PositionLimits {
  min: Record<string, number>;
  max: Record<string, number>;
}
