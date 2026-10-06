// What the sister repo hands over: untrusted provider data, keyed on FPL's season-stable `code`, never the id.

/** Where a file came from and when. Each source's `mtime` beside `exportedAt` is what catches a stalled pipeline. */
export interface IntelManifest {
  season: string;
  /** The gameweek an XI predicts. Null on a file that is not per-gameweek. */
  gameweek: number | null;
  exportedAt: string;
  rows: number;
  sources: { path: string; mtime: string | null }[];
  /** How many squad numbers the exporter says it cleared as collisions; duplicates survive (see `squadNumber`). */
  numberCollisions?: number;
}

/** One man on a club's books, as the sister repo files him. */
export interface IntelPlayer {
  /** FPL's season-stable player code. */
  code: number;
  /** FPL's three-letter club label, e.g. "ARS". */
  clubCode: string;
  /** His real-life position — `CB`, `LB`, `DM`, `RW`. Often null: one that came from FPL's `element_type` is
   *  sent as null, since that is a fantasy classification and not a fact about the footballer. */
  position: string | null;
  /** Which provider settled the position, carried when it is null so a screen can say why there is none. */
  positionSource: string | null;
  secondaryPositions: string[];
  canCover: string[];
  /** The sister's depth chart in his club and position: 1 first choice to 4 fringe, and 0 unavailable (a loan
   *  out of the league or an expired contract, not a knock). */
  depthTier: number | null;
  /** His shirt number, or null, and not his alone: squads carry duplicates. Safe beside a name;
   *  drop a collided number from both men before it has to identify somebody on its own. */
  squadNumber: number | null;
  status: string;
  expectedReturnGw: number | null;
  /** His position as a pitch line — `GK` `CB` `FB` `DM` `CM` `AM` `WF` `CF` — in the sister repo's own
   *  bucketing, never a copy of ours. Null exactly where `position` is. */
  line: string | null;
}

export interface IntelSquads {
  manifest: IntelManifest;
  players: IntelPlayer[];
}

/** One man in a predicted eleven. */
export interface IntelStarter {
  code: number;
  /** How sure the source is, 0–1, so a board can show the doubt rather than print a team sheet. */
  prob: number;
}

/** One club's predicted eleven and the shape it is predicted to play. */
export interface IntelClubXi {
  /** `4-2-3-1`, `3-4-3`, `3-4-2-1`, `4-3-3`. */
  formation: string;
  /** How many men Scout draws in each pitch row (`"1"` is the keeper); `xiFault` checks they sum to eleven. */
  slots: Record<string, number> | null;
  starters: IntelStarter[];
}

export interface IntelXi {
  manifest: IntelManifest;
  /** When `scout-xi` first saw this prediction, within one two-hour run of Scout changing it; the page has no time. */
  fetchedAt: string | null;
  source: string | null;
  /** By FPL club short name — `ARS` — which is Scout's own club code upper-cased. */
  clubs: Record<string, IntelClubXi>;
}

/** One man's share of a club's set pieces — 0.53 of its penalties, not "first choice". */
export interface IntelTaker {
  code: number;
  share: number;
}

/** Who takes a club's set pieces, off FFScout's per-club page: a signing arrives with no history at his new club.
 *  A piece nobody takes is absent rather than empty. */
export interface IntelClubPieces {
  penalties?: IntelTaker[];
  freeKicks?: IntelTaker[];
  corners?: IntelTaker[];
}

export interface IntelSetPieces {
  manifest: IntelManifest;
  source: string | null;
  /** By FPL's three-letter club label, `ARS`. */
  clubs: Record<string, IntelClubPieces>;
}

/** One player's line in a logged match: the minutes, line-up and position FPL's scoresheet lacks, and nothing it has. */
export interface IntelMatchPlayer {
  code: number;
  side: "home" | "away";
  started: boolean;
  /** His real position in this match — `DC`, `AMC`, `FWL`. Null for a man who did not start: `SUB` is no position. */
  position: string | null;
  minutes: number | null;
  /** The minutes he came on and went off. Null both for the whole match and for never on; `minutes` tells them apart. */
  onAt: number | null;
  offAt: number | null;
  /** SofaScore's out of ten. Theirs and labelled as theirs. */
  rating: number | null;
}

/** A goal or a card with its minute, which FPL publishes nowhere. An own goal arrives as a plain `goal`: check
 *  FPL's fixture `own_goals`, or it is credited to the wrong side. */
export interface IntelMatchEvent {
  kind: "goal" | "card";
  code: number;
  minute: number;
}

/** One side's shape and match figures; null where the source took no measurement, never nought. */
export interface IntelMatchSide {
  formation: string | null;
  stats: Record<string, number | null>;
}

export interface IntelMatch {
  /** FPL's per-season fixture id, the one id this export keys on: a fixture belongs to one season, so it is safe. */
  fplFixtureId: number;
  matchId: string;
  halfTime: { home: number | null; away: number | null };
  /** Usually null, which prints a dash. */
  referee: string | null;
  home: IntelMatchSide;
  away: IntelMatchSide;
  players: IntelMatchPlayer[];
  events: IntelMatchEvent[];
}

export interface IntelMatches {
  manifest: IntelManifest;
  fixtures: IntelMatch[];
}
