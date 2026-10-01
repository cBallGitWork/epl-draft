import { readFileSync, writeFileSync } from "node:fs";
import { strengthBefore } from "../ratings/packages/core/src/football/seasonStrength.ts";
import type { ClubResult } from "../ratings/packages/core/src/football/seasonStrength.ts";
const dir = new URL(".", import.meta.url).pathname;
const rows = JSON.parse(readFileSync(`${dir}ratings-input-25-26.json`, "utf8")) as any[];
const byFix = new Map<string, any>();
for (const r of rows) {
  if (!r.score) continue;
  const k = `${r.fixture}|${r.club}`;
  const e = byFix.get(k) ?? { club: r.club, opp: r.opp, fixture: r.fixture, kickoff: r.kickoff, goalsFor: r.score[0], goalsAgainst: r.score[1], xgFor: 0 };
  e.xgFor += r.xg ?? 0; byFix.set(k, e);
}
const results: ClubResult[] = [...byFix.values()].map((e) => ({ ...e, xgAgainst: byFix.get(`${e.fixture}|${e.opp}`)?.xgFor ?? 0 }));
writeFileSync(`${dir}club-results-25-26.json`, JSON.stringify(results));
const CONFIG = { goalsShare: 0.5, settleGames: 6 };
const clubs = [...new Set(results.map((r) => r.club))];
const at = (when: string) => Object.fromEntries(clubs.map((c) => [c, strengthBefore(results, c, when, CONFIG)]));
const mid = at("2025-12-01"), end = at("2026-06-01");
const table = clubs.map((c) => {
  const own = results.filter((r) => r.club === c);
  return { c, gf: own.reduce((s, r) => s + r.goalsFor, 0) / own.length, ga: own.reduce((s, r) => s + r.goalsAgainst, 0) / own.length, ...{ midA: mid[c].attack, midD: mid[c].defence, endA: end[c].attack, endD: end[c].defence } };
}).sort((a, b) => b.gf - a.gf);
for (const t of table) console.log(t.c, "gf", t.gf.toFixed(2), "ga", t.ga.toFixed(2), "| Dec att", t.midA.toFixed(2), "def", t.midD.toFixed(2), "| May att", t.endA.toFixed(2), "def", t.endD.toFixed(2));
