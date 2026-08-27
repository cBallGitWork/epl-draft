import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  fetchLeagueInfo,
  fetchTeamRosters,
  mapLeagueInfo,
  mapTeamRosters,
} from "@epl/core";

// Does every view survive the league it is actually being served?
//
// ROADMAP §6: our real league answers `NO_TEAMS`, `[]` and `{}` to almost
// everything until 10 Oct, and those empty states have been walked by hand
// exactly twice. This walks them on every push, which is the difference between
// "it worked in August" and "it works".
//
// It asks Fantrax whether the served league has teams and then asserts the
// matching half, so the same command is useful against both leagues and needs no
// editing on draft night — it simply starts asserting the other half.
//
// **The inverse check is the one worth having.** A drafted league that renders
// "nobody has drafted" is a bug this repo has already shipped once: `edition.ts`
// collapsed an outage into an undrafted league, and a drafted league having a
// quiet week was told it had not drafted. Asserting only the empty states would
// have passed that happily.
//
//   npm run build && npm run start &
//   npm run smoke
//
//   SMOKE_BASE=https://epl-draft-companion.vercel.app npm run smoke

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";

/** Every route the app serves that needs no id. */
const ROUTES = [
  "/",
  "/league",
  "/league/schedule",
  "/league/matchups",
  "/squad",
  "/players",
  "/matchday",
  "/matchday/desk",
  "/gw/1",
  "/fpl",
] as const;

/** What a league-scoped view must say when there is nothing to show.
 *
 *  One fragment per route, and they are deliberately the sentences that name
 *  *which* nothing it is. Three states — Fantrax silent, nobody drafted, a quiet
 *  week — must never collapse into one, and a check that only asserted "200" is
 *  a check that would let them.
 *
 *  These are copy, and copy moves. That is the intended cost: this list is
 *  edited in the same commit as the sentence, exactly as `docs/ui/` is. */
const UNDRAFTED: Record<string, string> = {
  "/": "No news yet",
  "/league": "No table yet",
  "/league/matchups": "Nobody plays anybody yet",
  "/squad": "Nobody has a squad yet",
  "/matchday/desk": "nothing to post",
};

/** The one sentence every outage panel prints, wherever it is — `FANTRAX_SILENT`
 *  in `apps/companion/app/config.ts`.
 *
 *  Not asserted, only used to EXPLAIN a failure. "Does not say which nothing it
 *  is" was a true report that named the wrong suspect: the three states this
 *  file exists to keep apart look identical through a `body.includes` check, so
 *  a walk that found the wrong one could not say which wrong one it found. On
 *  its first ever run in CI that cost an evening — the empty states were right
 *  and the server had simply not been able to read Fantrax, which is a different
 *  problem with a different fix. */
const SILENT = "Fantrax is not answering";

/** The first words a failing page actually rendered.
 *
 *  Crude on purpose — tags out, whitespace collapsed, the shell's own chrome
 *  skipped — because its whole job is to end an argument. A gate that says an
 *  assertion failed and cannot say what it saw instead sends somebody to
 *  reproduce it, and this one could not be reproduced anywhere but in CI.
 *
 *  Only ever printed for a league Fantrax says has no teams, so there is no
 *  lineup in it to leak. */
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

/** Sentences a league WITH teams must never print. The inverse of the above, and
 *  the half that catches the failure that has actually happened here. */
const DRAFTED_MUST_NOT = Object.values(UNDRAFTED);

/** What a route must NOT say whatever the league is doing.
 *
 *  Stated as an absence rather than a presence, and that is not squeamishness:
 *  a positive check on rendered copy has to survive React splitting
 *  `Gameweek {n}` into three text nodes, and an empty state is one fixed string
 *  that is either there or is not. It also asks the better question — "did the
 *  football fail to render", rather than "did one particular word appear".
 *
 *  `/gw/[gameweek]` is the claim `docs/ui/` makes loudest: it works from the
 *  first match of the season with no Fantrax, no draft and no credentials. Our
 *  real league is the only place that claim can actually be tested. */
const NEVER: Record<string, string> = {
  "/gw/1": "No fixtures scheduled for this gameweek yet.",
};

/** The name Fantrax gives the league this walk is deriving its expectations
 *  from, or null if it will not say.
 *
 *  The schedule prints it verbatim as the section's subtitle, which is what
 *  makes it checkable from out here without the app growing an endpoint. */
async function expectedName(): Promise<string | null> {
  try {
    return mapLeagueInfo(await fetchLeagueInfo(FANTRAX_LEAGUE_ID)).name || null;
  } catch (error) {
    if (error instanceof FantraxError) return null;
    throw error;
  }
}

async function drafted(): Promise<boolean> {
  try {
    return mapTeamRosters(await fetchTeamRosters(FANTRAX_LEAGUE_ID)).teams.length > 0;
  } catch (error) {
    if (error instanceof FantraxError) return false;
    throw error;
  }
}

async function teamId(): Promise<string | null> {
  try {
    const [team] = mapTeamRosters(await fetchTeamRosters(FANTRAX_LEAGUE_ID)).teams;
    return team?.teamId ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const hasTeams = await drafted();
  const id = hasTeams ? await teamId() : null;
  const paths: string[] = [...ROUTES];
  // The three biggest screens in the app take an id, so a walk that skipped them
  // would be a walk that missed the squad board and the head-to-head.
  if (id !== null) paths.push(`/squad/${id}`, `/league/matchups/${id}`);

  console.log(
    `smoke — ${BASE}, league ${FANTRAX_LEAGUE_ID} (${hasTeams ? "drafted" : "no teams"})\n`,
  );

  // **Is this server even serving the league these expectations came from?**
  //
  // Everything below reads `FANTRAX_LEAGUE_ID` out of THIS process and asserts
  // against a server that read it out of its own. Nothing made those agree, and
  // when they disagree every assertion below is answering a question nobody
  // asked: the walk reports that the empty states are broken when what actually
  // happened is that it was pointed at the wrong app. On this file's first ever
  // CI run that cost an evening, and the walk could not say so because it had
  // never been able to see which league the server had.
  //
  // Checked, not assumed, and checked against the one page that prints the
  // league's own name — which is also the read the 10 Oct swap turns.
  const name = await expectedName();
  if (name === null) {
    // Skipped, and SAID so. A check that quietly does not run is the shape of
    // defect this whole gate exists to catch: the walk below would go green
    // having never established which app it was walking. Not fatal — Fantrax
    // refusing is a state, and the routes are still worth walking — but the
    // report must not imply a check that did not happen.
    console.log("~ served league  Fantrax would not name it, so this walk cannot verify it\n");
  } else {
    const schedule = await fetch(`${BASE}/league/schedule`, { redirect: "follow" });
    const body = await schedule.text();
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
      // Not swallowed into a default: this ends the run and says the one thing
      // that is actually wrong. A CI reader who gets a raw ECONNREFUSED stack
      // has to work out that the server never came up, and they will work it
      // out slowly, at the worst possible moment.
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

    const named = UNDRAFTED[path];
    if (!hasTeams && named !== undefined && !body.includes(named)) {
      problems.push(
        body.includes(SILENT)
          ? `rendered "${SILENT}" — this server could not read Fantrax, so the empty state ` +
            `was never reached. That is an outage here, not a broken empty state.`
          : `expected "${named}", and it is not an outage either. It rendered: ${seen(body)}`,
      );
    }

    if (hasTeams) {
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

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
