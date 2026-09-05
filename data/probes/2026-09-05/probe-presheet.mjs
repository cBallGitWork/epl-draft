const BASE = "https://footballapi.pulselive.com/football";
const H = { Origin: "https://www.premierleague.com", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { await sleep(600); const r = await fetch(BASE + p, { headers: H }); const t = await r.text(); if (!r.ok || !t) throw new Error(`${p} -> ${r.status}`); return JSON.parse(t); };

const now = Date.now();
console.log("now:", new Date(now).toISOString());

// Every fixture in GW3 and GW4, with how far off kickoff is and whether a sheet
// is published. This is the "do sheets land ~1h out" question, asked of whatever
// the calendar happens to be offering.
for (const gw of [3, 4]) {
  const page = await get(`/fixtures?comps=1&compSeasons=841&gameweekNumbers=${gw}&pageSize=20&page=0&sort=asc&altIds=true`);
  for (const f of page.content) {
    const mins = f.kickoff?.millis ? Math.round((f.kickoff.millis - now) / 60000) : null;
    const d = await get(`/fixtures/${f.id}`);
    const lists = d.teamLists ?? [];
    const real = lists.filter((l) => l !== null && l !== undefined);
    const sides = f.teams.map((t) => t.team.club?.abbr ?? t.team.shortName).join(" v ");
    console.log(
      `GW${gw} ${String(f.id).padEnd(7)} ${sides.padEnd(22)} status=${f.status} phase=${f.phase} ` +
      `kickoff ${mins === null ? "?" : (mins >= 0 ? `in ${mins}m` : `${-mins}m ago`)}  ` +
      `teamLists=${lists.length} real=${real.length} ` +
      `officials=${(d.matchOfficials ?? []).length} attendance=${d.attendance ?? "-"}`,
    );
  }
}
