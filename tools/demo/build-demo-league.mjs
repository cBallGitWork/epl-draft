// Builds the demo league's payloads from real captures.
//
//   node tools/demo/build-demo-league.mjs
//
// Ten teams with names of a realistic length, fourteen players each, written to
// packages/core/src/league/fantrax/demoPayloads.json.
//
// Everything here is derived rather than invented: the roster limits, scoring
// system and 38 periods are the REAL league's own getLeagueInfo; the players are
// Fantrax ids the bridge actually resolves, so portraits and fixtures land; and
// the standings page is the shape of a real captured payload with its rows
// replaced. That is the point — a fixture whose shape drifts from the provider
// is a fixture that lies about whether a screen works.
//
// `.mjs` and under tools/ rather than scripts/, which is a typechecked tsx
// project, matching the instrument drawer's own reasoning.
import { readFileSync, writeFileSync } from "node:fs";
const D = "2026-08-29";
const R = "/Users/craigball/epl-draft-1";
const read = (p) => JSON.parse(readFileSync(`${R}/${p}`, "utf8"));

const pool   = read(`data/snapshots/fantrax/pool/${D}/getPlayerIds.json`);
const bridge = read("data/mappings/fantrax.json");
const realInfo = read(`data/snapshots/fantrax/leagues/real/${D}/getLeagueInfo.json`);
const pageTpl  = read("packages/core/src/league/fantrax/__fixtures__/standingsPage.json");

// Only players the bridge resolves: an unmapped man has no portrait and no
// fixture, and a demo league full of them would flatter the layout.
const playable = Object.values(pool).filter(
  (p) => p.fantraxId && bridge[p.fantraxId] && ["G", "D", "M", "F"].includes(p.position),
);
const byPos = { G: [], D: [], M: [], F: [] };
for (const p of playable) byPos[p.position].push(p);
for (const k of Object.keys(byPos)) byPos[k].sort((a, b) => a.fantraxId.localeCompare(b.fantraxId));

// Ten managers, named the way sixteen friends actually name teams: long enough
// to test a column, varied enough to test truncation.
const TEAMS = [
  "Ctrl Alt Defeat", "Bald Fraudiola", "Sons of Pitches", "Xhaka Khan", "Hakuna Sissoko",
  "Toon Army Ltd", "Klopp Bottom", "Mings Blanket", "Vardy Party", "Pique Blinders",
];

const teamId = (i) => `demo${String(i + 1).padStart(2, "0")}00000000000`;
const cursor = { G: 0, D: 0, M: 0, F: 0 };
const take = (pos, n) => byPos[pos].slice(cursor[pos], (cursor[pos] += n));

// The real league's own limits, read off its getLeagueInfo: 14 total, 11 active,
// 3 reserve, and D5 F3 G1 M5 active.
const squads = TEAMS.map(() => {
  const active = [
    ...take("G", 1).map((p) => ({ p, position: "G", status: "ACTIVE" })),
    ...take("D", 4).map((p) => ({ p, position: "D", status: "ACTIVE" })),
    ...take("M", 4).map((p) => ({ p, position: "M", status: "ACTIVE" })),
    ...take("F", 2).map((p) => ({ p, position: "F", status: "ACTIVE" })),
  ];
  const reserve = [
    ...take("D", 1).map((p) => ({ p, position: "D", status: "RESERVE" })),
    ...take("M", 1).map((p) => ({ p, position: "M", status: "RESERVE" })),
    ...take("F", 1).map((p) => ({ p, position: "F", status: "RESERVE" })),
  ];
  return [...active, ...reserve];
});

// A table with a spread worth looking at: a runaway leader, a tight middle, a
// cut line that falls between two sides on the same points.
const RECORDS = [
  [3, 0, 0, 214, 168], [2, 1, 0, 201, 175], [2, 0, 1, 198, 181], [2, 0, 1, 187, 179],
  [1, 2, 0, 176, 170], [1, 1, 1, 171, 172], [1, 1, 1, 168, 174], [1, 0, 2, 159, 183],
  [0, 1, 2, 148, 190], [0, 0, 3, 121, 199],
];
const STREAK = ["3 (W)", "1 (D)", "2 (W)", "1 (L)", "2 (D)", "1 (W)", "1 (L)", "2 (L)", "1 (D)", "3 (L)"];

const rows = RECORDS.map(([w, d, l, pf, pa], i) => ({
  cells: [
    { content: String(w), toolTip: String(w) },
    { content: String(d), toolTip: String(d) },
    { content: String(l), toolTip: String(l) },
    { content: String(w * 3 + d), toolTip: String(w * 3 + d) },
    { content: (w / Math.max(1, w + d + l)).toFixed(3).replace(/^0/, "") },
    { content: String(i === 0 ? 0 : Math.round(((RECORDS[0][0] - w) + (RECORDS[0][1] - d) / 2) * 2) / 2) },
    { content: String(pf), toolTip: String(pf) },
    { content: String(pa), toolTip: String(pa) },
    { content: STREAK[i] },
  ],
  fixedCells: [
    { content: String(i + 1) },
    { content: TEAMS[i], leagueId: "demo", id: "demo", teamId: teamId(i) },
  ],
}));

const standingsPage = {
  ...pageTpl,
  tableList: [{ ...pageTpl.tableList[0], rows }, ...pageTpl.tableList.slice(1)],
};

const teamInfo = Object.fromEntries(TEAMS.map((name, i) => [teamId(i), { name, id: teamId(i) }]));
const half = TEAMS.length / 2;
const matchups = realInfo.scoringPeriods.slice(0, 38).map((_, p) => ({
  period: p + 1,
  matchupList: Array.from({ length: half }, (_, m) => ({
    home: { name: TEAMS[m], id: teamId(m), shortName: TEAMS[m].slice(0, 8) },
    away: { name: TEAMS[TEAMS.length - 1 - m], id: teamId(TEAMS.length - 1 - m), shortName: TEAMS[TEAMS.length - 1 - m].slice(0, 8) },
  })),
}));

const leagueInfo = { ...realInfo, leagueName: "Tim Hortons Pro League (demo)", teamInfo, matchups };

const rosters = {
  period: 3,
  rosters: Object.fromEntries(
    squads.map((squad, i) => [
      teamId(i),
      {
        teamName: TEAMS[i],
        salaryCap: 200,
        rosterItems: squad.map((s) => ({ id: s.p.fantraxId, position: s.position, status: s.status })),
      },
    ]),
  ),
};

// fxea's getStandings is a DIFFERENT payload from fxpa's, sharing a method
// name: a flat array carrying gamesBack, which the mapper joins to the page.
const standings = RECORDS.map(([w, d, l, pf], i) => ({
  teamName: TEAMS[i],
  totalPointsFor: pf,
  teamId: teamId(i),
  gamesBack: i === 0 ? 0 : Math.round(((RECORDS[0][0] - w) + (RECORDS[0][1] - d) / 2) * 2) / 2,
  rank: i + 1,
  points: `${w}-${d}-${l}`,
  winPercentage: Number((w / Math.max(1, w + d + l)).toFixed(3)),
}));

const out = { leagueInfo, standingsPage, standings, rosters };
writeFileSync(`${R}/packages/core/src/league/fantrax/demoPayloads.json`, JSON.stringify(out));
console.log("teams", TEAMS.length, "| players/squad", squads[0].length, "| pool used", playable.length);
console.log("bytes", JSON.stringify(out).length);
