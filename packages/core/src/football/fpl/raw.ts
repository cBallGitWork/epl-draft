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
  squad_number: number | null;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  opta_code: string | null;
}

interface RawEvent {
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
