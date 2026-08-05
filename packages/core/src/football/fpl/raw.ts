// The shapes FPL's public API actually returns, as verified against the live
// endpoints. Everything is marked optional-ish in spirit: this is scraped data we
// do not control, so `map.ts` must render gracefully when a field goes missing.

export interface RawTeam {
  id: number;
  code: number;
  name: string;
  short_name: string;
}

export interface RawElement {
  id: number;
  code: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  squad_number: number | null;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  opta_code: string | null;
}

export interface RawEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
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
}

/** One scoring identifier's value in one fixture, from the live endpoint's
 *  `explain` block. This is the only per-fixture breakdown FPL gives, which is why
 *  we prefer it over the aggregate `stats` on double gameweeks. */
export interface RawExplainStat {
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
