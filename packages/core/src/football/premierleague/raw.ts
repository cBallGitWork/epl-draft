// The Premier League's own football API, mirrored as it actually answers.
//
// Recorded 4 Sep 2026 into `../__fixtures__/plTextstream.json` (Liverpool 2-2
// Nottingham Forest, the richest match in gameweek 2 — a goal, a penalty goal, a
// VAR-cancelled goal, both kinds of card, ten substitutions) and `plFixture.json`
// (the same match's detail). Every optional marker below is a field that is
// genuinely absent on some row of those two files, not a defensive guess.

/** A clock label, or a competition name, or a date — the API wraps most scalars
 *  in an object carrying the string it wants printed.
 *
 *  An event's time carries `secs` beside the label. It is the only orderable
 *  form of the clock: `"90+2"` does not sort, and a wire across ten matches has
 *  to interleave them. */
export interface RawPlLabel {
  label: string;
  secs?: number;
  /** Epoch milliseconds, on a kick-off. The only wall clock in the payload. */
  millis?: number;
}

/** `{secs: 5760, label: "90+6'00"}`. Absent entirely before kick-off, which is
 *  how "has this started" is answered without trusting a status letter. */
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

/** A player as a team sheet names him.
 *
 *  `id` is the Premier League's own id and is the space `RawPlEvent.playerIds`
 *  speaks in; `altIds.opta` is the join to FPL's `opta_code`. Both are needed —
 *  the events give the first and only the second reaches our own data.
 *
 *  `matchShirtNumber` is the number he wore in THIS match, which is the one
 *  Championship Manager's index cell prints. FPL's `squad_number` is a key that
 *  is null on every element, so this is the only source we have for it. */
export interface RawPlSquadPlayer {
  id: number;
  name: RawPlName;
  altIds?: RawPlAltIds;
  matchShirtNumber?: number;
  matchPosition?: string;
  captain?: boolean;
}

/** The shape of a side, as lines of player ids.
 *
 *  `players` is the formation drawn rather than described: `[[20559], [19919,
 *  133104, 5140, 116665], [63633, 33231], [32894, 75382, 119386], [21737]]` is
 *  the 4-2-3-1 in `label`, keeper first. */
export interface RawPlFormation {
  label: string;
  players: number[][];
}

export interface RawPlTeamList {
  teamId: number;
  lineup: RawPlSquadPlayer[];
  substitutes: RawPlSquadPlayer[];
  formation?: RawPlFormation;
}

export interface RawPlOfficial {
  /** `"MAIN"`, `"FOURTH_OFFICIAL"`, `"VAR"`, `"ASSISTANT_VAR"` — and **absent**
   *  on the two running assistants, which is why only MAIN is ever read. */
  role?: string;
  name: RawPlName;
}

/** A goal, as the ROUND-LEVEL fixtures read carries it.
 *
 *  This is the find that shapes the whole live path: one request for the round
 *  answers every goal in all ten matches, with its scorer, its assister and its
 *  minute. The per-fixture commentary stream is then needed only for cards,
 *  substitutions and Opta's prose.
 *
 *  Counted across gameweeks 1-3: the array's length equals the scoreline on
 *  **21 of 21** played fixtures, and the type split (57 `G`, 4 `O`, 3 `P`)
 *  matches the commentary stream's own count exactly. `assistId` is present on
 *  22 of 32 — an unassisted goal, not a gap.
 *
 *  `personId` and `assistId` are Premier League player ids, the same space the
 *  commentary's `playerIds` speaks in. */
export interface RawPlGoal {
  personId: number;
  /** Absent when nobody was credited with the assist. */
  assistId?: number;
  clock?: RawPlClock;
  /** `"G"` a goal, `"O"` an own goal, `"P"` a penalty. */
  type: string;
}

export interface RawPlScore {
  homeScore: number;
  awayScore: number;
}

export interface RawPlGround {
  name: string;
  city: string;
}

/** A fixture, as either the fixture list or the textstream's own header gives it.
 *
 *  `status` is `"U"` upcoming, `"L"` live, `"C"` complete. `phase` is `"1"`,
 *  `"2"` or `"F"`. The two disagree only in the sense that a status letter is
 *  about the fixture and a phase is about the ball. */
export interface RawPlFixture {
  id: number;
  status: string;
  phase?: string;
  teams: RawPlTeamScore[];
  kickoff?: RawPlLabel;
  clock?: RawPlClock;
  halfTimeScore?: RawPlScore;
  ground?: RawPlGround;
  /** Present once the gate figure is published, which is after the match rather
   *  than during it. FPL publishes no attendance at all. */
  attendance?: number;
  matchOfficials?: RawPlOfficial[];
  teamLists?: RawPlTeamList[];
  /** `{opta: "g2645221"}` — the number after the `g` is FPL's `fixture.code`.
   *
   *  **Only sent when the request asks for it.** The round read answers 0 of 10
   *  fixtures with `altIds` unless `altIds=true` is on the query string, and
   *  with it, 10 of 10. Without the parameter there is no join to FPL at all and
   *  the failure is an empty screen rather than an error. */
  altIds?: RawPlAltIds;
  /** Every goal in the match, on the round-level read. See `RawPlGoal`. */
  goals?: RawPlGoal[];
}

/** One line of Opta's commentary.
 *
 *  `time` is absent on the lineup announcement, and `playerIds` on every event
 *  about nobody — added time, a delay, the whistle. Counted across the recorded
 *  match: 99 rows carry both, 7 carry a time and no players, 1 carries neither.
 *
 *  **`playerIds` is positional and its meaning is the event's.** Checked across
 *  every such event of gameweeks 1-3: `goal` is `[scorer, assister?]`,
 *  `own goal` is `[scorer]`, `substitution` is `[on, off]`, a card is
 *  `[booked]`, and an attempt is `[shooter, assister?]`. */
export interface RawPlEvent {
  id: number;
  /** Opta's own vocabulary, lower case and spaced: `"goal"`, `"penalty goal"`,
   *  `"own goal"`, `"yellow card"`, `"red card"`, `"substitution"`,
   *  `"VAR cancelled goal"`, `"end 1"`, `"end 14"`, and fifteen more. */
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
