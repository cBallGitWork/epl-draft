import type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
  FootballSnapshot,
  PlayerMatchStats,
} from "../types";
import type { RawBootstrap, RawFixture, RawLive, RawLiveElement } from "./raw";

// Pure raw → domain transformation. No I/O, no dates from the clock, no network:
// everything this needs arrives as an argument, so it is fully unit-testable and
// the same inputs always give the same snapshot.

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
    chanceOfPlaying: e.chance_of_playing_next_round ?? null,
    optaCode: e.opta_code ?? null,
    season: {
      // `NUMERIC` throughout, not just on the expected trio: these are scraped
      // fields on a payload we do not control, and the counts arriving as
      // numbers today is an observation rather than a guarantee. It coerces a
      // missing or unparseable value to nought, which is the right reading for
      // a season total — a player FPL says nothing about has done nothing.
      goals: NUMERIC(e.goals_scored),
      assists: NUMERIC(e.assists),
      cleanSheets: NUMERIC(e.clean_sheets),
      minutes: NUMERIC(e.minutes),
      starts: NUMERIC(e.starts),
      expectedGoals: NUMERIC(e.expected_goals),
      expectedAssists: NUMERIC(e.expected_assists),
      expectedGoalsConceded: NUMERIC(e.expected_goals_conceded),
      tackles: NUMERIC(e.tackles),
      clearancesBlocksInterceptions: NUMERIC(e.clearances_blocks_interceptions),
      recoveries: NUMERIC(e.recoveries),
      saves: NUMERIC(e.saves),
      goalsConceded: NUMERIC(e.goals_conceded),
      bonus: NUMERIC(e.bonus),
      bps: NUMERIC(e.bps),
    },
  }));
}

export function mapFixtures(raw: RawFixture[]): Fixture[] {
  return raw.map((f) => ({
    id: f.id,
    gameweek: f.event,
    homeClubId: f.team_h,
    awayClubId: f.team_a,
    kickoff: f.kickoff_time,
    homeScore: f.team_h_score,
    awayScore: f.team_a_score,
    status: fixtureStatus(f),
    // Raw `finished`, on its own: this is the one place the distinction
    // `fixtureStatus` deliberately throws away is kept.
    settled: f.finished ?? false,
    minutes: f.minutes ?? 0,
    homeDifficulty: f.team_h_difficulty ?? null,
    awayDifficulty: f.team_a_difficulty ?? null,
  }));
}

function fixtureStatus(f: RawFixture): FixtureStatus {
  // `finished_provisional` flips as soon as the referee blows up; `finished` waits
  // for FPL to confirm bonus. Treat either as done — a user watching the score does
  // not care that bonus points are still settling.
  if (f.finished || f.finished_provisional) return "finished";
  if (f.started) return "live";
  return "upcoming";
}

/** The gameweek to show. `is_current` is the one in play; before the season and
 *  between gameweeks nothing is current, so fall back to `is_next`, then to the
 *  first event so the UI always has something to render. */
export function focusGameweek(raw: RawBootstrap): { gameweek: number; deadline: string | null } {
  const events = raw.events ?? [];
  const chosen =
    events.find((e) => e.is_current) ?? events.find((e) => e.is_next) ?? events[0] ?? null;
  return { gameweek: chosen?.id ?? 1, deadline: chosen?.deadline_time ?? null };
}

const NUMERIC = (v: number | string | undefined): number => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? (n as number) : 0;
};

/** Per-fixture stat lines from the live endpoint.
 *
 *  FPL gives an aggregate `stats` block per player plus an `explain` array with one
 *  entry per fixture. On a double gameweek the aggregate cannot be split, so we
 *  read per-fixture values out of `explain` — the only breakdown FPL publishes.
 *  `explain` covers point-scoring identifiers only, so non-scoring extras (bps, xG)
 *  are taken from the aggregate and are therefore gameweek totals, not per-match,
 *  whenever a player features twice. That is flagged rather than silently wrong. */
export function mapLiveStats(live: RawLive): PlayerMatchStats[] {
  const out: PlayerMatchStats[] = [];
  for (const el of live.elements ?? []) {
    const single = (el.explain ?? []).length === 1;
    for (const block of el.explain ?? []) {
      out.push(statsFor(el, block.fixture, valuesOf(block.stats), single));
    }
  }
  return out;
}

function valuesOf(stats: { identifier: string; value: number }[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of stats ?? []) m[s.identifier] = s.value;
  return m;
}

function statsFor(
  el: RawLiveElement,
  fixtureId: number,
  perFixture: Record<string, number>,
  single: boolean,
): PlayerMatchStats {
  const agg = el.stats ?? {};
  // Prefer the per-fixture value; fall back to the aggregate only when the player
  // featured in exactly one fixture, where the two are by definition equal.
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
    bonus: v("bonus"),
    // Not carried in `explain` — gameweek totals on a double.
    bps: NUMERIC(agg.bps),
    defensiveContribution: NUMERIC(agg.defensive_contribution),
    expectedGoals: NUMERIC(agg.expected_goals),
    expectedAssists: NUMERIC(agg.expected_assists),
  };
}

/** Assemble the whole football snapshot. `fetchedAt` is injected rather than read
 *  from the clock so this stays pure and testable.
 *
 *  `gameweek` is the round these fixtures belong to and must be passed in: taking
 *  it from `focusGameweek` instead would label a snapshot of GW3 with whatever
 *  round happens to be current, which is only invisible while nobody can ask for
 *  a round other than the current one. */
export function buildSnapshot(input: {
  bootstrap: RawBootstrap;
  fixtures: RawFixture[];
  /** Null when the live read failed, which is not the same as it returning
   *  nothing — see `FootballSnapshot.statsUnavailable`. */
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
