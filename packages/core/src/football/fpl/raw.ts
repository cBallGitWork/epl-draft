// The shapes FPL's public API actually returns, as verified against the live
// endpoints. Everything is marked optional-ish in spirit: this is scraped data we
// do not control, so `map.ts` must render gracefully when a field goes missing.

interface RawTeam {
  id: number;
  code: number;
  name: string;
  short_name: string;
}

interface RawElement {
  id: number;
  code: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  /** Present on every element and null on every element — 622 of 622, checked
   *  29 Aug 2026. Mirrored here because `raw.ts` mirrors what FPL actually
   *  sends; deliberately NOT carried into the domain, because a field that is
   *  always absent is not a field, and one modelled as `number | null` invites
   *  a reader to write the branch that handles the number. Two of them did. */
  squad_number: number | null;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  opta_code: string | null;

  // Season totals. Present on all 629 elements, probed 2 Sep 2026 — every one
  // of them, not most, which is why these are plain rather than optional.
  //
  // The expected figures arrive as STRINGS ("0.53"), unlike the counts, because
  // FPL serialises its decimals that way. Mirrored as strings here for the same
  // reason `squad_number` is mirrored at all: `raw.ts` says what FPL sends, and
  // the mapper is where it becomes a number.
  minutes: number;
  starts: number;
  /** The three the competition itself counts. Present and non-null on all 651
   *  elements, probed 2 Sep 2026 — the same denominator as the rest of this
   *  block, which is why they are plain rather than optional. */
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  expected_goals: string;
  expected_assists: string;
  expected_goals_conceded: string;
  tackles: number;
  clearances_blocks_interceptions: number;
  recoveries: number;
  saves: number;
  goals_conceded: number;
  bonus: number;
  bps: number;
}

interface RawEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  /** FPL's own sign-off on the round: bonus added, stats reconciled, nothing
   *  further expected to move. It lands a day or two after the last whistle and
   *  is the only thing in the payload entitled to the word "final". */
  data_checked: boolean;
  is_current: boolean;
  is_next: boolean;
  is_previous: boolean;
}

export interface RawBootstrap {
  teams: RawTeam[];
  elements: RawElement[];
  events: RawEvent[];
}

export interface RawFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  minutes: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  /** FPL's own 1–5 fixture difficulty, from each side's point of view. Their
   *  rating, not a computation of ours — which is the only reason we are willing
   *  to print it. */
  team_h_difficulty?: number;
  team_a_difficulty?: number;
}

/** One scoring identifier's value in one fixture, from the live endpoint's
 *  `explain` block. This is the only per-fixture breakdown FPL gives, which is why
 *  we prefer it over the aggregate `stats` on double gameweeks. */
interface RawExplainStat {
  identifier: string;
  points: number;
  value: number;
}

export interface RawLiveElement {
  id: number;
  stats: Record<string, number | string>;
  explain: { fixture: number; stats: RawExplainStat[] }[];
}

export interface RawLive {
  elements: RawLiveElement[];
}

/** One match in a player's own season history, from `element-summary`.
 *
 *  Unlike the live endpoint's `explain` block, these values are genuinely
 *  per-fixture — bps, expected goals and defensive contribution included. That
 *  is the whole reason this endpoint is read: `mapLiveStats` can only take those
 *  four off the gameweek aggregate, so on a double it reports the round twice.
 *
 *  FPL writes a row here for a match nobody has played yet, exactly as its live
 *  endpoint does — on 29 Aug 2026 every player carried a GW2 row with zero
 *  minutes, two days before kickoff. `team_h_score` is null on those, and it is
 *  the only field separating them from an unused substitute in a match that
 *  finished 3-0, whose row is also all zeroes.
 *
 *  The expected-goals family arrives as decimal STRINGS ("0.64"), not numbers. */
export interface RawHistoryEntry {
  fixture: number;
  round: number;
  opponent_team: number;
  was_home: boolean;
  kickoff_time: string | null;
  team_h_score: number | null;
  team_a_score: number | null;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  defensive_contribution?: number;
  expected_goals?: string;
  expected_assists?: string;
}

/** `element-summary/{id}/`. Also carries `fixtures` (his run to come) and
 *  `history_past` (previous seasons); neither is read, so neither is typed. */
export interface RawElementSummary {
  history: RawHistoryEntry[];
}
