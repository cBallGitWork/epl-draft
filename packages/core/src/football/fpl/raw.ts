// The shapes FPL's public API returns: data we do not control, so `map.ts` must survive a missing field.

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
  /** A key on every element and null on every one, so never carried into the domain. */
  squad_number: number | null;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  /** When FPL attached `news`, ISO with microseconds: absent only where there is no news. */
  news_added?: string | null;
  opta_code: string | null;
  /** `1995-09-15`. Missing on a few elements, so nullable in the domain. */
  birth_date?: string | null;
  /** His country, an id into `/regions/`; missing on a few elements. */
  region?: number | null;
  /** `2024-07-04`, when he joined his club. Mirrored only: no domain field reads it. */
  team_join_date?: string | null;

  // Season totals, on every element. The expected figures and the three indices arrive as strings ("0.53").
  minutes: number;
  starts: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  expected_goals: string;
  expected_assists: string;
  expected_goals_conceded: string;
  /** FPL's own indices; nought means he has not played. `ict_index`, their sum, is not mirrored. */
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
  /** FPL's sign-off a day or two after the last whistle: the only field entitled to the word "final". */
  data_checked: boolean;
  is_current: boolean;
  is_next: boolean;
  is_previous: boolean;
}

/** One of `/regions/`' countries; `id` equals `code` on all of them. */
export interface RawRegion {
  id: number;
  name: string;
}

export interface RawBootstrap {
  teams: RawTeam[];
  elements: RawElement[];
  events: RawEvent[];
}

/** One player's figure under one identifier; `element` is the per-season id, so never persist it. */
interface RawStatEntry {
  value: number;
  element: number;
}

/** One identifier's home and away lists. A finished match carries all eleven, so a missing one is a shape change. */
export interface RawFixtureStat {
  identifier: string;
  h: RawStatEntry[];
  a: RawStatEntry[];
}

export interface RawFixture {
  id: number;
  /** The season-stable id, the one that may be persisted; Opta's `altIds.opta` is it with a `g` in front. */
  code: number;
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
  /** FPL's own 1–5 difficulty from each side's view: their rating, not ours. */
  team_h_difficulty?: number;
  team_a_difficulty?: number;
  /** The scoresheet bar minutes; `[]` before kickoff. Optional only so an older recorded payload parses. */
  stats?: RawFixtureStat[];
}

/** One scoring identifier's value in one fixture, from live `explain`; read over the aggregate on a double. */
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

/** One match of his season from `element-summary`: expected goals and defensive contribution per fixture.
 *  An unplayed match has an all-zero row too; only its null `team_h_score` tells it from an unused sub's.
 *  The expected family arrive as decimal strings ("0.64"). */
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
  defensive_contribution?: number;
  expected_goals?: string;
  expected_assists?: string;
  /** On this season's rows; absent on an older export, which reads as null. */
  starts?: number;
  tackles?: number;
  clearances_blocks_interceptions?: number;
  recoveries?: number;
  expected_goals_conceded?: string;
}

/** One completed season from `history_past`. FPL writes every key back to 2014/15, a nought where it collected
 *  nothing (`starts` before 2022/23), so only the columns real in every season are typed. */
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
}

/** `element-summary/{id}/`. Its `fixtures` list is read by nobody, so it stays untyped. */
export interface RawElementSummary {
  history: RawHistoryEntry[];
  history_past: RawPastSeason[];
}
