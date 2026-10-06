import type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
  FootballSnapshot,
  PlayerMatchStats,
} from "../types";
import type { RawBootstrap, RawFixture, RawLive, RawLiveElement, RawRegion } from "./raw";

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
    newsAdded: e.news_added ?? null,
    chanceOfPlaying: e.chance_of_playing_next_round ?? null,
    optaCode: e.opta_code ?? null,
    birthDate: e.birth_date ?? null,
    region: e.region ?? null,
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

/** Whether a round's football has been PLAYED. Null for a round FPL does not
 *  list, which is the honest answer for a number out of the season's range.
 *
 *  **Not `roundFinished`, which is already taken and asks a different question.**
 *  `round.ts` has one of that name — "which finished state is this round in",
 *  answering `final`/`provisional`/null off a snapshot's own fixtures — and
 *  `football/index.ts` records in writing that it is deliberately NOT exported,
 *  because it is half an answer that `roundState` completes. Exporting a second
 *  `roundFinished` made `import { roundFinished } from "@epl/core"` resolve to
 *  this one, past a comment saying the name is absent on purpose.
 *
 *  **The question a freshness check actually wants, and not `is_next`.** FPL
 *  flips `is_next` to the following round the moment a deadline passes, so from
 *  Friday teatime it names GW4 while GW3's ten matches are still being played —
 *  and a check reading it calls Saturday's own prediction "wrong" every week.
 *  `is_current` is no better in the other direction: `round.ts` records that FPL
 *  keeps it on a FINISHED round until the next deadline, so a Thursday check
 *  would call a spent prediction current.
 *
 *  `finished` is neither: it is a statement about the football, which is what
 *  "has this already been played" means. Counted live on 5 Sep 2026 with GW3 in
 *  play — GW1 and GW2 `finished: true`, GW3 `is_current: true, finished: false`,
 *  GW4 `is_next: true, finished: false`. */
export function roundPlayed(raw: RawBootstrap, gameweek: number): boolean | null {
  return (raw.events ?? []).find((event) => event.id === gameweek)?.finished ?? null;
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
 *  `explain` covers point-scoring identifiers only, so non-scoring extras (xG)
 *  are taken from the aggregate and are therefore gameweek totals, not per-match,
 *  whenever a player features twice. That is flagged rather than silently wrong. */
export function mapLiveStats(live: RawLive): PlayerMatchStats[] {
  const out: PlayerMatchStats[] = [];
  for (const el of live.elements ?? []) {
    const single = (el.explain ?? []).length === 1;
    for (const block of el.explain ?? []) {
      // Summed here rather than read off `el.stats.total_points`, which is the
      // GAMEWEEK's: on a double that figure belongs to two fixtures at once and
      // would be printed whole against each of them.
      const points = (block.stats ?? []).reduce((total, stat) => total + (stat.points ?? 0), 0);
      out.push(statsFor(el, block.fixture, valuesOf(block.stats), single, points));
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
  /** The same block's `points`, already summed. Passed in rather than re-walked
   *  here because `perFixture` has thrown the points away by the time it
   *  arrives — it is keyed on identifier and holds only the VALUE. */
  points: number,
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
    // Not carried in `explain` — gameweek totals on a double.
    expectedGoals: NUMERIC(agg.expected_goals),
    expectedAssists: NUMERIC(agg.expected_assists),
    // **Counted live before it was mapped** (5 Sep 2026), on this app's own rule
    // that a field present as a key and absent as a value is not a field —
    // `squad_number` cost a whole shirt-number fallback that way. `starts` is
    // real: the key and a non-null value on all 653 elements of GW3 and all of
    // GW1 and GW2; 176 of 653 above nought in a round still being played,
    // against 246 with minutes, which is the right shape because the difference
    // is substitutes. Never a start recorded against nought minutes.
    //
    // It joins this group rather than `v()` because `explain` carries
    // point-scoring identifiers only and a start scores nothing by itself. So it
    // is the ROUND's count on a double, written onto both rows — `starts > 1` is
    // unobserved rather than impossible, since no double has been played yet.
    starts: NUMERIC(agg.starts),
    fplPoints: points,
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
