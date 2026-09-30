import {
  EDITION_BUDGET_MS,
  FANTRAX_LEAGUE_ID,
  requireLeague,
  FantraxError,
  clubById,
  composePaper,
  datedKickoffs,
  fetchFixtures,
  fetchLeagueInfo,
  firstKickoff,
  gameweekStarted,
  getFootballSnapshot,
  isCovered,
  locksAt,
  mapFixtures,
  mapLeagueInfo,
  newsdesk,
  nextDeadline,
  openingGameweek,
  periodGameweeks,
  banned,
  REPORT_NEVER,
  roundState,
  standingHeadlines,
  strangers,
  type PublishedStory,
} from "@epl/core";
import { gatherRoundFacts } from "./edition/facts";
import { file, type DeskContext } from "./edition/dispatch";
import { prepare } from "./edition/commission";
import { drawSplash } from "./edition/image";
import { CARGO, headlineAndProse, prose } from "./edition/checks";
import { writeSubedited } from "./edition/subedit";
import { writeLawro } from "./edition/lawroWriter";
import { writeSheets } from "./edition/sheetsWriter";
import { reportsColumn } from "./edition/reportsWriter";
import { presserDesk } from "./edition/presserWeek";
import { readXi } from "./edition/xi";
import { deskState } from "./edition/desk";
import { deskContext } from "./edition/context";
import { fire, type Run } from "./edition/firing";
import { printStory, readLedger, readPaperStories, saveFiling } from "./edition/persist";

// The newsroom's orchestrator, run from CI on a wide cron net.
//
// **Facts are live and prose is published — and published prose accumulates.**
// Every firing asks the newsdesk what is new since the covered-keys were last
// spent, takes the top of the running order up to the cap, writes each story
// from its own scoped brief and saves it before the next, and CI commits the
// lot — which bakes it into the page. The common case is a firing that finds
// nothing and exits.
//
// **It never commits anything it has not validated.** These commits ride
// `GITHUB_TOKEN` and so run no CI beside them, while changing what the app
// renders — so the shape checks in `edition/newsroom.ts` and
// `edition/persist.ts` are the only gate there is, and a model returning
// something unrenderable must cost us a red workflow rather than a broken
// front page.

/** Stories one firing may FILE — not model calls it may consider, and not
 *  assignments it may look at. A desk that refuses costs nothing and the next
 *  assignment takes its place (`hasRoom`, in `edition/firing.ts`).
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
  requireLeague(FANTRAX_LEAGUE_ID);

  // One instant for the whole firing. Read five times, it drifted across the
  // model call — the desk commissioning under Sunday while the byline printed
  // Monday.
  // `GAZETTA_NOW` rehearses a dated column (Friday's, on a Monday); CI never sets it, and an unreadable value is ignored.
  const wanted = process.env.GAZETTA_NOW ?? "";
  const now = Number.isNaN(Date.parse(wanted)) ? new Date().toISOString() : new Date(wanted).toISOString();

  // A past gameweek, for a local rehearsal of a firing (never CI); GAZETTA_ONLY keeps one kind.
  const pinned = Number(process.env.GAZETTA_GAMEWEEK ?? "");
  if (Number.isInteger(pinned) && pinned > 0 && process.env.CI) throw new Error("GAZETTA_GAMEWEEK is a local rehearsal and never runs in CI.");
  const snapshot = await getFootballSnapshot(Number.isInteger(pinned) && pinned > 0 ? pinned : undefined);
  // `roundState` and not `roundFinished`, which core deliberately does not
  // export: it cannot say "live", and half an answer is exactly the wrong shape
  // for a guard whose job is to keep a report off a round still being played.
  const state = roundState(snapshot);
  const finished = state !== null && state !== "live";

  const raw = await fetchLeagueInfo(FANTRAX_LEAGUE_ID).catch(() => null);
  if (raw === null) return say("Fantrax would not describe the league; nothing to write.");
  const info = mapLeagueInfo(raw);
  if (info.teams.length === 0) return say("No teams yet. A paper needs a league.");

  // The whole season's kickoffs: the snapshot holds one round, so it cannot place the next.
  const season = await fetchFixtures().then(mapFixtures).catch(() => snapshot.fixtures);
  const kickoffs = datedKickoffs(season);
  const calendar = periodGameweeks(info.scoringPeriods, kickoffs);
  const round = calendar.find((period) => period.gameweeks.includes(snapshot.gameweek));
  const deadline = nextDeadline(info.rosterPeriods, kickoffs, now);
  const nextRound = openingGameweek(calendar, deadline?.period);
  if (round === undefined) return say(`No Fantrax period covers gameweek ${snapshot.gameweek}.`);

  // When this round locks, and whether it has: the pressers' desk reads both.
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

  const sheet = presserDesk({ facts, snapshot, byCode, now, lock, locked, season, say });
  // The elevens predict the round the pressers preview, so one clock serves both.
  const xi = readXi(sheet.gameweek);
  const ahead = calendar.find((each) => each.gameweeks.includes(sheet.gameweek));

  const only = process.env.GAZETTA_ONLY ?? "";
  const assignments = newsdesk(
    deskState({
      snapshot,
      facts,
      clubs,
      period: round.period,
      finished,
      started,
      locked,
      lines: sheet.lines,
      xiGameweek: xi === null ? null : sheet.gameweek,
      ahead: ahead === undefined ? null : { period: ahead.period, gameweek: sheet.gameweek },
      next: deadline === null || nextRound === undefined ? null : { period: deadline.period, gameweek: nextRound, locksAt: deadline.locksAt },
    }),
    (key) => isCovered(ledger, FANTRAX_LEAGUE_ID, key),
    now,
  ).filter((assignment) => only === "" || assignment.kind === only);
  if (process.env.GAZETTA_QUEUE) return say(assignments.map((a) => a.key).join("\n"));
  if (assignments.length === 0) return say("Nothing new to report.");

  const ctx = await deskContext({ snapshot, facts, clubs, byCode, info, period: round.period, gameweeks: round.gameweeks, ledger, sheet, xi, season, kickoffs, assignments, now, say });

  const { filings, failed } = await fire(assignments, ledger, {
    cap: STORY_CAP,
    budgetMs: EDITION_BUDGET_MS,
    // Real time since the process began, never `now`, which GAZETTA_NOW may set to another day.
    elapsed: () => performance.now(),
    commission: commissioner(ctx, paper, now),
    save: (filed, book) => saveFiling(paper, filed, book, now),
    say,
  });
  if (DRY_RUN) {
    console.log("\n--- dry run: nothing written ---");
    return;
  }
  // A refusal is ordinary; a firing where every call made failed is a broken writer.
  if (filings.length === 0) {
    if (failed === 0) return say("Every desk refused on today's facts; nothing to file.");
    throw new Error(`All ${failed} attempted stories failed; nothing filed.`);
  }

  // The lead's picture, last and optional: every story is already saved, so a failure costs only the picture.
  const lead = composePaper(
    [...paper.filter((each) => each.leagueId === FANTRAX_LEAGUE_ID), ...filings.map((f) => f.story)],
    now,
  )[0];
  const filing = filings.find((each) => each.story.slug === lead?.slug);
  // A columnist's own column runs his photograph, never a drawing over it.
  if (filing !== undefined && filing.story.image === null && filing.story.reporter === undefined) {
    const image = await drawSplash(filing.story);
    if (image !== null) {
      filing.story = { ...filing.story, image };
      printStory(paper, filings, filing.story, now);
    }
  }
}

/** One assignment briefed, written, checked and filed; `paper` is the page as the firing found it. */
function commissioner(ctx: DeskContext, paper: readonly PublishedStory[], now: string): Run["commission"] {
  return async (assignment, earlier) => {
    const desk = prepare(assignment, ctx);
    // A refusal spends nothing: the facts moved since the newsdesk looked, or the kind has no desk yet.
    if (desk === null) {
      say(`No brief for ${assignment.kind} (${assignment.key}); skipped.`);
      return null;
    }
    // Printed from facts: no writer, no brief to check a name against, no model call to fail.
    if ("printed" in desk) {
      if (DRY_RUN) {
        console.log(`\n=== ${assignment.kind} · ${assignment.key} ===\n${JSON.stringify(desk.printed, null, 2)}`);
        return null;
      }
      const filed = file(assignment, desk.printed, ctx, now);
      say(`Filed ${assignment.kind}: "${filed.story.headline}"`);
      return { story: filed.story, spentKeys: [assignment.key], threads: filed.threads };
    }

    // Each story is its own call from its own brief, so the page so far rides along against a repeated joke.
    const standing = standingHeadlines(
      composePaper([...paper, ...earlier.map((each) => each.story)], now)
        .filter((story) => story.leagueId === FANTRAX_LEAGUE_ID)
        .map((story) => story.headline),
    );
    const brief = standing === null ? desk.brief : `${desk.brief}\n\n${standing}`;

    if (DRY_RUN) {
      console.log(`\n=== ${assignment.kind} · ${assignment.key} ===\n${brief}`);
      return null;
    }
    // One bad story costs that story; the firing fails only when every call it made failed.
    try {
      // Sub-edited before it is filed: a banned phrase sends the column back once (`subedit.ts`).
      const column =
        desk.reports !== undefined
          ? await reportsColumn(desk.reports, say)
          : desk.sheets !== undefined
          ? await writeSheets(desk.sheets, brief, say)
          : desk.lawro === undefined
            ? await writeSubedited(desk.system, brief, say, assignment.kind)
            : await writeLawro(desk.lawro, brief, desk.brief, say);
      const filed = file(assignment, column, ctx, now);
      // Every name in the prose against every name in the brief; it warns rather than refuses.
      const unknown = strangers(prose(filed.story), brief);
      if (unknown.length > 0) {
        say(`  ⚠ ${assignment.kind} names ${unknown.length} not in its brief: ${unknown.join(", ")}`);
      }
      // The backstop reads the FILED story, cargo included, and files anyway, loudly.
      const printed = banned(headlineAndProse(filed.story));
      if (printed.length > 0) {
        say(`  ⚠ ${assignment.kind} STILL prints banned phrasing after a rewrite: ${printed.join(", ")}`);
      }
      // Every reader of `extras` treats absence as ordinary, so a lost cargo is only ever caught here.
      const missing = CARGO[assignment.kind];
      if (missing !== undefined && (filed.story.extras?.[missing] ?? []).length === 0) {
        say(`  ⚠ ${assignment.kind} filed with no "${missing}" — the column's substance is missing.`);
      }
      say(`Filed ${assignment.kind}: "${filed.story.headline}"`);
      return { story: filed.story, spentKeys: [assignment.key], threads: filed.threads };
    } catch (error) {
      console.error(`${assignment.kind} (${assignment.key}) failed:`, error);
      return "failed";
    }
  };
}


function say(message: string): void {
  console.log(message);
}

main().catch((error: unknown) => {
  console.error(error instanceof FantraxError ? `${error.code}: ${error.message}` : error);
  process.exit(1);
});
