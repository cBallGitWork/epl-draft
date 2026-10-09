import { finiteOrNull } from "../../untrusted";
import type { Band, CategoryTable, Price, ScoringCategory, ScoringRules, Tiers } from "../scoring";

// Fantrax's scoring system: flat prices from `scoringCategories`, ranges from the `scoringCategorySettings` mirror,
// the only one that says whether bands stack (`"range1|59|1|NULL$60|90|1|NULL"` pays 2 for 90 minutes cumulative, else 1).

export interface RawScoringSystem {
  /** group key → category short name → position letter → expression. */
  scoringCategories?: Record<string, Record<string, Record<string, string | undefined>> | undefined>;
  scoringCategorySettings?: RawScoringGroup[];
}

export interface RawScoringGroup {
  group?: { code?: string; name?: string; shortName?: string; id?: string };
  configs?: RawScoringConfig[];
}

/** One category priced for one position; a category repeats once per position the league prices it for. */
export interface RawScoringConfig {
  scoringCategory?: { id?: string; name?: string; shortName?: string; code?: string };
  /** "Default", "D", "M"…: the table's position key. */
  position?: { shortName?: string };
  points?: number;
  cumulative?: boolean;
  /** "PER_GAME" on every range seen. */
  rangeType?: string;
  ranges?: RawScoringRange[];
}

/** One band: `points` for a count from `start` to `end`, or for every `interval` of it. */
export interface RawScoringRange {
  range?: { start?: number; end?: number };
  points?: number;
  interval?: number;
}

/** Fantrax's platform keys for the two tables, read only here: the domain type names positions instead. */
const GOALIE_GROUP = "GOALIE";
const OUTFIELD_GROUP = "NON_GOALIE";
const GOALIE_GROUP_CODE = "SOCCER_GOALIE";
const OUTFIELD_GROUP_CODE = "SOCCER_NON_GOALIE";
/** The only range type read: bands applied to one match's count. */
const PER_GAME = "PER_GAME";

export function mapScoringRules(raw: RawScoringSystem | undefined): ScoringRules | null {
  const categories = raw?.scoringCategories;
  if (!categories) return null;
  const configs = (code: string) => raw?.scoringCategorySettings?.find((group) => group.group?.code === code)?.configs ?? [];

  return {
    goalie: table(categories[GOALIE_GROUP], configs(GOALIE_GROUP_CODE)),
    outfield: table(categories[OUTFIELD_GROUP], configs(OUTFIELD_GROUP_CODE)),
    goaliePosition: goaliePosition(raw?.scoringCategorySettings),
  };
}

function table(group: Record<string, Record<string, string | undefined>> | undefined, configs: readonly RawScoringConfig[]): CategoryTable {
  const out: CategoryTable = {};
  for (const [category, positions] of Object.entries(group ?? {})) {
    const row: Record<string, Price | null> = {};
    for (const [position, expression] of Object.entries(positions ?? {})) {
      if (typeof expression !== "string") continue;
      // Every position the wire priced is kept, even unreadable, so it cannot fall through to `Default`.
      const config = configs.find((c) => c.scoringCategory?.shortName === category && c.position?.shortName === position);
      row[position] = flatPoints(expression) ?? tiers(config);
    }
    if (Object.keys(row).length > 0) out[category] = row;
  }
  return out;
}

/** `"points6"` → 6, `"points-1"` → -1; anything else is not a flat number. */
function flatPoints(expression: string): number | null {
  const match = /^points(-?\d+(?:\.\d+)?)$/.exec(expression.trim());
  if (!match) return null;
  const points = Number(match[1]);
  return Number.isFinite(points) ? points : null;
}

/** A range's bands off the settings mirror; null for one not per match, or with a band we cannot read. */
function tiers(config: RawScoringConfig | undefined): Tiers | null {
  if (config?.rangeType !== PER_GAME || typeof config.cumulative !== "boolean") return null;
  const bands = (config.ranges ?? []).map(band);
  if (bands.length === 0 || !bands.every((b): b is Band => b !== null)) return null;
  return { bands: bands.sort((a, b) => a.from - b.from), cumulative: config.cumulative };
}

function band(raw: RawScoringRange): Band | null {
  const [from, to, points] = [raw.range?.start, raw.range?.end, raw.points].map(finiteOrNull);
  const every = raw.interval === undefined ? null : finiteOrNull(raw.interval);
  if (from == null || to == null || points == null || (raw.interval !== undefined && !(every !== null && every > 0))) return null;
  return { from, to, points, every };
}

/** The keeper's position letter, read off the goalie group's short name; null rather than a wrong table. */
function goaliePosition(groups: RawScoringGroup[] | undefined): string | null {
  const goalie = groups?.find((group) => group.group?.code === GOALIE_GROUP_CODE);
  return goalie?.group?.shortName ?? null;
}

/** Each category's name, one entry per category, keyed `{groupId}#{categoryId}` as live scoring keys it.
 *  No position segment: live rows always say `#-1`, a row outfield Goals and Clean Sheets lack here.
 *  Empty, never null, for a league that described nothing; a Record because it crosses a cache. */
export function mapScoringCategories(
  raw: RawScoringSystem | undefined,
): Record<string, ScoringCategory> {
  const names: Record<string, ScoringCategory> = {};
  for (const group of raw?.scoringCategorySettings ?? []) {
    const groupId = group.group?.id;
    if (typeof groupId !== "string" || groupId === "") continue;
    for (const config of group.configs ?? []) {
      const category = config.scoringCategory;
      if (typeof category?.id !== "string" || category.id === "") continue;
      // An unnamed category stays unnamed: `5010#6090` on a card reads as a category called 6090.
      if (typeof category.shortName !== "string" || category.shortName === "") continue;
      names[`${groupId}#${category.id}`] = {
        code: category.shortName,
        name: category.name ?? category.shortName,
        longCode: category.code ?? null,
      };
    }
  }
  return names;
}
