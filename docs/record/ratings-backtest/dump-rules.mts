import { writeFileSync } from "node:fs";
import { fetchLeagueInfo } from "../ratings/packages/core/src/league/fantrax/client.ts";
import { mapScoringRules } from "../ratings/packages/core/src/league/fantrax/scoring.ts";
const info = (await fetchLeagueInfo("mqsjd23smsgbiqzr")) as any;
const rules = mapScoringRules(info.scoringSystem);
writeFileSync(new URL("rules-real.json", import.meta.url), JSON.stringify(rules, null, 1));
console.log(JSON.stringify(rules).slice(0, 900));
