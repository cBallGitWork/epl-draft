import { writeFileSync } from "node:fs";
import { fetchLeagueInfo } from "../ratings/packages/core/src/league/fantrax/client.ts";
const info = (await fetchLeagueInfo("mqsjd23smsgbiqzr")) as any;
writeFileSync(new URL("rules-raw-real.json", import.meta.url), JSON.stringify(info.scoringSystem, null, 1));
for (const [g, cats] of Object.entries(info.scoringSystem.scoringCategories as Record<string, any>)) for (const [c, v] of Object.entries(cats)) console.log(g, c, JSON.stringify(v));
const names = (info.scoringSystem.scoringCategorySettings ?? []).flatMap((s: any) => (s.configs ?? []).map((c: any) => `${s.group?.shortName} ${c.scoringCategory?.shortName} = ${c.scoringCategory?.name}`));
console.log([...new Set(names)].join("\n"));
