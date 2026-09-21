import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  clubById,
  composePaper,
  datedKickoffs,
  fetchLeagueInfo,
  firstKickoff,
  gameweekStarted,
  getFootballSnapshot,
  hasRoom,
  isCovered,
  locksAt,
  mapLeagueInfo,
  newsdesk,
  periodGameweeks,
  banned,
  roundState,
  standingHeadlines,
  strangers,
} from "@epl/core";
import { gatherRoundFacts, withFootball } from "./edition/facts";
import { file, prepare, type DeskContext } from "./edition/dispatch";
import { drawSplash } from "./edition/image";
import { CARGO, headlineAndProse, prose } from "./edition/checks";
import { markLastWeek } from "./edition/marking";
import { writeSubedited } from "./edition/subedit";
import { presserDesk } from "./edition/presserWeek";
import { readXi, xiColumn } from "./edition/xi";
import { deskState } from "./edition/desk";
import { persistFilings, readLedger, readPaperStories, type Filing } from "./edition/persist";

// The newsroom's orchestrator, run from CI on a wide cron net.
//
// **Facts are live and prose is published — and published prose accumulates.**
// Every firing asks the newsdesk what is new since the covered-keys were last
// spent, takes the top of the running order up to the cap, writes each story
// from its own scoped brief, and commits the lot — which bakes it into the
// page. The common case is a firing that finds nothing and exits.
//
// **It never commits anything it has not validated.** These commits ride
// `GITHUB_TOKEN` and so run no CI beside them, while changing what the app
// renders — so the shape checks in `edition/newsroom.ts` and
// `edition/persist.ts` are the only gate there is, and a model returning
// something unrenderable must cost us a red workflow rather than a broken
// front page.

/** Stories one firing may FILE — not model calls it may consider, and not
 *  assignments it may look at. A desk that refuses costs nothing and the next
 *  assignment takes its place (`hasRoom`, and the comment in the loop below).
 *
 *  The default stays two for a local run; CI passes ten, because the newsdesk
 *  offers a dozen assignments for a finished round and a cap of two took four
 *  firings to reach the first match report. The ledger is what makes a big cap
 *  safe: an already-covered key is never queued, so no cap can file the same
 *  story twice. */
const STORY_CAP = Number(process.env.GAZETTA_STORY_CAP ?? 2);

/** Prints the assignments and their briefs instead of writing anything. */
const DRY_RUN = process.env.DRY_RUN === "1";

async function main(): Promise<void> {
  // One instant for the whole firing. Read five times, it drifted across the
  // model call — the desk commissioning under Sunday while the byline printed
  // Monday.
  // **`GAZETTA_NOW` rehearses a dated column and nothing else sets it.** The
  // Team Sheet, the preview and the reports all key off the clock, so the only
  // way to see Friday's column on a Monday is to tell the desk it is Friday.
  // CI never sets it; an unreadable value is ignored rather than obeyed.
  const wanted = process.env.GAZETTA_NOW ?? "";
  const now = Number.isNaN(Date.parse(wanted)) ? new Date().toISOString() : new Date(wanted).toISOString();

  const snapshot = await getFootballSnapshot();
  // `roundState` and not `roundFinished`, which core deliberately does not
  // export: it cannot say "live", and half an answer is exactly the wrong shape
  // for a guard whose job is to keep a report off a round still being played.
  const state = roundState(snapshot);
  const finished = state !== null && state !== "live";

  const raw = await fetchLeagueInfo(FANTRAX_LEAGUE_ID).catch(() => null);
  if (raw === null) return say("Fantrax would not describe the league; nothing to write.");
  const info = mapLeagueInfo(raw);
  if (info.teams.length === 0) return say("No teams yet. A paper needs a league.");

  const kickoffs = datedKickoffs(snapshot.fixtures);
  const round = periodGameweeks(info.scoringPeriods, kickoffs).find((period) =>
    period.gameweeks.includes(snapshot.gameweek),
  );
  if (round === undefined) return say(`No Fantrax period covers gameweek ${snapshot.gameweek}.`);

  // The preview's window is lock-to-first-whistle, and it is a window rather
  // than an instant because a cron cannot hit an instant — GitHub's jitter
  // routinely exceeds the fifteen minutes between our lock and the kickoff. A
  // missed preview is simply not written: no column beats a false premise.
  const period = info.rosterPeriods.find((each) => each.number === round.period);
  const kickoff = period ? firstKickoff(period, kickoffs) : null;
  const lock = kickoff === null ? null : locksAt(kickoff);
  const locked = lock !== null && Date.parse(now) >= Date.parse(lock);
  const started = gameweekStarted(snapshot.fixtures, snapshot.gameweek);

  const ledger = readLedger();
  const paper = readPaperStories();
  const facts = await gatherRoundFacts(info, snapshot, round.period);
  const clubs = clubById(snapshot);
  // Clubs by FPL CODE, which is what a presser signal carries and what a crest
  // keys off — `clubById` keys by the per-season id.
  const byCode = new Map([...clubs.values()].map((club) => [club.code, club]));

  const sheet = await presserDesk({ facts, snapshot, byCode, now, lock, locked, say });
  // The elevens predict the round the pressers preview, so one clock serves both.
  const xi = readXi(sheet.gameweek);

  const assignments = newsdesk(
    deskState({
      snapshot,
      facts,
      clubs,
      period: round.period,
      finished,
      locked,
      started,
      lines: sheet.lines,
      xiGameweek: xi === null ? null : sheet.gameweek,
    }),
    (key) => isCovered(ledger, FANTRAX_LEAGUE_ID, key),
    now,
  );
  if (process.env.GAZETTA_QUEUE) return say(assignments.map((a) => a.key).join("\n"));
  if (assignments.length === 0) return say("Nothing new to report.");

  const ctx: DeskContext = {
    leagueId: FANTRAX_LEAGUE_ID,
    snapshot,
    // **The Premier League's feed is fetched HERE and not with the other reads**
    // — after the desk has said there is a column to write. It is 31 requests
    // against 11 for everything else together, the desk reads none of it, and
    // about a hundred and ten firings a week end at the line above. See
    // `withFootball`.
    facts: await withFootball(facts, snapshot, assignments),
    clubs,
    threads: ledger[FANTRAX_LEAGUE_ID]?.threads ?? [],
    info,
    table: facts.table,
    period: round.period,
    kickoff,
    marked: await markLastWeek(paper, info, round.period, assignments),
    presserLines: sheet.lines,
    presserQuotes: sheet.quotes,
    presserTies: sheet.ties,
    presserClubs: byCode,
    presserGameweek: sheet.gameweek,
    presserSpoke: sheet.spoke,
    // Composed here rather than in the loop: it is the one column with a
    // fixture read of its own, and every desk below it is synchronous.
    elevens:
      xi === null || !assignments.some((each) => each.kind === "predicted-xi")
        ? null
        : await xiColumn({
            xi,
            gameweek: sheet.gameweek,
            clubs: byCode,
            teams: facts.teams,
            players: snapshot.players,
          }),
  };

  const filings: Filing[] = [];
  // Attempts, not assignments: a desk that refuses spends nothing and is an
  // ordinary outcome, so a firing where every assignment refused must exit
  // quietly rather than red. Only a call that was actually made and failed is
  // evidence of a broken writer.
  let attempted = 0;
  for (const assignment of assignments) {
    // The cap counts STORIES FILED and not assignments considered: a refusal
    // spends no key, so slicing to the cap first wedged the paper for a period.
    if (!hasRoom(filings.length, STORY_CAP)) break;
    const desk = prepare(assignment, ctx);
    // A desk that refuses spends nothing: the facts moved between the
    // newsdesk's look and the brief's, or the kind has no desk yet.
    if (desk === null) {
      say(`No brief for ${assignment.kind} (${assignment.key}); skipped.`);
      continue;
    }
    // Printed from facts: no writer to sub-edit, no brief to check a name
    // against, and no model call to fail.
    if ("printed" in desk) {
      if (DRY_RUN) {
        console.log(`\n=== ${assignment.kind} · ${assignment.key} ===\n${JSON.stringify(desk.printed, null, 2)}`);
        continue;
      }
      const filed = file(assignment, desk.printed, ctx, now);
      filings.push({ story: filed.story, spentKeys: [assignment.key], threads: filed.threads });
      say(`Filed ${assignment.kind}: "${filed.story.headline}"`);
      continue;
    }

    // Each story is its own model call from its own brief, so nothing stops two
    // landing on the same joke. This is the page, rebuilt every turn.
    const standing = standingHeadlines(
      composePaper([...paper, ...filings.map((each) => each.story)], now)
        .filter((story) => story.leagueId === FANTRAX_LEAGUE_ID)
        .map((story) => story.headline),
    );
    const brief = standing === null ? desk.brief : `${desk.brief}\n\n${standing}`;

    if (DRY_RUN) {
      console.log(`\n=== ${assignment.kind} · ${assignment.key} ===\n${brief}`);
      continue;
    }
    // One bad story costs that story; the run fails only when EVERY attempted
    // story failed, which is the signal of a broken writer rather than a
    // brittle payload.
    attempted += 1;
    try {
      // Written and sub-edited before it is filed: `subedit.ts` reads the
      // column back against the register and sends it back once if it reached
      // for a banned phrase.
      const column = await writeSubedited(desk.system, brief, say, assignment.kind);
      const filed = file(assignment, column, ctx, now);
      // Every name in the prose against every name in the brief. Eager, so it
      // warns rather than refuses — see `gazette/strangers.ts`.
      const unknown = strangers(prose(filed.story), brief);
      if (unknown.length > 0) {
        say(`  ⚠ ${assignment.kind} names ${unknown.length} not in its brief: ${unknown.join(", ")}`);
      }
      // The backstop, and it reads more than the sub-editor did: the FILED
      // story, cargo included. It files anyway and says so loudly.
      const printed = banned(headlineAndProse(filed.story));
      if (printed.length > 0) {
        say(`  ⚠ ${assignment.kind} STILL prints banned phrasing after a rewrite: ${printed.join(", ")}`);
      }
      // Every reader of `extras` treats absence as ordinary, so nothing
      // downstream can tell a column that lost its cargo from one that has none.
      const missing = CARGO[assignment.kind];
      if (missing !== undefined && (filed.story.extras?.[missing] ?? []).length === 0) {
        say(`  ⚠ ${assignment.kind} filed with no "${missing}" — the column's substance is missing.`);
      }
      filings.push({ story: filed.story, spentKeys: [assignment.key], threads: filed.threads });
      say(`Filed ${assignment.kind}: "${filed.story.headline}"`);
    } catch (error) {
      console.error(`${assignment.kind} (${assignment.key}) failed:`, error);
    }
  }
  if (DRY_RUN) {
    console.log("\n--- dry run: nothing written ---");
    return;
  }
  if (filings.length === 0) {
    if (attempted === 0) return say("Every desk refused on today's facts; nothing to file.");
    throw new Error(`All ${attempted} attempted stories failed; nothing filed.`);
  }

  // The picture, last and optional, and only for this firing's lead. Any
  // failure costs the picture and never the paper.
  const lead = composePaper(
    [...readPaperStories().filter((each) => each.leagueId === FANTRAX_LEAGUE_ID), ...filings.map((f) => f.story)],
    now,
  )[0];
  const filing = filings.find((each) => each.story.slug === lead?.slug);
  if (filing !== undefined && filing.story.image === null) {
    const image = await drawSplash(filing.story);
    if (image !== null) filing.story = { ...filing.story, image };
  }

  persistFilings(filings, ledger, now);
}


function say(message: string): void {
  console.log(message);
}

main().catch((error: unknown) => {
  console.error(error instanceof FantraxError ? `${error.code}: ${error.message}` : error);
  process.exit(1);
});
