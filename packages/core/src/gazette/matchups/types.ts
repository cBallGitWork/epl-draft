// One draft match-up as the desk sees it at a cut-off: after Saturday's games, or at the end of the week. League facts
// (points, minutes, slots, bench order) from Fantrax; how many matches a man has had and has left from the football
// layer, joined by the script. Pure data: no clock, no network.

export interface DraftMan {
  fantraxId: string;
  /** FPL's season-stable codes for him and his club, for his photograph and his club's colours; never persisted ids. */
  code: number;
  clubCode: number;
  /** FPL's club id this season, for the article's cover picture; never persisted beyond the story's face. */
  clubId: number;
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
  /** He came to this side for this gameweek: signed in a claim, or in a trade; null when he was already there. */
  arrived: "claim" | "trade" | null;
  /** Projected points for what he has left; orders who is named first and is never printed. Null when there is none. */
  projected: number | null;
  /** His club's next match in the gameweek; null when nothing is left. */
  next: NextMatch | null;
  /** Whether he started his match, from the team sheet; null when there is no sheet or he did not play. */
  started: boolean | null;
  /** His club's Premier League matches this gameweek, by FPL code, with "Sunderland v Man City" to name each. */
  matches: { code: number; label: string }[];
  /** Fantrax's first story on him after his last match, read only for a man who did not play it or went off before the
   *  hour; null when there is none. */
  fitness: string | null;
  /** His returns to the cut-off, from Fantrax's own counts: a clean sheet counts only where his slot is paid for one. */
  goals: number;
  assists: number;
  cleanSheets: number;
  /** When he scored, and when his club first conceded in a match he played; empty when he did neither. */
  scoredAt: GoalTime[];
  concededFirstAt: GoalTime[];
}

/** A man's next match: whom, where, and its kickoff, from which the brief and the page say the day. */
export interface NextMatch {
  opponent: string;
  home: boolean;
  kickoff: string;
}

/** A goal's minute, the added time on the clock when there was some, and its match's kickoff, which orders goals from
 *  different matches. */
export interface GoalTime {
  minute: number;
  added?: number;
  kickoff: string;
}

/** A side's Fantrax points on one London day of the gameweek, `2026-09-26`. */
export interface DayPoints {
  day: string;
  points: number;
}

export interface DraftSide {
  teamId: string;
  name: string;
  /** Fantrax's total to the cut-off. */
  total: number | null;
  /** The same points by London day, in order: the running score. */
  byDay: DayPoints[];
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
 *  Fantrax paid this gameweek. Only the returns a man in that slot makes: a keeper's is a clean sheet. */
export interface SlotWorth {
  returns: Record<string, Worth[]>;
  /** What a full match pays for the minutes alone; 0 when nobody has played one. */
  appearance: number;
  /** The league's goalie slot, whose big score is a haul in goal; null when the league does not say. */
  keeper: string | null;
  /** The most a match pays at a slot beyond its returns and minutes (a defensive bonus, a keeper's saves), as Fantrax
   *  paid it this gameweek: counted only before a lead is called out of reach. */
  bonus: Record<string, number>;
}

/** Position letter to the fewest and most the eleven may field there. */
export interface PositionLimits {
  min: Record<string, number>;
  max: Record<string, number>;
}
