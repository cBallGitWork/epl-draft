import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { FANTRAX_SETUP_PAGE, politeFetch } from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { LEAGUE_LIMITS } from "./paths";

// The fewest players a lineup may start at each position, which no Fantrax JSON carries (`positionConstraints` has
// only `maxActive`): scraped off the commissioner's setup page, where each row is an `addPosition('703', 'D', …)`
// call, and checked in as data. Needs FANTRAX_COOKIE, the commissioner's session; the app reads only the file.

const OUT = join(LEAGUE_LIMITS, "roster-limits.json");

/** One row of the position table, in the order `addPosition` takes them. */
interface Position {
  shortName: string;
  name: string;
  minActive: number;
  maxActive: number;
  /** How many of that position a roster may hold, which is not how many may start. */
  maxTotal: number | null;
}

/** The rows the page's own `addPosition` calls build, matched on their string-literal arguments. A row of another
 *  shape (the declaration, the template) is skipped, so a changed page reads as a short table, never wrong numbers. */
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

/** Whether the commissioner switched Min Active on: off, every minimum is nought whatever the boxes say. */
function minimumsInForce(html: string): boolean {
  return /id="chkMinActivePerPositionUsed"[^>]*checked="checked"/.test(html);
}

/** Every recorded league, keyed by league id, so a league swap is a config change and not another run of this. */
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
      // A league with no members has no table yet: recorded as unreadable, so the file says which leagues it knows.
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

  // Every league unreadable means the cookie is stale, not that they all lost their settings at once.
  if (Object.values(byLeague).every((l) => (l as { unreadable?: string }).unreadable)) {
    throw new Error("no league had a position table — the commissioner's cookie is stale");
  }

  const written = {
    // Nothing re-reads the page on a request, so the file must say how old it is.
    fetchedAt: new Date().toISOString(),
    source: `${FANTRAX_SETUP_PAGE}?goto=3 — scraped, because no Fantrax JSON endpoint carries a position minimum`,
    leagues: byLeague,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(written, null, 2)}\n`);
  console.log(`written to ${OUT}`);
}

void main();
