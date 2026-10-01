// The real league's own Fantrax points for every 25/26 matchday, one date at a time (a man plays once a day).
// Read-only, public reads, cached to points-cache/ so a rerun fetches nothing twice.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fxpaRead } from "../ratings/packages/core/src/league/fantrax/fxpa.ts";

const dir = new URL(".", import.meta.url).pathname;
const REAL = "mqsjd23smsgbiqzr";
const rows = JSON.parse(readFileSync(`${dir}ratings-input-25-26.json`, "utf8")) as { kickoff: string }[];
const dates = [...new Set(rows.map((r) => r.kickoff.slice(0, 10)))].sort();
mkdirSync(`${dir}points-cache`, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fetched = 0;
for (const date of dates) {
  for (const group of ["SOCCER_NON_GOALIE", "SOCCER_GOALIE"]) {
    const file = `${dir}points-cache/${date}-${group}.json`;
    if (existsSync(file)) continue;
    const raw = (await fxpaRead(REAL, "getPlayerStats", {
      statusOrTeamFilter: "ALL", pageNumber: "1", maxResultsPerPage: "1000", positionOrGroup: group,
      seasonOrProjection: "SEASON_925_BY_DATE", timeframeTypeCode: "BY_DATE", startDate: date, endDate: date,
    })) as any;
    const header: string[] = raw.tableHeader.cells.map((c: any) => c.shortName);
    const keep = raw.statsTable
      .map((r: any) => ({
        id: r.scorer?.scorerId, name: r.scorer?.name, pos: r.scorer?.posShortNames,
        cells: Object.fromEntries(header.map((h, i) => [h, r.cells[i]?.content])),
      }))
      .filter((r: any) => Number(r.cells.GP) > 0);
    writeFileSync(file, JSON.stringify({ date, group, header, rows: keep }));
    fetched++;
    console.log(date, group, keep.length, "played");
    await sleep(800);
  }
}
console.log("dates", dates.length, "fetched", fetched);
