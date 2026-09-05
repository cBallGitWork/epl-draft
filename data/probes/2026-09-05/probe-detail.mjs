const BASE = "https://footballapi.pulselive.com/football";
// The app's own User-Agent (core config's HTTP_USER_AGENT). Without it their
// edge answers 200 with an empty body after a handful of requests.
const H = {
  Origin: "https://www.premierleague.com",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Politely, and with a retry: thirty detail reads back to back gets an empty
// body from their edge. `politeFetch` in core does the same for the app.
const get = async (p, tries = 3) => {
  for (let i = 0; i < tries; i += 1) {
    await sleep(600);
    try {
      const r = await fetch(BASE + p, { headers: H });
      if (!r.ok) throw new Error(`${p} -> ${r.status}`);
      const text = await r.text();
      if (!text) throw new Error(`${p} -> empty body`);
      return JSON.parse(text);
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500);
    }
  }
};

const gws = [1, 2, 3];
const fixtures = [];
for (const gw of gws) {
  const page = await get(`/fixtures?comps=1&compSeasons=841&gameweekNumbers=${gw}&pageSize=20&page=0&sort=asc&altIds=true`);
  for (const f of page.content) fixtures.push({ gw, id: f.id, status: f.status, kickoff: f.kickoff?.millis });
}
console.log(`fixtures: ${fixtures.length} across GW${gws.join(",")}`);

const count = {};
const bump = (k, ok) => { count[k] ??= { yes: 0, no: 0 }; count[k][ok ? "yes" : "no"] += 1; };
const positions = {}; const formations = new Set();
let nullSides = 0, sheetSides = 0, lineupLens = new Set(), subLens = new Set(), shirtYes = 0, shirtTot = 0;
let formationRows = new Set(), keeperFirst = { yes: 0, no: 0 };

for (const f of fixtures) {
  const d = await get(`/fixtures/${f.id}`);
  bump("ground.name", !!d.ground?.name);
  bump("ground.city", !!d.ground?.city);
  bump("attendance", d.attendance !== undefined && d.attendance !== null);
  bump("matchOfficials", Array.isArray(d.matchOfficials) && d.matchOfficials.length > 0);
  bump("halfTimeScore", !!d.halfTimeScore);
  bump("teamLists", Array.isArray(d.teamLists) && d.teamLists.length > 0);
  bump("events", Array.isArray(d.events) && d.events.length > 0);
  if (d.matchOfficials?.length) {
    const roles = d.matchOfficials.map(o => o.role);
    bump("matchOfficials.MAIN", roles.includes("MAIN"));
  }
  for (const list of d.teamLists ?? []) {
    // **A null ENTRY inside the array**, which is not the same as an absent
    // array — counted, because a mapper indexing [0] and [1] would crash.
    if (list === null || list === undefined) { nullSides += 1; continue; }
    sheetSides += 1;
    lineupLens.add(list.lineup?.length);
    subLens.add(list.substitutes?.length);
    if (list.formation?.label) formations.add(list.formation.label);
    if (Array.isArray(list.formation?.players)) {
      formationRows.add(list.formation.players.length);
      const first = list.formation.players[0];
      const gk = (list.lineup ?? []).find(p => p.matchPosition === "G");
      const firstIsKeeper = Array.isArray(first) && first.length === 1 && gk && first[0] === gk.id;
      keeperFirst[firstIsKeeper ? "yes" : "no"] += 1;
    }
    for (const p of [...(list.lineup ?? []), ...(list.substitutes ?? [])]) {
      shirtTot += 1;
      if (p.matchShirtNumber !== undefined && p.matchShirtNumber !== null) shirtYes += 1;
      if (p.matchPosition) positions[p.matchPosition] = (positions[p.matchPosition] ?? 0) + 1;
    }
  }
}
console.log("\n== detail read, per fixture ==");
for (const [k, v] of Object.entries(count)) console.log(`  ${k.padEnd(22)} ${v.yes}/${v.yes + v.no}`);
console.log("\n== team sheets ==");
console.log(`  sides with a sheet:  ${sheetSides}`);
console.log(`  NULL entries in teamLists: ${nullSides}`);
console.log(`  lineup lengths:      ${[...lineupLens].join(",")}`);
console.log(`  substitute lengths:  ${[...subLens].join(",")}`);
console.log(`  matchShirtNumber:    ${shirtYes}/${shirtTot}`);
console.log(`  matchPosition:       ${JSON.stringify(positions)}`);
console.log(`  formation labels:    ${[...formations].sort().join(" ")}`);
console.log(`  formation.players rows per side: ${[...formationRows].join(",")}`);
console.log(`  first row is the keeper: ${keeperFirst.yes}/${keeperFirst.yes + keeperFirst.no}`);
