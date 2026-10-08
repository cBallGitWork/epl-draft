import { finiteOrNull, recordOrEmpty as obj, stringOrEmpty as str } from "../../untrusted";

// The season's marks as `npm run ratings` files them: one per man per match, keyed by FPL's season-stable codes, with the
// league whose points they were read from. Read back field by field: a mark that is not a number in range is dropped.

export interface RatingStore {
  manifest: { season: string; leagueId: string; updatedAt: string; days: string[] };
  /** Player code → fixture code → mark; null where he played too briefly to rate. */
  marks: Record<string, Record<string, number | null>>;
}

const mark = (v: unknown) => {
  const n = finiteOrNull(v);
  return n !== null && n >= 1 && n <= 10 ? n : null;
};

export function readRatingStore(raw: unknown): RatingStore {
  const r = obj(raw);
  const m = obj(r.manifest);
  const marks: RatingStore["marks"] = {};
  for (const [code, matches] of Object.entries(obj(r.marks))) {
    marks[code] = Object.fromEntries(Object.entries(obj(matches)).map(([fixture, v]) => [fixture, mark(v)]));
  }
  return {
    manifest: { season: str(m.season), leagueId: str(m.leagueId), updatedAt: str(m.updatedAt), days: Array.isArray(m.days) ? m.days.filter((d): d is string => typeof d === "string") : [] },
    marks,
  };
}

/** One man's marks by fixture code; a match missing from the map was never rated. */
export function marksOf(store: RatingStore, playerCode: number): Map<number, number | null> {
  return new Map(Object.entries(store.marks[String(playerCode)] ?? {}).map(([fixture, m]) => [Number(fixture), m]));
}
