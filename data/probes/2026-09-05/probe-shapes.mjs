const BASE = "https://footballapi.pulselive.com/football";
const H = { Origin: "https://www.premierleague.com", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { await sleep(600); const r = await fetch(BASE + p, { headers: H }); const t = await r.text(); if (!r.ok || !t) throw new Error(`${p} -> ${r.status}`); return JSON.parse(t); };

const d = await get("/fixtures/128949");
console.log("== matchOfficials ==");
for (const o of d.matchOfficials) console.log("  " + JSON.stringify(o));
console.log("\n== ground ==");
console.log("  " + JSON.stringify(d.ground));
console.log("\n== one team sheet, trimmed ==");
const list = d.teamLists[0];
console.log("  keys:", Object.keys(list).join(","));
console.log("  formation:", JSON.stringify(list.formation));
console.log("  lineup[0]:", JSON.stringify(list.lineup[0]));
console.log("  substitutes[0]:", JSON.stringify(list.substitutes[0]));
console.log("  captain fields on lineup:", JSON.stringify([...new Set(list.lineup.flatMap(p => Object.keys(p)))]));

// The VAR-cancelled goal: how many in GW1-3, and what the textstream calls them.
console.log("\n== event types across GW1-3 textstreams ==");
const types = {};
let streams = 0;
for (const gw of [1, 2, 3]) {
  const page = await get(`/fixtures?comps=1&compSeasons=841&gameweekNumbers=${gw}&pageSize=20&page=0&sort=asc&altIds=true`);
  for (const f of page.content) {
    if (f.status === "U") continue;
    const s = await get(`/fixtures/${f.id}/textstream/EN?pageSize=250&sort=asc`);
    streams += 1;
    for (const e of s.events?.content ?? []) types[e.type] = (types[e.type] ?? 0) + 1;
  }
}
console.log(`  ${streams} streams read`);
for (const [k, v] of Object.entries(types).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
