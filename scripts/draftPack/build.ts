import {
  LEAGUE_PROJECTION_PARTS,
  clubCleanSheets,
  cohortRate,
  fplCodeOf,
  leagueWeek,
  observedAt,
  projectionCodes,
  shrunkRate,
  type Bridge,
  type LeagueMatch,
  type LeagueProjectionPart,
  type LeagueProjectionRow,
  type LeagueScoring,
  type ProjectedPlayer,
  type SlotPricing,
  type SlotRates,
} from "@epl/core";

// The draft pack: every pool man the bridge keys and the model projects, priced at each slot he is eligible for by
// the scoring league's rules. Pure; `draft-pack.ts` does the reading and the writing.

/** What FPL says of a man: how it files him, and whether he is fit. */
export interface FplSide {
  line: number;
  status: string;
  news: string;
}

/** Who a pool man is, off the league's own stat read. */
export interface PoolSide {
  fantraxId: string;
  name: string;
  club: string | null;
  /** The slot Fantrax prices him at while nobody owns him. */
  primary: string | null;
  eligible: readonly string[];
  adp: number | null;
}

export interface PackInputs {
  scoring: LeagueScoring;
  pool: readonly PoolSide[];
  /** His matches in the league so far, one per single-match period. */
  matches: ReadonlyMap<string, readonly LeagueMatch[]>;
  bridge: Bridge;
  projections: ReadonlyMap<number, ProjectedPlayer>;
  fpl: ReadonlyMap<number, FplSide>;
  gameweeks: readonly number[];
  /** Minutes of the slot's average each man's own rate is drawn toward. */
  weight: number;
}

const STATUS: Readonly<Record<string, LeagueProjectionRow["status"]>> = { a: "fit", d: "doubt" };

export function buildPack(inputs: PackInputs): { rows: LeagueProjectionRow[]; priors: Record<string, SlotRates> } {
  const { scoring, pool, matches, bridge, projections, fpl, gameweeks, weight } = inputs;
  const codes = projectionCodes(scoring);
  const slots = [...new Set(pool.flatMap((man) => man.eligible))];
  const observed = (man: PoolSide, slot: string, which: readonly string[]) =>
    observedAt(scoring.rules, which, slot, matches.get(man.fantraxId) ?? []);
  const keeper = codes.keeper === null ? [] : [codes.keeper];
  const priors = Object.fromEntries(
    slots.map((slot) => {
      const cohort = pool.filter((man) => man.eligible.includes(slot));
      return [slot, { defcon: cohortRate(cohort.map((man) => observed(man, slot, codes.defcon))), keeper: cohortRate(cohort.map((man) => observed(man, slot, keeper))) }];
    }),
  );
  const sheets = clubCleanSheets(projections.values(), (code) => fpl.get(code)?.line ?? null);

  const rows: LeagueProjectionRow[] = [];
  for (const man of pool) {
    const code = fplCodeOf(bridge, man.fantraxId);
    const projected = code === null ? undefined : projections.get(code);
    const side = code === null ? undefined : fpl.get(code);
    if (code === null || projected === undefined || side === undefined || man.eligible.length === 0) continue;
    const weeks = gameweeks.map((gw) => projected.gameweeks.find((week) => week.gw === gw) ?? null);
    const appearances = weeks.reduce((sum, week) => sum + (week === null ? 0 : appeared(week.parts?.appearance ?? 0, week.start ?? 0, week.fixtures)), 0);
    const positions: Record<string, SlotPricing> = {};
    for (const slot of man.eligible) {
      const rates = {
        defcon: shrunkRate(observed(man, slot, codes.defcon), priors[slot].defcon, weight),
        keeper: shrunkRate(observed(man, slot, keeper), priors[slot].keeper, weight),
      };
      const priced = weeks.map((week) =>
        week === null ? null : leagueWeek(week, side.line, slot, scoring.rules, codes, rates, sheets.get(projected.club)?.get(week.gw) ?? null),
      );
      const total = priced.reduce((sum, week) => sum + (week?.points ?? 0), 0);
      positions[slot] = {
        total: round(total),
        perGw: priced.map((week) => (week === null ? null : round(week.points))),
        perMatch: appearances > 0 ? round(total / appearances) : null,
        parts: byPart((part) => round(priced.reduce((sum, week) => sum + (week?.parts[part] ?? 0), 0))),
        partsPerGw: byPart((part) => priced.map((week) => (week === null ? null : round(week.parts[part])))),
        rates: { defcon: round(rates.defcon), keeper: round(rates.keeper) },
      };
    }
    const pricedAt = Object.entries(positions).sort(([, a], [, b]) => b.total - a.total)[0][0];
    const best = positions[pricedAt];
    const read = weeks.filter((week) => week !== null);
    rows.push({
      fantraxId: man.fantraxId,
      fplCode: code,
      name: man.name,
      club: man.club,
      fplClub: projected.club,
      pos: man.primary,
      eligible: [...man.eligible],
      pricedAt,
      total: best.total,
      perGw: best.perGw,
      perMatch: best.perMatch,
      parts: best.parts,
      positions,
      start: mean(read.map((week) => week.start)),
      minutes: mean(read.map((week) => week.minutes)),
      minutesPerGw: weeks.map((week) => week?.minutes ?? null),
      appearances: round(appearances),
      status: STATUS[side.status] ?? "out",
      note: side.news.trim() === "" ? null : side.news.trim(),
      adp: man.adp,
      owned: false,
    });
  }
  const rounded = Object.fromEntries(Object.entries(priors).map(([slot, rates]) => [slot, { defcon: round(rates.defcon), keeper: round(rates.keeper) }]));
  return { rows: rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)), priors: rounded };
}

function byPart<T>(value: (part: LeagueProjectionPart) => T): Record<LeagueProjectionPart, T> {
  return Object.fromEntries(LEAGUE_PROJECTION_PARTS.map((part) => [part, value(part)])) as Record<LeagueProjectionPart, T>;
}

/** A week's expected appearances: starts, which mostly run past an hour, then what the appearance points leave over. */
function appeared(points: number, start: number, fixtures: number): number {
  const full = Math.min(start * fixtures, points / 2);
  return Math.max(0, points - full);
}

function mean(values: readonly (number | null)[]): number | null {
  const read = values.filter((value): value is number => value !== null);
  return read.length === 0 ? null : round(read.reduce((a, b) => a + b, 0) / read.length);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
