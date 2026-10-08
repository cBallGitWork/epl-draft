import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { FANTRAX_SETUP_PAGE, politeFetch } from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { LEAGUE_LIMITS } from "./paths";

// The one roster rule Fantrax will not answer for in JSON: the FEWEST players a
// lineup may start at each position.
//
// `getLeagueInfo.rosterInfo.positionConstraints` carries `maxActive` and nothing
// else — 0 matches for `minActive` across all three leagues, live and in every
// snapshot we hold, and `getLeagueSetup` (which exists, and needs the cookie) is
// step one of the wizard and carries the league's name rather than its roster.
// The numbers live on the commissioner's own setup page, in the HTML, as
// arguments to a function that builds the table:
//
//   addPosition('703', 'D', 'Defender', 'SOCCER_NON_GOALIE', '3','5','5', …)
//
// So this is a scrape and it says so. It is a script and not an adapter for that
// reason: `packages/core` reads providers that answer in JSON, and a regex over
// somebody's markup is exactly the kind of thing that must be run by a person,
// audited, and checked in as data (CODE_RULES §3) rather than executed on a
// request.
//
//   node --env-file=.env.local --experimental-strip-types scripts/roster-limits.ts
//
// It needs `FANTRAX_COOKIE`, which is the commissioner's own session. Nothing
// the app serves reads that cookie; the app reads the file this writes.

const OUT = join(LEAGUE_LIMITS, "roster-limits.json");

/** One row of the position table, in the order `addPosition` takes them. */
interface Position {
  shortName: string;
  name: string;
  minActive: number;
  maxActive: number;
  /** How many of that position a roster may HOLD, which is not how many may
   *  start. Read because the page publishes it and a squad screen will want it;
   *  nothing reads it yet. */
  maxTotal: number | null;
}

/** The calls the page makes to build its own table.
 *
 *  Matched on the literal argument list rather than parsed as JavaScript: the
 *  arguments are all string literals and the shape has not moved, so a regex is
 *  honest here and a parser would be a dependency for one caller (§2). A row
 *  that does not match the shape is skipped and counted, so a page that changes
 *  under us shows up as a short table rather than as wrong numbers.
 *
 *  The declaration and the template row are skipped by the same rule: the first
 *  names its parameters and the last passes `true` for `isNew`. */
function positionsFrom(html: string): Position[] {
  const call =
    /addPosition\(\s*'(\d+)',\s*'([^']*)',\s*'([^']*)',\s*'[^']*',\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'(\d*)'/g;
  const found: Position[] = [];
  for (const [, , shortName, name, min, max, total] of html.matchAll(call)) {
    found.push({
      shortName,
      name,
      minActive: Number(min),
      maxActive: Number(max),
      maxTotal: total === "" ? null : Number(total),
    });
  }
  return found;
}

/** Whether the commissioner switched the Min Active column ON.
 *
 *  It is a checkbox, and a league with it off has a minimum of nought at every
 *  position whatever the boxes say — so reading the numbers without reading this
 *  would enforce a floor the commissioner had turned off. */
function minimumsInForce(html: string): boolean {
  return /id="chkMinActivePerPositionUsed"[^>]*checked="checked"/.test(html);
}

/** All three, keyed by league id, so a league swap is a config change and not
 *  another run of this. The real league answers even with no teams in it: this
 *  is the commissioner's settings page, and settings exist before members do. */
async function main(): Promise<void> {
  const cookie = process.env.FANTRAX_COOKIE;
  if (!cookie) throw new Error("FANTRAX_COOKIE is not set — this page needs the commissioner's session");

  const byLeague: Record<string, unknown> = {};
  for (const league of RECORDED_LEAGUES) {
    const page = await politeFetch(`${FANTRAX_SETUP_PAGE}?goto=3&leagueId=${league.leagueId}`, {
      headers: { cookie },
    });
    if (!page.ok) throw new Error(`${league.key}: setup page answered ${page.status}`);
    const html = await page.text();

    const positions = positionsFrom(html);
    if (positions.length === 0) {
      // **Not an error, and the real league is why.** Its setup page carries no
      // position table until it has members — PLATFORM_NOTES records the same
      // league refusing `getTeamRosterInfo` with *"You cannot use this screen
      // until there is at least one team in this league"*. Recorded as
      // unreadable, with the date, so the file says which leagues it actually
      // knows about rather than quietly holding two of three.
      byLeague[league.leagueId] = { key: league.key, unreadable: "no position table on the page" };
      console.log(`${league.key} (${league.leagueId}) — no position table; re-run after the draft`);
      continue;
    }
    const enforced = minimumsInForce(html);
    byLeague[league.leagueId] = { key: league.key, minimumsInForce: enforced, positions };

    console.log(`${league.key} (${league.leagueId}) — minimums ${enforced ? "ON" : "OFF"}`);
    for (const p of positions) {
      console.log(
        `  ${p.shortName.padEnd(3)} min ${p.minActive}  max ${p.maxActive}  total ${p.maxTotal ?? "—"}`,
      );
    }
  }

  // Every league unreadable means the cookie is stale, not that three leagues
  // simultaneously lost their settings.
  if (Object.values(byLeague).every((l) => (l as { unreadable?: string }).unreadable)) {
    throw new Error("no league had a position table — the commissioner's cookie is stale");
  }

  const written = {
    // This IS the edge, so a clock is allowed here; the file's whole value is
    // knowing how old it is, because nothing re-reads the page on a request.
    fetchedAt: new Date().toISOString(),
    source: `${FANTRAX_SETUP_PAGE}?goto=3 — scraped, because no Fantrax JSON endpoint carries a position minimum`,
    leagues: byLeague,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(written, null, 2)}\n`);
  console.log(`written to ${OUT}`);
}

void main();
