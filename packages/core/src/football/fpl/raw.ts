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
  /** When FPL attached the line in `news`, ISO with microseconds. Present on all
   *  162 elements that carry news, probed 4 Sep 2026 — so it is optional here for
   *  the elements that carry none, and never null beside a non-empty `news`.
   *
   *  It is what makes an availability note an ITEM rather than a state: without a
   *  date there is nothing to sort a news list by. */
  news_added?: string | null;
  opta_code: string | null;
  /** `1995-09-15`. Present on 633 of 652, probed 4 Sep 2026 — so it is optional
   *  here and nullable in the domain, unlike the season block beside it.
   *
   *  The nineteen without one are not a class: they are men FPL has listed and
   *  not finished filling in. `region` sits at the same 633 and is deliberately
   *  NOT mirrored — it is an opaque integer over 67 values with no lookup table
   *  published anywhere, and Fantrax gives the birthplace as plain text. */
  birth_date?: string | null;
  /** `2024-07-04` — when he signed for the club he is at. Present on the same
   *  633 of 652 as `birth_date`, probed 4 Sep 2026.
   *
   *  Mirrored and **deliberately not carried into the domain**, on
   *  `squad_number`'s precedent above. It was, for one commit, as a stand-in for
   *  Fantrax's unreachable service time on the Transfer tab — and the tab was
   *  then cut back to how he arrived and what he is worth (Craig, 4 Sep 2026:
   *  "Remove at this club and In this league sections too. Keep it clean"). A
   *  domain field with no reader is CODE_RULES §2's dead pipeline; the wire fact
   *  stays recorded here so the next session does not have to re-probe it. */
  team_join_date?: string | null;

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
  /** FPL's own three indices, and two of them are Championship Manager's own
   *  attribute names. Strings like the expected family, present on all 652
   *  elements and non-zero on ~340 of them (probed 4 Sep 2026) — which is the
   *  count of men who have played, not a gap in the feed.
   *
   *  `ict_index` is deliberately not mirrored: it is these three combined, and a
   *  fourth field holding a function of the other three is the kind of thing
   *  CODE_RULES §2 calls bloat. */
  influence: string;
  creativity: string;
  threat: string;
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

/** One completed season, from `element-summary`'s `history_past`.
 *
 *  Only the columns that are REAL IN EVERY SEASON are typed, and that is a
 *  measured list rather than a cautious one. FPL writes every key on every row,
 *  so a missing statistic is indistinguishable from a zero — and it publishes
 *  rows going back to 2014/15, long before it collected most of what it collects
 *  now. Counted across eight long-career players on 4 Sep 2026:
 *
 *      minutes · total_points · goals_scored · assists         every season
 *      clean_sheets · goals_conceded · cards · bonus · bps      every season
 *      starts · expected_goals · expected_assists              2022/23 onward
 *      defensive_contribution                                  2024/25 onward
 *      tackles · recoveries · clearances_blocks_interceptions   2025/26 onward
 *
 *  So `starts` is zero for Maguire's 2021/22 — a season in which he played 2,513
 *  minutes — and an appearances column built on it would print that zero with a
 *  straight face.
 *  The fix is not a table of first-seasons to dash against — it is to show the
 *  columns that never lie, which is also the set Championship Manager's own
 *  appearances table carries. Minutes stands in for appearances, which FPL has
 *  never published here at all. */
export interface RawPastSeason {
  season_name: string;
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
}

/** `element-summary/{id}/`. Also carries `fixtures` (his run to come); nothing
 *  reads it — the football snapshot already answers the fixture run — so it
 *  stays untyped. */
export interface RawElementSummary {
  history: RawHistoryEntry[];
  history_past: RawPastSeason[];
}
