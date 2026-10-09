import { readFileSync } from "node:fs";
import {
  EDITION_BUDGET_MS,
  FANTRAX_LEAGUE_ID,
  requireLeague,
  FantraxError,
  clubById,
  completedTrades,
  composePaper,
  datedKickoffs,
  fetchFixtures,
  fetchLeagueInfo,
  getFootballSnapshot,
  isCovered,
  mapFixtures,
  mapLeagueInfo,
  mapTransactions,
  newsdesk,
  nextDeadline,
  openingGameweek,
  periodGameweeks,
  periodLock,
  periodOfGameweek,
  banned,
  REPORT_NEVER,
  DRAFT_NEVER,
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
import { writeSeason } from "./edition/seasonWriter";
import { writeSheets } from "./edition/sheetsWriter";
import { writeBin } from "./edition/binWriter";
import { draftColumn } from "./edition/draftWriter";
import { reportsColumn } from "./edition/reportsWriter";
import { writeTrade } from "./edition/hereWeGoWriter";
import { presserDesk } from "./edition/presserWeek";
import { lineupsSlot, readXi } from "./edition/xi";
import { deskState, seasonOpening } from "./edition/desk";
import { deskContext } from "./edition/context";
import { fire, type Run } from "./edition/firing";
import { printStory, readLedger, readPaperStories, saveFiling } from "./edition/persist";
import type { Say } from "./edition/newsroom";

// The newsroom's orchestrator, run from CI on a wide cron net: each firing files the top of the running order up to the
// cap, saving each story before the next, and CI commits them. Those commits run no CI, so the shape checks in
// `edition/newsroom.ts` and `edition/persist.ts` are the only gate between a model's output and the front page.

/** Stories one firing may FILE, not assignments it may consider (`hasRoom`, `edition/firing.ts`): two locally, ten
 *  from CI. The ledger never queues a covered key, so no cap files a story twice. */
const STORY_CAP = Number(process.env.GAZETTA_STORY_CAP ?? 2);

/** Prints the assignments and their briefs instead of writing anything. */
const DRY_RUN = process.env.DRY_RUN === "1";

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);

  // One instant for the whole firing, or the desk and the byline straddle midnight. `GAZETTA_NOW` rehearses a dated
  // column; CI never sets it, and an unreadable value is ignored.
  const wanted = process.env.GAZETTA_NOW ?? "";
  const now = Number.isNaN(Date.parse(wanted)) ? new Date().toISOString() : new Date(wanted).toISOString();

  // A past gameweek, for a local rehearsal of a firing (never CI); GAZETTA_ONLY keeps one kind.
  const wantedGameweek = Number(process.env.GAZETTA_GAMEWEEK ?? "");
  const pinned = Number.isInteger(wantedGameweek) && wantedGameweek > 0 ? wantedGameweek : undefined;
  if (pinned !== undefined && process.env.CI) throw new Error("GAZETTA_GAMEWEEK is a local rehearsal and never runs in CI.");
  const snapshot = await getFootballSnapshot(pinned);
  // `roundState`, which can say "live": the guard keeps a report off a round still being played.
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
  const round = periodOfGameweek(calendar, snapshot.gameweek);
  const deadline = nextDeadline(info.rosterPeriods, kickoffs, now);
  const nextRound = openingGameweek(calendar, deadline?.period);
  if (round === undefined) return say(`No Fantrax period covers gameweek ${snapshot.gameweek}.`);

  // When this round locks, and whether it has: the pressers' desk reads both.
  const lock = periodLock(info.rosterPeriods.find((each) => each.number === round.period), kickoffs);
  const locked = lock !== null && Date.parse(now) >= Date.parse(lock);

  const ledger = readLedger();
  const paper = readPaperStories();
  const facts = await gatherRoundFacts(info, snapshot, round.period);
  // A trade feed from a file, shaped as Fantrax's, for a local rehearsal of Here We Go (never CI).
  const rehearsed = process.env.GAZETTA_TRADES ?? "";
  if (rehearsed !== "") {
    if (process.env.CI) throw new Error("GAZETTA_TRADES is a local rehearsal and never runs in CI.");
    facts.trades = completedTrades(mapTransactions(JSON.parse(readFileSync(rehearsed, "utf8")), "TRADE"));
  }
  const clubs = clubById(snapshot);
  // Clubs by FPL CODE, which a presser signal carries and a crest keys off; `clubById` keys by the per-season id.
  const byCode = new Map([...clubs.values()].map((club) => [club.code, club]));

  const sheet = presserDesk({ facts, snapshot, byCode, now, lock, locked, season, say });
  // The elevens predict the round the pressers preview, so one clock serves both.
  const xi = readXi(sheet.gameweek);
  const ahead = periodOfGameweek(calendar, sheet.gameweek);

  const only = process.env.GAZETTA_ONLY ?? "";
  const assignments = newsdesk(
    deskState({
      snapshot,
      facts,
      period: round.period,
      finished,
      locked,
      lines: sheet.lines,
      lineups: xi === null ? null : lineupsSlot(sheet.gameweek, xi),
      ahead: ahead === undefined ? null : { period: ahead.period, gameweek: sheet.gameweek },
      next: deadline === null || nextRound === undefined ? null : { period: deadline.period, gameweek: nextRound, locksAt: deadline.locksAt },
      season: seasonOpening(info, calendar, kickoffs, facts.pedigree.size > 0),
      calendar,
    }),
    (key) => isCovered(ledger, FANTRAX_LEAGUE_ID, key),
    now,
  ).filter((assignment) => only === "" || assignment.kind === only);
  if (process.env.GAZETTA_QUEUE) return say(assignments.map((a) => a.key).join("\n"));
  if (assignments.length === 0) return say("Nothing new to report.");

  const { ctx, lost } = await deskContext({ snapshot, facts, clubs, byCode, info, period: round.period, gameweeks: round.gameweeks, ledger, sheet, xi, season, kickoffs, assignments, now, say });
  // The other desks still file; the job ends red so `alert:` opens, and the lost kinds' keys wait for the next firing.
  if (lost.length > 0) {
    console.error(`Lost the reads of ${lost.length} desk(s): ${lost.join(", ")}.`);
    process.exitCode = 1;
  }

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
  // A columnist's own column runs his photograph, and a trade its Here We Go plate, never a drawing over either.
  if (filing !== undefined && filing.story.image === null && filing.story.reporter === undefined && filing.story.kind !== "trade") {
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
        "bin" in desk
          ? await writeBin(desk.bin, brief, say)
          : "draft" in desk
          ? await draftColumn(desk.draft, say)
          : "reports" in desk
          ? await reportsColumn(desk.reports, say)
          : "trade" in desk
          ? await writeTrade(desk.trade, say)
          : "sheets" in desk
          ? await writeSheets(desk.sheets, brief, say)
          : "season" in desk
          ? await writeSeason(desk.season, brief, say)
          : "lawro" in desk
            ? await writeLawro(desk.lawro, brief, desk.brief, say)
            : await writeSubedited(desk.system, brief, say, assignment.kind, desk.expected);
      const filed = file(assignment, column, ctx, now);
      // Every name in the prose against every name in the brief; it warns rather than refuses.
      const unknown = strangers(prose(filed.story), brief);
      if (unknown.length > 0) {
        say(`  ⚠ ${assignment.kind} names ${unknown.length} not in its brief: ${unknown.join(", ")}`);
      }
      // The backstop reads the FILED story, cargo included, and files anyway, loudly.
      const printed = banned(headlineAndProse(filed.story), assignment.kind === "match-report" ? REPORT_NEVER : assignment.kind === "draft-report" ? DRAFT_NEVER : undefined);
      if (printed.length > 0) {
        say(`  ⚠ ${assignment.kind} STILL prints banned phrasing after a rewrite: ${printed.join(", ")}`);
      }
      // Every reader of `extras` treats absence as ordinary, so a lost cargo is only ever caught here.
      const missing = CARGO[assignment.kind];
      const cargo = missing === undefined ? undefined : filed.story.extras?.[missing];
      if (missing !== undefined && (cargo === undefined || (Array.isArray(cargo) && cargo.length === 0))) {
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

const say: Say = console.log;

main().catch((error: unknown) => {
  console.error(error instanceof FantraxError ? `${error.code}: ${error.message}` : error);
  process.exit(1);
});
