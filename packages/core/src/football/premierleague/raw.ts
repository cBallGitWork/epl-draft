// The Premier League's own football API, typed as it answers: every optional field is absent on some recorded row.

/** A scalar wrapped with the string to print. `secs` is elapsed time in its own fixture and orders one match;
 *  only `kickoff.millis + secs × 1000` interleaves a gameweek, and `"90+2"` sorts as neither. */
export interface RawPlLabel {
  label: string;
  secs?: number;
  /** Epoch ms, on a kick-off: the only wall clock in the payload. */
  millis?: number;
}

/** `{secs: 5760, label: "90+6'00"}`. Absent before kick-off, which answers "has this started" without a status letter. */
export interface RawPlClock {
  secs: number;
  label: string;
}

export interface RawPlAltIds {
  /** `"p531442"` for a player, `"t14"` for a club, `"g2645221"` for a fixture. */
  opta: string;
}

export interface RawPlClub {
  name: string;
  shortName: string;
  abbr: string;
  id: number;
}

export interface RawPlTeam {
  name: string;
  shortName: string;
  club: RawPlClub;
  id: number;
  altIds?: RawPlAltIds;
}

/** One side of a fixture. `score` is null until the match starts. */
export interface RawPlTeamScore {
  team: RawPlTeam;
  score: number | null;
}

export interface RawPlName {
  display: string;
  first?: string;
  last?: string;
}

/** A player on a team sheet. `id` is the space of `RawPlEvent.playerIds`; `altIds.opta` joins FPL's `opta_code`.
 *  `matchShirtNumber` is his number in THIS match and our only source for it: FPL's `squad_number` is always null. */
export interface RawPlSquadPlayer {
  id: number;
  name: RawPlName;
  altIds?: RawPlAltIds;
  matchShirtNumber?: number;
  matchPosition?: string;
  captain?: boolean;
}

/** A side's shape: `players` is the `label` formation drawn as lines of player ids, keeper first. */
export interface RawPlFormation {
  label: string;
  players: number[][];
}

interface RawPlTeamList {
  teamId: number;
  lineup: RawPlSquadPlayer[];
  substitutes: RawPlSquadPlayer[];
  formation?: RawPlFormation;
}

export interface RawPlOfficial {
  /** `"MAIN"`, `"FOURTH_OFFICIAL"`, `"VAR"`, `"ASSISTANT_VAR"`; absent on the two assistants, so only MAIN is read. */
  role?: string;
  name: RawPlName;
}

/** A goal on the gameweek's fixtures read, which answers every goal of all ten matches in one request.
 *  `personId` and `assistId` are Premier League player ids, the space of the commentary's `playerIds`. */
interface RawPlGoal {
  personId: number;
  /** Absent when nobody was credited with the assist. */
  assistId?: number;
  clock?: RawPlClock;
  /** Which half, `"1"` or `"2"`. Trust it over the clock: a goal at 45+3 is past 2,700 seconds and still first-half. */
  phase?: string;
  /** `"G"` a goal, `"O"` an own goal, `"P"` a penalty. */
  type: string;
}

/** One row of the fixture DETAIL read's `events`, the only place a substitution's or booking's minute is data.
 *  Present on every completed fixture and absent on every upcoming one. Goals are `G`, `O` and `P`: reading only
 *  `G` drops a fifth of them. */
export interface RawPlFixtureEvent {
  /** Absent on `PS` and `PE`: a period boundary is nobody's event. */
  id?: number;
  /** `G` goal · `O` own goal · `P` penalty · `MP` missed penalty · `B` booking ·
   *  `S` substitution · `PS` period start · `PE` period end. */
  type: string;
  /** `Y`/`R` on a booking, `ON`/`OFF` on a substitution, and the type's own
   *  letter on the rest. Absent on `PS` and `PE`. */
  description?: string;
  /** Absent on period marks and on a bench or staff card, so a card may belong to a side and not a player. */
  personId?: number;
  /** The side the event belongs to. Present on everything but `PS`/`PE`. */
  teamId?: number;
  /** Only on a goal, and absent when it was unassisted. */
  assistId?: number;
  clock?: RawPlClock;
  /** `"1"` or `"2"`: which half. */
  phase?: string;
}

export interface RawPlScore {
  homeScore: number;
  awayScore: number;
}

export interface RawPlGround {
  name: string;
  city: string;
}

/** A fixture, from the fixture list or the textstream's header. `status`: `U` upcoming, `L` live, `C` complete.
 *  `phase`: `0` upcoming, `1`/`2` the halves, `H` the interval, `F` full time; nothing reads it. */
export interface RawPlFixture {
  id: number;
  status: string;
  phase?: string;
  teams: RawPlTeamScore[];
  kickoff?: RawPlLabel;
  clock?: RawPlClock;
  /** Absent on the gameweek read: only the DETAIL read publishes it. */
  halfTimeScore?: RawPlScore;
  ground?: RawPlGround;
  /** Present once the gate is published, after the match. FPL publishes none. */
  attendance?: number;
  matchOfficials?: RawPlOfficial[];
  /** Always two entries, each null until that side is named: test `teamLists[i] !== null`, never index straight in. */
  teamLists?: (RawPlTeamList | null)[];
  /** `{opta: "g2645221"}`; the number after the `g` is FPL's `fixture.code`.
   *  Sent only with `altIds=true` on the query string: without it there is no join to FPL. */
  altIds?: RawPlAltIds;
  /** Every goal in the match, on the gameweek read. */
  goals?: RawPlGoal[];
  /** Every goal, card, substitution and period mark, on the DETAIL read only. */
  events?: RawPlFixtureEvent[];
}

/** One line of Opta's commentary. `time` is absent on the lineup announcement, `playerIds` on events about nobody.
 *  `playerIds` is positional: `goal` `[scorer, assister?]`, `own goal` `[scorer]`, `substitution` `[on, off]`,
 *  a card `[booked]`, an attempt `[shooter, assister?]`. */
export interface RawPlEvent {
  id: number;
  /** Opta's lower-case vocabulary: `"goal"`, `"penalty goal"`, `"own goal"`, `"yellow card"`, `"red card"`,
   *  `"substitution"`, `"VAR cancelled goal"`, `"end 1"`, `"end 14"` and more. */
  type: string;
  text: string;
  time?: RawPlLabel;
  playerIds?: number[];
}

export interface RawPlPage {
  numPages: number;
  numEntries: number;
}

export interface RawPlTextstream {
  fixture: RawPlFixture;
  events: {
    pageInfo: RawPlPage;
    content: RawPlEvent[];
  };
}

export interface RawPlFixturePage {
  pageInfo: RawPlPage;
  content: RawPlFixture[];
}

/** `/teams/{id}/compseasons/{cs}/staff`: the manager is the official with `role: "Manager"`, undated. */
export interface RawPlStaff {
  officials?: { role?: string; active?: boolean; name?: { display?: string } }[];
}
