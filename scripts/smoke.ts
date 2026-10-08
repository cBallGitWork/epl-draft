import {
  FANTRAX_LEAGUE_ID,
  requireLeague,
  FantraxError,
  fetchBootstrap,
  fetchFixtures,
  mapFixtures,
  fetchTeamRosters,
  mapTeamRosters,
} from "@epl/core";
import { walkLeague, type WalkLeague } from "./smoke/league";
import { serverError } from "./smoke/broken";
import { walkPaths } from "./smoke/routes";

// Walks every route against the league the server is serving, asserting the empty states for a
// league with no teams and their absence once somebody holds a player (a drafted league once rendered
// "has not drafted"). Teams with empty squads assert neither. Works before and after draft night.
//
//   npm run build && npm run start &
//   npm run smoke
//   SMOKE_BASE=https://timproleague.vercel.app npm run smoke

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";

/** What each league view says with no teams. One sentence per route, naming WHICH nothing it is, so
 *  silence, undrafted and a quiet week never collapse into one. Edit with the copy. */
const UNDRAFTED: Record<string, string> = {
  "/": "No news yet",
  "/league": "No table yet",
  "/league/matchups": "Nobody plays anybody yet",
  "/squad": "Nobody has a squad yet",
  "/matchday/desk": "The league has not drafted yet",
};

/** Every outage panel's sentence (`FANTRAX_SILENT`). Used only to explain a failure: an outage, not
 *  a broken empty state. */
const SILENT = "Fantrax is not answering";

/** The first words a failing page rendered, past the tab bar, so a CI failure says what it saw. */
function seen(body: string): string {
  const text = body
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Past the tab bar, which every page repeats and no page is identified by.
  const after = text.indexOf("FPL");
  return text.slice(after < 0 ? 0 : after + 3, (after < 0 ? 0 : after + 3) + 200).trim();
}

/** What a DRAFTED league must never print. */
const DRAFTED_MUST_NOT = Object.values(UNDRAFTED);

/** What a route must never say, whatever the league. An absence, because React splits positive copy
 *  into text nodes. `/gw/1` must render with no Fantrax at all. */
const NEVER: Record<string, string> = {
  "/gw/1": "No fixtures scheduled for this gameweek yet.",
};

/** The served league's state, or no teams when Fantrax refuses the roster read. */
async function league(): Promise<WalkLeague> {
  try {
    return walkLeague(mapTeamRosters(await fetchTeamRosters(FANTRAX_LEAGUE_ID)).teams);
  } catch (error) {
    if (error instanceof FantraxError) return walkLeague([]);
    throw error;
  }
}

/** A club code `/prem/club/[code]` resolves, read from FPL rather than written down; null if FPL will
 *  not say. */
async function clubCode(): Promise<number | null> {
  try {
    const [club] = (await fetchBootstrap()).teams;
    return club?.code ?? null;
  } catch {
    return null;
  }
}

/** A real fixture id, read from FPL for `clubCode`'s reason. */
async function matchId(): Promise<number | null> {
  try {
    return mapFixtures(await fetchFixtures())[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function main() {
  requireLeague(FANTRAX_LEAGUE_ID);
  const { state, teamId, teamName, playerId } = await league();
  const club = await clubCode();
  const match = await matchId();
  const paths = walkPaths({ teamId, playerId, club, match });

  console.log(
    `smoke — ${BASE}, league ${FANTRAX_LEAGUE_ID} (${state})\n`,
  );

  // Skipped, and SAID so: a walk that quietly drops a route still prints a full count.
  if (club === null) {
    console.log("~ /prem/club  FPL would not name a club, so this route was not walked\n");
  }

  // Is this server serving the league these expectations came from? Checked by a manager's own team
  // name on `/league`: unique to the league, and `/league` cannot render without it. (It used to look
  // for a subtitle that was later deleted, and the check failed on every run.)
  const name = teamName;
  if (name === null) {
    // Skipped, and SAID so: until the draft there is no team to check by.
    console.log("~ served league  no team is named yet, so this walk cannot verify it\n");
  } else {
    const table = await fetch(`${BASE}/league`, { redirect: "follow" });
    const body = await table.text();
    if (!body.includes(name)) {
      console.log(`✗ served league  expected "${name}" (${FANTRAX_LEAGUE_ID})`);
      console.log(
        `\n${BASE} is not serving the league this walk derived its expectations from,` +
          ` or could not read it. Every assertion below would be about the wrong app.`,
      );
      console.log(`    check FANTRAX_LEAGUE_ID on the server, not just in this shell.`);
      process.exitCode = 1;
      return;
    }
    console.log(`✓ served league  ${name}\n`);
  }

  const failures: string[] = [];

  for (const path of paths) {
    let res: Response;
    let body: string;
    try {
      res = await fetch(`${BASE}${path}`, { redirect: "follow" });
      body = await res.text();
    } catch {
      // Ends the run with the one thing wrong: the server never came up.
      console.log(`✗ ${path}  could not reach ${BASE}`);
      console.log(`\nNothing is listening on ${BASE}. Start the app first:`);
      console.log("    npm run build && npm run start &");
      process.exitCode = 2;
      return;
    }

    if (!res.ok) {
      failures.push(`${path} → ${res.status}`);
      console.log(`✗ ${path}  ${res.status}`);
      continue;
    }

    const problems: string[] = [];

    // A 200 is not a page: a server component that threw streams its error in and the browser shows the error screen.
    const thrown = serverError(body);
    if (thrown !== null) problems.push(`a server component threw (digest ${thrown}); the reader saw the error screen`);

    const named = UNDRAFTED[path];
    if (state === "no teams" && named !== undefined && !body.includes(named)) {
      problems.push(
        body.includes(SILENT)
          ? `rendered "${SILENT}" — this server could not read Fantrax, so the empty state ` +
            `was never reached. That is an outage here, not a broken empty state.`
          : `expected "${named}", and it is not an outage either. It rendered: ${seen(body)}`,
      );
    }

    if (state === "drafted") {
      for (const sentence of DRAFTED_MUST_NOT) {
        if (body.includes(sentence)) problems.push(`prints "${sentence}" for a drafted league`);
      }
    }

    const never = NEVER[path];
    if (never !== undefined && body.includes(never)) {
      problems.push(`says "${never}" on a page that needs no Fantrax`);
    }

    if (problems.length === 0) {
      console.log(`✓ ${path}`);
      continue;
    }
    for (const problem of problems) failures.push(`${path} — ${problem}`);
    console.log(`✗ ${path}`);
    for (const problem of problems) console.log(`    ${problem}`);
  }

  console.log(`\n${paths.length - failures.length}/${paths.length} routes clean.`);
  if (failures.length > 0) process.exitCode = 1;
}

// Not awaited: these scripts transpile to CJS, and a rejection should crash the run loudly.
void main();
