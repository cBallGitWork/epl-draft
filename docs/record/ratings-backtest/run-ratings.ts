// Rates every 25/26 match with the committed module; writes ratings-25-26.json beside it.
import { readFileSync, writeFileSync } from "node:fs";
import { rateMatch } from "../ratings/packages/core/src/football/rating/rating";
import type { RatedMatch } from "../ratings/packages/core/src/football/rating/rating";
import { RATING_WEIGHTS } from "../ratings/packages/core/src/football/rating/weights";

const dir = new URL(".", import.meta.url).pathname;
const rows = JSON.parse(readFileSync(`${dir}ratings-input-25-26.json`, "utf8")) as Record<string, any>[];

const STATS = [
  "goals", "penaltyGoals", "goalsOutsideBox", "assists", "penaltySaves", "saves", "goalsPrevented",
  "keyPasses", "bigChancesCreated", "shotsOnTarget", "shotsOffPost", "penaltiesWon", "foulsSuffered",
  "bigChancesMissed", "penaltiesMissed", "dispossessed", "duelsWon", "duelsLost", "tacklesWon",
  "interceptions", "clearances", "blocks", "recoveries", "clearancesOffLine", "accuratePasses",
  "yellowCards", "redCards", "ownGoals", "errorsLeadingToGoal", "errorsLeadingToShot", "penaltiesConceded",
  "foulsCommitted", "cleanSheet", "goalsAgainstOnPitch", "xg", "xa",
];

const out = rows.map((r) => {
  const stats: Record<string, number | null> = {};
  for (const k of STATS) stats[k] = r[k] ?? null;
  stats.penaltyXg = r.penXg;
  stats.saves = r.pos === "GK" ? (r.fplSaves ?? r.saves ?? null) : null;
  stats.goalsPrevented = r.pos === "GK" ? (r.goalsPrevented ?? null) : null;
  const m: RatedMatch = {
    position: r.pos,
    minutes: r.minutes,
    stats,
    opponent: r.oppAttack == null ? null : { attack: r.oppAttack, defence: r.oppDefence },
    expected: r.expected,
  };
  const rated = rateMatch(m, RATING_WEIGHTS);
  return {
    ...r,
    rating: rated.rating,
    raw: rated.raw,
    vsExpected: rated.vsExpected,
    blended: rated.blended,
    parts: Object.fromEntries(rated.parts.map((p) => [p.name, p.points])),
  };
});
writeFileSync(`${dir}ratings-25-26.json`, JSON.stringify(out));
console.log("rated", out.filter((r) => r.rating != null).length, "of", out.length);
