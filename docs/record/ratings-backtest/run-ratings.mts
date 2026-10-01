// Rates every 25/26 match with the committed module; writes ratings-25-26.json beside it.
import { readFileSync, writeFileSync } from "node:fs";
import { rateMatch } from "../ratings/packages/core/src/join/rating/rating.ts";
import type { RatedMatch } from "../ratings/packages/core/src/join/rating/rating.ts";
import { RATING_WEIGHTS } from "../ratings/packages/core/src/join/rating/weights.ts";
import { strengthBefore } from "../ratings/packages/core/src/football/seasonStrength.ts";
import type { ClubResult } from "../ratings/packages/core/src/football/seasonStrength.ts";

const dir = new URL(".", import.meta.url).pathname;
const rows = JSON.parse(readFileSync(`${dir}ratings-input-pts-25-26.json`, "utf8")) as Record<string, any>[];
const results = JSON.parse(readFileSync(`${dir}club-results-25-26.json`, "utf8")) as ClubResult[];
const rules = JSON.parse(readFileSync(`${dir}rules-real.json`, "utf8"));
const STRENGTH = { goalsShare: 0.5, settleGames: 6 };

const price = (cat: string, pos: string) => {
  const table = pos === "G" ? rules.goalie : rules.outfield;
  const t = table[cat] ?? {};
  return (t[pos] ?? t.Default ?? 0) as number;
};
const STATS = [
  "goals", "assists", "bigChancesMissed", "penaltiesMissed", "errorsLeadingToGoal", "errorsLeadingToShot",
  "penaltiesConceded", "dispossessed", "goalsOutsideBox", "penaltiesWon", "clearancesOffLine", "redCards",
  "ownGoals", "penaltySaves", "shots", "keyPasses", "xg", "xa",
];
const strengthCache = new Map<string, { attack: number; defence: number }>();
const strength = (club: string, kickoff: string) => {
  const key = `${club}|${kickoff}`;
  if (!strengthCache.has(key)) strengthCache.set(key, strengthBefore(results, club, kickoff, STRENGTH));
  return strengthCache.get(key)!;
};

const out = rows.map((r) => {
  const stats: Record<string, number | null> = {};
  for (const k of STATS) stats[k] = r[k] ?? null;
  stats.goalsPrevented = r.pos === "GK" ? (r.goalsPrevented ?? null) : null;
  const pos = r.fxPos as string;
  const goal = price("G", pos), assist = price("AT", pos), sheet = price("CS", pos);
  const opp = r.opp ? strength(r.opp, r.kickoff) : null;
  const e = r.expected;
  const m: RatedMatch = {
    minutes: r.minutes,
    points: r.points,
    stats,
    opponent: opp,
    expected: e ? { attacking: e.goals * goal + e.assists * assist, cleanSheet: r.minutes >= 60 ? e.cleanSheet * sheet : 0 } : null,
  };
  const rated = rateMatch(m, RATING_WEIGHTS);
  return {
    ...r,
    oppAttack: opp?.attack ?? null, oppDefence: opp?.defence ?? null,
    pts: r.points?.total ?? null,
    rating: rated.rating, adjusted: rated.adjusted, vsExpected: rated.vsExpected,
    parts: Object.fromEntries(rated.parts.map((p) => [p.name, p.points])),
  };
});
writeFileSync(`${dir}ratings-25-26.json`, JSON.stringify(out));
const rated = out.filter((r) => r.rating != null);
console.log("rated", rated.length, "of", out.length);
