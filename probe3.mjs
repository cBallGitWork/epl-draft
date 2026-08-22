import { readFileSync } from "fs";
const env = readFileSync("/Users/craigball/epl-draft-1/.env.local", "utf8");
const cookie = env.match(/^FANTRAX_COOKIE=(.*)$/m)?.[1]?.trim();
const league = "zbn1z3ukmsgb36sz";
const other = "j9zadacnmshcpazf";
async function ask(method, data = {}) {
  const res = await fetch(`https://www.fantrax.com/fxpa/req?leagueId=${league}`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ msgs: [{ method, data: { leagueId: league, ...data } }] }),
  });
  return res.json();
}
const r = await ask("getTeamRosterInfo", { teamId: other, view: "EDIT" });
const d = r?.responses?.[0]?.data;
console.log("myTeamIds:", JSON.stringify(d?.miscData?.myTeamIds ?? d?.myTeamIds));
console.log("miscData keys:", Object.keys(d?.miscData ?? {}).join(", "));
console.log("miscData:", JSON.stringify(d?.miscData ?? {}).slice(0, 400));
console.log("\nrosterLimitPeriod-ish:", JSON.stringify(d?.displayedSelections ?? {}).slice(0, 300));
