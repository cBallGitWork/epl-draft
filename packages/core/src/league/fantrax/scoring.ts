import type { CategoryTable, ScoringCategory, ScoringRules } from "../scoring";

// Fantrax's scoring system as it arrives, and the little of it we read.
//
// The payload states the rules twice: `scoringCategories` is the complete table
// as strings, and `scoringCategorySettings` is a structured mirror carrying the
// names and the group identities. We take the table for the numbers and the
// mirror for one thing the table cannot say — which of its two groups is the
// keepers'.
//
// Only flat `pointsN` values are read. Fantrax also writes ranges
// (`"range1|59|1|NULL$60|90|1|NULL"`) for minutes, saves and goals conceded, and
// those are deliberately not parsed: nothing needs them, because we do not score
// matches. A value we cannot read is left out rather than guessed at, and the
// caller gets null.

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
}

/** Fantrax's own keys for the two tables. Platform constants, interpreted in the
 *  adapter exactly as `ACTIVE`/`RESERVE` are — the domain type that comes out
 *  the other side names positions, not Fantrax's group vocabulary. */
const GOALIE_GROUP = "GOALIE";
const OUTFIELD_GROUP = "NON_GOALIE";
const GOALIE_GROUP_CODE = "SOCCER_GOALIE";

export function mapScoringRules(raw: RawScoringSystem | undefined): ScoringRules | null {
  const categories = raw?.scoringCategories;
  if (!categories) return null;

  return {
    goalie: table(categories[GOALIE_GROUP]),
    outfield: table(categories[OUTFIELD_GROUP]),
    goaliePosition: goaliePosition(raw?.scoringCategorySettings),
  };
}

function table(group: Record<string, Record<string, string | undefined>> | undefined): CategoryTable {
  const out: CategoryTable = {};
  for (const [category, positions] of Object.entries(group ?? {})) {
    const row: Record<string, number | null> = {};
    for (const [position, expression] of Object.entries(positions ?? {})) {
      if (typeof expression !== "string") continue;
      // Every position the wire priced is kept, even the ones we cannot read.
      // Dropping an unreadable one would let it fall through to `Default` and
      // report a number from a different rule as if it were this one.
      row[position] = flatPoints(expression);
    }
    if (Object.keys(row).length > 0) out[category] = row;
  }
  return out;
}

/** `"points6"` → 6, `"points-1"` → -1. Anything else — a range, a shape we have
 *  not seen — is not a flat number and is left for a reader who needs it. */
function flatPoints(expression: string): number | null {
  const match = /^points(-?\d+(?:\.\d+)?)$/.exec(expression.trim());
  if (!match) return null;
  const points = Number(match[1]);
  return Number.isFinite(points) ? points : null;
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
