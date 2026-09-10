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
 *  An event's time carries `secs` beside the label, and a kick-off carries
 *  `millis`. **They order different things and are not interchangeable.**
 *  `secs` is elapsed time in ITS OWN fixture, so it orders one match; `millis`
 *  is the only wall clock in the payload, and `kickoff.millis + secs × 1000` is
 *  what interleaves a round. `"90+2"` sorts as neither.
 *
 *  This block used to call `secs` "the only orderable form of the clock… a wire
 *  across ten matches has to interleave them", which is precisely the thing it
 *  cannot do: two matches kicking off at different times both start at nought. */
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
  /** Which half it was scored in — `"1"` or `"2"`. The feed's own answer, and
   *  better than reading the clock: a goal at 45+3 is 2,824 seconds, past the
   *  nominal forty-five, and is still a first-half goal. Counted 5 Sep 2026 on
   *  GW3, present on every goal in the round. */
  phase?: string;
  /** `"G"` a goal, `"O"` an own goal, `"P"` a penalty. */
  type: string;
}

/** One event as the fixture DETAIL read publishes it — not the textstream's.
 *
 *  **A second, compact events feed that nothing in this repo knew about.** The
 *  detail read carries its own `events` array beside the team sheets, and it is
 *  the only place a substitution's minute and a booking's minute are published
 *  as DATA rather than inside Opta's prose. `docs/providers/premier-league-api.md`
 *  did not mention it and this type did not exist; both were counted and written
 *  on 10 Sep 2026.
 *
 *  Counted across the 30 completed fixtures of gameweeks 1-3, 862 rows:
 *  `S` 538 (269 `ON` and 269 `OFF`, paired exactly), `B` 118, `G` 76, `PS` 60,
 *  `PE` 60, `O` 5, `P` 4, `MP` 1. Present and non-empty on **30/30** completed
 *  fixtures and absent on all 10 upcoming ones, which makes it an exact tell for
 *  "has this been played" rather than a clock to interpret.
 *
 *  **The goal types are three, not one**, which is the trap that loses a fifth of
 *  a season's goals: `G` a goal, `O` an own goal, `P` a penalty. 76 + 5 + 4 = 85,
 *  and the sister repo's independent shot export counts exactly 85 goals over the
 *  same 30 fixtures. A reader taking only `G` silently drops nine.
 *
 *  **`MP` is a missed penalty** and carries a man — one row, Brentford v
 *  Tottenham, 55'. It is a real type and not a stray.
 *
 *  `description` is the discriminator and repeats the type for everything except
 *  the two that matter: `B` is `Y` on 117 and `R` on **1**, and `S` is `ON` or
 *  `OFF`. */
export interface RawPlFixtureEvent {
  /** Absent on `PS` and `PE` — a period boundary is nobody's event. */
  id?: number;
  /** `G` goal · `O` own goal · `P` penalty · `MP` missed penalty · `B` booking ·
   *  `S` substitution · `PS` period start · `PE` period end. */
  type: string;
  /** `Y`/`R` on a booking, `ON`/`OFF` on a substitution, and the type's own
   *  letter on the rest. Absent on `PS` and `PE`. */
  description?: string;
  /** **Absent on a card shown to nobody**, as well as on both period marks.
   *  Counted: 121 rows of 862 carry no `personId`, and 120 of those are the
   *  period boundaries — the 121st is a real booking with a `teamId` and no man,
   *  Newcastle v Bournemouth at 71', which is a bench or staff card. So a reader
   *  must tolerate a card that belongs to a side rather than to a player. */
  personId?: number;
  /** The side the event belongs to. Present on everything but `PS`/`PE`. */
  teamId?: number;
  /** Only on a goal, and a real absence rather than a gap: 56 of the 76 `G`
   *  rows carry one. */
  assistId?: number;
  clock?: RawPlClock;
  /** `"1"` or `"2"` — which half. */
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

/** A fixture, as either the fixture list or the textstream's own header gives it.
 *
 *  `status` is `"U"` upcoming, `"L"` live, `"C"` complete — 10/10 on GW3, counted
 *  5 Sep 2026. `phase` is `"0"` upcoming, `"1"` first half and `"F"` full time in
 *  that same count (2, 1 and 7 of the ten), with `"2"` the second half and `"H"`
 *  the interval — that last one seen live at 17:26Z the same evening, after the
 *  count found no fixture at half time.
 *
 *  **`phase` has no reader in the tree.** `breaks.ts` keys its one rule off
 *  `status === "C"`, which became the whole of it when half time left the wire.
 *  The letters are recorded here as provider shape, so that the next thing
 *  wanting "which half is it" knows they exist and knows nothing depends on
 *  them. The two disagree only in
 *  the sense that a status letter is about the fixture and a phase is about the
 *  ball. */
export interface RawPlFixture {
  id: number;
  status: string;
  phase?: string;
  teams: RawPlTeamScore[];
  kickoff?: RawPlLabel;
  clock?: RawPlClock;
  /** **Absent on this read.** 0 of 10 on GW3, counted 5 Sep 2026, the seven
   *  completed fixtures included — it is published on the DETAIL read and not on
   *  the round one. Kept in the type because the two share it; a caller wanting
   *  the interval score off the round read must derive it or ask for the
   *  fixture. */
  halfTimeScore?: RawPlScore;
  ground?: RawPlGround;
  /** Present once the gate figure is published, which is after the match rather
   *  than during it. FPL publishes no attendance at all. */
  attendance?: number;
  matchOfficials?: RawPlOfficial[];
  /** **Always two entries, and the ENTRIES are null until the sheets are
   *  published** — which is not the same shape as an absent array and is the
   *  reason this is typed the way it is. Counted 5 Sep 2026 across the 30
   *  fixtures of GW1-3 plus GW4: `teamLists` present 30/30, and 4 null entries
   *  among the 60 sides, all four being the two GW3 fixtures nobody had named a
   *  side for. Every GW4 fixture, a week out, answers `[null, null]`.
   *
   *  So "has this fixture been named" is `teamLists[i] !== null`, which is an
   *  exact tell and not a clock — and a mapper that indexes straight into an
   *  entry throws on every unstarted match. */
  teamLists?: (RawPlTeamList | null)[];
  /** `{opta: "g2645221"}` — the number after the `g` is FPL's `fixture.code`.
   *
   *  **Only sent when the request asks for it.** The round read answers 0 of 10
   *  fixtures with `altIds` unless `altIds=true` is on the query string, and
   *  with it, 10 of 10. Without the parameter there is no join to FPL at all and
   *  the failure is an empty screen rather than an error. */
  altIds?: RawPlAltIds;
  /** Every goal in the match, on the round-level read. See `RawPlGoal`. */
  goals?: RawPlGoal[];
  /** Every goal, card, substitution and period mark, on the DETAIL read only.
   *  Absent from the round read. See `RawPlFixtureEvent`. */
  events?: RawPlFixtureEvent[];
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
