// Do the 25/26 feeds count BCM, KP, SOT etc. the way the stats league's Opta feed does? Two gameweeks.
import { readFileSync, writeFileSync } from "node:fs";
import { fxpaRead } from "../ratings/packages/core/src/league/fantrax/fxpa.ts";

const dir = new URL(".", import.meta.url).pathname;
const bridge = JSON.parse(readFileSync(`${dir}../ratings/data/mappings/fantrax.json`, "utf8")) as Record<string, { fplCode: number }>;
const rows = JSON.parse(readFileSync(`${dir}ratings-input-25-26.json`, "utf8")) as Record<string, any>[];
const WINDOWS = [
  { gw: 1, startDate: "2025-08-15", endDate: "2025-08-18" },
  { gw: 20, startDate: "2026-01-03", endDate: "2026-01-04" },
];
const PAIRS: [string, string][] = [
  ["BCM", "bigChancesMissed"], ["BCC", "bigChancesCreated"], ["KP", "keyPasses"], ["SOT", "shotsOnTarget"],
  ["S", "shots"], ["TkW", "tacklesWon"], ["Int", "interceptions"], ["CLR", "clearances"], ["BR", "recoveries"],
  ["DW", "duelsWon"], ["DL", "duelsLost"], ["AP", "accuratePasses"], ["DIS", "dispossessed"], ["FC", "foulsCommitted"],
  ["FS", "foulsSuffered"], ["ErS", "errorsLeadingToShot"], ["ErG", "errorsLeadingToGoal"], ["PKD", "penaltiesWon"],
  ["GOB", "goalsOutsideBox"], ["Pen", "penaltiesConceded"], ["CLO", "clearancesOffLine"], ["AF", "assists"], ["A", "officialAssists"],
];
const report: Record<string, unknown>[] = [];
for (const w of WINDOWS) {
  const raw = (await fxpaRead("w05aib75mtj36y1g", "getPlayerStats", {
    statusOrTeamFilter: "ALL", pageNumber: "1", maxResultsPerPage: "1000", positionOrGroup: "SOCCER_NON_GOALIE",
    seasonOrProjection: "SEASON_925_BY_DATE", timeframeTypeCode: "BY_DATE", startDate: w.startDate, endDate: w.endDate,
  })) as any;
  const header: string[] = raw.tableHeader.cells.map((c: any) => c.shortName);
  const ours = new Map(rows.filter((r) => r.gw === w.gw).map((r) => [r.code, r]));
  const pairs: Record<string, { n: number; exact: number; fantrax: number; ours: number }> = {};
  let joined = 0;
  for (const row of raw.statsTable) {
    const code = bridge[row.scorer?.scorerId]?.fplCode;
    const mine = code ? ours.get(code) : undefined;
    if (!mine) continue;
    joined++;
    for (const [short, key] of PAIRS) {
      const i = header.indexOf(short);
      if (i < 0) continue;
      const cell = row.cells[i]?.content;
      const read = (j: number) => { const c = row.cells[j]?.content; return c === "-" || c == null ? 0 : Number(String(c).replace(/,/g, "")); };
      const theirs = short === "AF" ? read(i) + read(header.indexOf("A")) : read(i);
      const us = Number(mine[key] ?? 0);
      const p = (pairs[short] ??= { n: 0, exact: 0, fantrax: 0, ours: 0 });
      p.n++; p.exact += Number(theirs === us); p.fantrax += theirs; p.ours += us;
    }
  }
  console.log(`GW${w.gw}: ${raw.statsTable.length} Fantrax rows, ${joined} joined; header has ${header.length}`);
  for (const [short, p] of Object.entries(pairs)) console.log(`  ${short.padEnd(4)} exact ${p.exact}/${p.n}  totals fantrax ${p.fantrax} ours ${p.ours}`);
  report.push({ gw: w.gw, joined, pairs });
}
writeFileSync(`${dir}spotcheck.json`, JSON.stringify(report, null, 1));
