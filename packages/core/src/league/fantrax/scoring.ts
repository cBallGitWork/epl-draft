import { finiteOrNull } from "../../untrusted";
import type { Band, CategoryTable, Price, ScoringCategory, ScoringRules, Tiers } from "../scoring";

// Fantrax's scoring system as it arrives, and what we read of it.
//
// The payload states the rules twice: `scoringCategories` is the complete table as strings, and
// `scoringCategorySettings` a structured mirror carrying names, group identities and each range's bands.
// Flat prices come from the table; a range comes from the mirror, because only the mirror says whether its
// bands stack (`"range1|59|1|NULL$60|90|1|NULL"` pays 2 for 90 minutes when cumulative and 1 when not).

export interface RawScoringSystem {
  /** group key → category short name → position letter → expression. */
  scoringCategories?: Record<string, Record<string, Record<string, string | undefined>> | undefined>;
  scoringCategorySettings?: RawScoringGroup[];
}

export interface RawScoringGroup {
  group?: { code?: string; name?: string; shortName?: string; id?: string };
  configs?: RawScoringConfig[];
}

/** One category priced for one position. The same category appears once per
 *  position the league prices it for, which is why the names table collapses
 *  them. */
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

/** Fantrax's own keys for the two tables. Platform constants, interpreted in the
 *  adapter exactly as `ACTIVE`/`RESERVE` are — the domain type that comes out
 *  the other side names positions, not Fantrax's group vocabulary. */
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

/** The keeper's position letter, from the goalie group's own short name.
 *
 *  Nothing in the payload states outright that "G" means goalkeeper — this is
 *  Fantrax naming its group and us reading the name. It is still better than a
 *  literal here, and it fails to null rather than to a wrong table. */
function goaliePosition(groups: RawScoringGroup[] | undefined): string | null {
  const goalie = groups?.find((group) => group.group?.code === GOALIE_GROUP_CODE);
  return goalie?.group?.shortName ?? null;
}


/** What each category is called, keyed as `getLiveScoringStats` keys it.
 *
 *  **The position segment is deliberately not in the key.** `statsMap.object2`
 *  always says `#-1`, while this payload lists a category once per position it
 *  prices it for — and outfield Goals and Clean Sheets have no `-1` row at all
 *  in the rehearsal league. Keying on the whole `scipId` would resolve Minutes
 *  and Assists and silently drop exactly the two categories a reader is looking
 *  for, which reads as "he did not score" rather than as a bug.
 *
 *  Collapsed to one entry per category: the four rows Goals arrives on all name
 *  the same thing. A Record and not a Map because this crosses a cache.
 *
 *  Empty rather than null for a league that described nothing. A caller with no
 *  names shows no breakdown, which is the same thing it does for a category it
 *  cannot find — and a raw `scipId` is never put on screen. */
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
      // A category Fantrax did not name is left unnamed rather than labelled with
      // its own identifier. `5010#6090` on a player card is worse than a missing
      // row: the row is absent from a list that never claimed to be complete,
      // while the identifier looks like a category called 6090.
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
