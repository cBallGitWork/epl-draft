import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  clubById,
  datedKickoffs,
  decided,
  fetchLeagueInfo,
  firstKickoff,
  fixtureStakes,
  gameweekStarted,
  getFootballSnapshot,
  isCovered,
  locksAt,
  mapLeagueInfo,
  markPreview,
  newsdesk,
  periodGameweeks,
  roundState,
  tieState,
  type PublishedEdition,
  type PublishedStory,
} from "@epl/core";
import { gatherRoundFacts } from "./edition/facts";
import { file, prepare, type DeskContext } from "./edition/dispatch";
import { writeColumn } from "./edition/newsroom";
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

/** Model calls one firing may spend. Two: the whistle windows fire every half
 *  hour, so a burst of news is spread across firings rather than bought at
 *  once, and a runaway prompt bug costs pennies rather than pounds. */
const STORY_CAP = Number(process.env.GAZETTA_STORY_CAP ?? 2);

/** Prints the assignments and their briefs instead of writing anything. */
const DRY_RUN = process.env.DRY_RUN === "1";

async function main(): Promise<void> {
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
  const facts = await gatherRoundFacts(info, snapshot, round.period);
  const clubs = clubById(snapshot);

  const assignments = newsdesk(
    {
      gameweek: snapshot.gameweek,
      period: round.period,
      finished,
      locked,
      started,
      stakes: fixtureStakes(
        snapshot.fixtures.filter((fixture) => fixture.gameweek === snapshot.gameweek),
        facts.teams,
        facts.pairings,
        clubs,
      ),
      ties: facts.pairings.map((pairing) => ({
        homeTeamId: pairing.home.teamId,
        awayTeamId: pairing.away.teamId,
        state: tieState(
          facts.scores.get(pairing.home.teamId),
          facts.scores.get(pairing.away.teamId),
        ),
      })),
    },
    (key) => isCovered(ledger, FANTRAX_LEAGUE_ID, key),
    new Date().toISOString(),
  ).slice(0, STORY_CAP);
  if (assignments.length === 0) return say("Nothing new to report.");

  const ctx: DeskContext = {
    leagueId: FANTRAX_LEAGUE_ID,
    snapshot,
    facts,
    clubs,
    ledger,
    info,
    period: round.period,
    kickoff,
    marked:
      finished
        ? markPreview(previewOnFile(readPaperStories(), round.period), decided(facts.pairings, facts.scores))
        : null,
  };

  const filings: Filing[] = [];
  for (const assignment of assignments) {
    const desk = prepare(assignment, ctx);
    // A desk that refuses spends nothing: the facts moved between the
    // newsdesk's look and the brief's, or the kind has no desk yet.
    if (desk === null) {
      say(`No brief for ${assignment.kind} (${assignment.key}); skipped.`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`\n=== ${assignment.kind} · ${assignment.key} ===\n${desk.brief}`);
      continue;
    }
    // One bad story costs that story; the run fails only when EVERY attempted
    // story failed, which is the signal of a broken writer rather than a
    // brittle payload.
    try {
      const column = await writeColumn(desk.system, desk.brief);
      const filed = file(assignment, column, ctx, new Date().toISOString());
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
  if (filings.length === 0) throw new Error("Every attempted story failed; nothing filed.");

  persistFilings(filings, ledger, new Date().toISOString());
}

/** This round's preview, as filed — the report marks its calls. Only what
 *  `markPreview` reads is reconstructed; the rest of the old shape is gone. */
function previewOnFile(paper: PublishedStory[], period: number): PublishedEdition | null {
  const preview = paper.find(
    (story) =>
      story.leagueId === FANTRAX_LEAGUE_ID &&
      story.kind === "round-preview" &&
      story.period === period,
  );
  if (preview === undefined) return null;
  return {
    kind: "preview",
    leagueId: preview.leagueId,
    period: preview.period,
    gameweek: preview.gameweek,
    filedAt: preview.filedAt,
    byline: preview.byline,
    headline: preview.headline,
    deck: preview.deck,
    intro: "",
    sections: [],
    ties: preview.ties ?? [],
  };
}

function say(message: string): void {
  console.log(message);
}

main().catch((error: unknown) => {
  console.error(error instanceof FantraxError ? `${error.code}: ${error.message}` : error);
  process.exit(1);
});
