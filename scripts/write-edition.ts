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
import { presserFixtures, presserLines, presserQuotes } from "./edition/pressers";
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
  const now = new Date().toISOString();

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
  const locked = lock !== null && Date.now() >= Date.parse(lock);
  const started = gameweekStarted(snapshot.fixtures, snapshot.gameweek);

  const ledger = readLedger();
  const paper = readPaperStories();
  const facts = await gatherRoundFacts(info, snapshot, round.period);
  const clubs = clubById(snapshot);
  // Clubs by FPL CODE, which is what a presser signal carries and what a crest
  // keys off — `clubById` keys by the per-season id.
  const byCode = new Map([...clubs.values()].map((club) => [club.code, club]));

  // This round's pressers, for men the league holds. The window opens at the
  // last lock: a signal from before it belongs to a round already played.
  const presserSince = lock ?? now;
  const lines = presserLines(facts.teams, presserSince, byCode, snapshot.players);

  // **The round the pressers PREVIEW, which between gameweeks is not the one the
  // snapshot is focused on.** `focusGameweek` prefers FPL's `is_current`, and
  // `map.ts` records that FPL keeps that flag on a round until the next
  // DEADLINE — so on a Thursday it still names the football already played.
  // Attaching those fixtures would have printed last weekend's opponents beside
  // this weekend's team news.
  const ahead = finished ? snapshot.gameweek + 1 : snapshot.gameweek;
  const presserTies = lines.length === 0 ? new Map() : await presserFixtures(ahead, byCode);

  const assignments = newsdesk(
    deskState({ snapshot, facts, clubs, period: round.period, finished, locked, started, lines }),
    (key) => isCovered(ledger, FANTRAX_LEAGUE_ID, key),
    now,
  );
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
    presserLines: lines,
    presserQuotes: presserQuotes(byCode),
    presserTies,
  };

  const filings: Filing[] = [];
  // Attempts, not assignments: a desk that refuses spends nothing and is an
  // ordinary outcome, so a firing where every assignment refused must exit
  // quietly rather than red. Only a call that was actually made and failed is
  // evidence of a broken writer.
  let attempted = 0;
  for (const assignment of assignments) {
    // **The cap counts STORIES FILED, not assignments considered**, and the
    // difference is the whole bug it fixes. The order used to be sliced to the
    // cap before any desk was asked for a brief, so two kinds that refuse —
    // and a refusal spends no key, so they are still top of the order next
    // time — wedged the paper permanently: `eleven` and `dodgers` took both of
    // every firing's two places from 2 Sep, and four working match reports,
    // the columns behind them were unreachable for the rest of
    // the period. A refusal now costs nothing and the next assignment gets the
    // turn.
    if (!hasRoom(filings.length, STORY_CAP)) break;
    const desk = prepare(assignment, ctx);
    // A desk that refuses spends nothing: the facts moved between the
    // newsdesk's look and the brief's, or the kind has no desk yet.
    if (desk === null) {
      say(`No brief for ${assignment.kind} (${assignment.key}); skipped.`);
      continue;
    }
    // **The page, handed to a writer who cannot see it.** Every story is its own
    // model call from its own scoped brief, so nothing stops two of them landing
    // on the same joke — and nothing did: five "bank" headlines and two "Left
    // Wanting" went out on 3 Sep. This is the sub-editor's look at the page,
    // rebuilt each turn so a story filed a moment ago is already on it.
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
      // **Every name in the prose against every name in the brief.** The first
      // real story this paper ever filed put a Newcastle defender who is on
      // nobody's roster into the team of the week, twice, and dropped the man
      // he replaced — see `gazette/strangers.ts`. It reads perfectly, which is
      // why it needs a machine rather than a proofreader. A warning and not a
      // refusal: the check is deliberately eager, so a human reads the list.
      const unknown = strangers(prose(filed.story), brief);
      if (unknown.length > 0) {
        say(`  ⚠ ${assignment.kind} names ${unknown.length} not in its brief: ${unknown.join(", ")}`);
      }
      // **The backstop, and it reads MORE than the sub-editor did.** `subedit`
      // checks the raw column — headline, deck, body — because that is what it
      // can cheaply send back. This reads the FILED story, which adds the tie
      // lines and the rank lines, so it is the one that catches a banned phrase
      // in a column's cargo. It files anyway and says so loudly: a second
      // failure is the writer's answer rather than a reason to hang the firing,
      // and a column right about the football is worth printing.
      const printed = banned(headlineAndProse(filed.story));
      if (printed.length > 0) {
        say(`  ⚠ ${assignment.kind} STILL prints banned phrasing after a rewrite: ${printed.join(", ")}`);
      }
      // **A column whose cargo is missing files as prose about nothing.** Every
      // reader of `extras` treats absence as ordinary — correctly, since a
      // wire has a quiz and no ranks — so nothing downstream can tell an
      // empty rankings column from a kind that never carries one. The power
      // ranking filed without its `ranks` on 2 Sep: two good paragraphs and no
      // ranked list, which is the column's whole point. Warned, not refused;
      // the prose is still worth printing.
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

  // The picture, last and optional. Only the story that will LEAD gets one —
  // a drawing beside a headline nobody reads first is a drawing nobody sees —
  // and only when it is one of this firing's, since an older lead already had
  // its chance. Any failure costs the picture and never the paper.
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
