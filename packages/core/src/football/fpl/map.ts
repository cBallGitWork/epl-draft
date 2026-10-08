import type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
  FootballSnapshot,
  PlayerMatchStats,
} from "../types";
import type { RawBootstrap, RawFixture, RawLive, RawLiveElement, RawRegion } from "./raw";

// Pure raw → domain mapping: no I/O and no clock, so the same inputs always give the same snapshot.

function mapClubs(raw: RawBootstrap): Club[] {
  return raw.teams.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    shortName: t.short_name,
  }));
}

export function mapPlayers(raw: RawBootstrap): FootballPlayer[] {
  return raw.elements.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.web_name,
    fullName: `${e.first_name} ${e.second_name}`.trim(),
    clubId: e.team,
    status: e.status ?? "a",
    news: e.news ?? "",
    newsAdded: e.news_added ?? null,
    chanceOfPlaying: e.chance_of_playing_next_round ?? null,
    optaCode: e.opta_code ?? null,
    birthDate: e.birth_date ?? null,
    region: e.region ?? null,
    season: {
      // `NUMERIC` throughout: a missing or unparseable season total reads as nought.
      goals: NUMERIC(e.goals_scored),
      assists: NUMERIC(e.assists),
      cleanSheets: NUMERIC(e.clean_sheets),
      minutes: NUMERIC(e.minutes),
      starts: NUMERIC(e.starts),
      expectedGoals: NUMERIC(e.expected_goals),
      expectedAssists: NUMERIC(e.expected_assists),
      expectedGoalsConceded: NUMERIC(e.expected_goals_conceded),
      influence: NUMERIC(e.influence),
      creativity: NUMERIC(e.creativity),
      threat: NUMERIC(e.threat),
      tackles: NUMERIC(e.tackles),
      clearancesBlocksInterceptions: NUMERIC(e.clearances_blocks_interceptions),
      recoveries: NUMERIC(e.recoveries),
      saves: NUMERIC(e.saves),
      goalsConceded: NUMERIC(e.goals_conceded),
    },
  }));
}

/** The country behind a `region` id, or null when FPL has filed none or listed none. */
export function countryOf(region: number | null, regions: readonly RawRegion[]): string | null {
  return regions.find((r) => r.id === region)?.name ?? null;
}

export function mapFixtures(raw: RawFixture[]): Fixture[] {
  return raw.map((f) => ({
    id: f.id,
    code: f.code,
    gameweek: f.event,
    homeClubId: f.team_h,
    awayClubId: f.team_a,
    kickoff: f.kickoff_time,
    homeScore: f.team_h_score,
    awayScore: f.team_a_score,
    status: fixtureStatus(f),
    // Raw `finished`: the one place the distinction `fixtureStatus` throws away is kept.
    settled: f.finished ?? false,
    minutes: f.minutes ?? 0,
    homeDifficulty: f.team_h_difficulty ?? null,
    awayDifficulty: f.team_a_difficulty ?? null,
  }));
}

function fixtureStatus(f: RawFixture): FixtureStatus {
  // `finished_provisional` flips at the whistle and `finished` once bonus is confirmed: either is done.
  if (f.finished || f.finished_provisional) return "finished";
  if (f.started) return "live";
  return "upcoming";
}

/** The gameweek to show: `is_current`, else `is_next` (before the season and between gameweeks), else the first. */
export function focusGameweek(raw: RawBootstrap): { gameweek: number; deadline: string | null } {
  const events = raw.events ?? [];
  const chosen =
    events.find((e) => e.is_current) ?? events.find((e) => e.is_next) ?? events[0] ?? null;
  return { gameweek: chosen?.id ?? 1, deadline: chosen?.deadline_time ?? null };
}

/** Whether a gameweek's football has been played; null for one FPL does not list. Reads `finished`, since
 *  `is_next` flips at the deadline with matches to play and `is_current` stays on a finished gameweek. */
export function roundPlayed(raw: RawBootstrap, gameweek: number): boolean | null {
  return (raw.events ?? []).find((event) => event.id === gameweek)?.finished ?? null;
}

const NUMERIC = (v: number | string | undefined): number => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? (n as number) : 0;
};

/** Per-fixture stat lines from the live endpoint's `explain`, which splits a double. It carries scoring
 *  identifiers only, so xG and starts come from the aggregate and are gameweek totals on a double. */
export function mapLiveStats(live: RawLive): PlayerMatchStats[] {
  const out: PlayerMatchStats[] = [];
  for (const el of live.elements ?? []) {
    const single = (el.explain ?? []).length === 1;
    for (const block of el.explain ?? []) {
      // Summed per block: `el.stats.total_points` is the gameweek's and would print whole against both of a double.
      const points = (block.stats ?? []).reduce((total, stat) => total + (stat.points ?? 0), 0);
      out.push(statsFor(el, block.fixture, valuesOf(block.stats), single, points));
    }
  }
  return out;
}

/** A block's values by identifier; one that is not a number is left out, so it reads as the identifier's absence. */
function valuesOf(stats: { identifier: string; value: number }[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of stats ?? []) if (Number.isFinite(s.value)) m[s.identifier] = s.value;
  return m;
}

function statsFor(
  el: RawLiveElement,
  fixtureId: number,
  perFixture: Record<string, number>,
  single: boolean,
  /** The block's `points`, already summed: `perFixture` holds values only. */
  points: number,
): PlayerMatchStats {
  const agg = el.stats ?? {};
  // The per-fixture value, else the aggregate only when he featured in one fixture, where the two are equal.
  const v = (key: string): number =>
    key in perFixture ? perFixture[key] : single ? NUMERIC(agg[key]) : 0;

  return {
    playerId: el.id,
    fixtureId,
    minutes: v("minutes"),
    goals: v("goals_scored"),
    assists: v("assists"),
    cleanSheet: v("clean_sheets") > 0,
    goalsConceded: v("goals_conceded"),
    ownGoals: v("own_goals"),
    penaltiesSaved: v("penalties_saved"),
    penaltiesMissed: v("penalties_missed"),
    yellowCards: v("yellow_cards"),
    redCards: v("red_cards"),
    saves: v("saves"),
    // Not carried in `explain` — gameweek totals on a double.
    expectedGoals: NUMERIC(agg.expected_goals),
    expectedAssists: NUMERIC(agg.expected_assists),
    // A start scores nothing, so `explain` lacks it: the gameweek's count, written onto both rows of a double.
    starts: NUMERIC(agg.starts),
    fplPoints: points,
  };
}

/** Assemble the football snapshot. `gameweek` is the one these fixtures belong to, passed in: `focusGameweek`
 *  would label a past gameweek's snapshot with the current one. */
export function buildSnapshot(input: {
  bootstrap: RawBootstrap;
  fixtures: RawFixture[];
  /** Null when the live read failed, not when it returned nothing (`statsUnavailable`). */
  live: RawLive | null;
  gameweek: number;
  fetchedAt: string;
}): FootballSnapshot {
  const events = input.bootstrap.events ?? [];
  const event = events.find((e) => e.id === input.gameweek) ?? null;

  return {
    clubs: mapClubs(input.bootstrap),
    players: mapPlayers(input.bootstrap),
    fixtures: mapFixtures(input.fixtures),
    stats: input.live === null ? [] : mapLiveStats(input.live),
    gameweek: input.gameweek,
    deadline: event?.deadline_time ?? null,
    // Absent means not signed off. A missing field must not read as "final".
    dataChecked: event?.data_checked ?? false,
    gameweeks: events.map((e) => e.id).sort((a, b) => a - b),
    fetchedAt: input.fetchedAt,
    statsUnavailable: input.live === null,
  };
}
