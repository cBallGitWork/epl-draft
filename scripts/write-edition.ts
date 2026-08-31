import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type EditionKind,
  type PublishedEdition,
  type PublishedStory,
  buildBrief,
  datedKickoffs,
  decided,
  fetchLeagueInfo,
  firstKickoff,
  gameweekStarted,
  getFootballSnapshot,
  isCovered,
  locksAt,
  mapLeagueInfo,
  markPreview,
  normalizePublished,
  periodGameweeks,
  roundState,
  stories,
} from "@epl/core";
import { BYLINE, PREVIEW, REPORT } from "./edition/voice";
import { gatherRoundFacts } from "./edition/facts";
import { storyOfEdition, writeColumn } from "./edition/newsroom";
import { persistFiling, readLedger, readPaperStories } from "./edition/persist";

// The columnist, run from CI on a wide cron net.
//
// **Facts are live and prose is published — and published prose accumulates.**
// Everything countable on the front page updates on the app's thirty-second
// poll; a column cannot, so the writing happens here, off the app entirely, and
// each filing joins the rolling paper in `data/editions/paper.json` — which the
// commit bakes into the page.
//
// It is safe to run as often as you like. Every guard below exits 0 rather than
// failing, in cost order, so the common case is a cron that reads one snapshot
// and stops: GitHub's schedules are late or skipped often enough that the only
// reliable design is to fire repeatedly and let the guards decide. The ledger,
// not the filesystem, is the memory of what was already filed.
//
// **It never commits anything it has not validated.** These commits ride
// `GITHUB_TOKEN` and so run no CI beside them, while changing what the app
// renders — so the shape checks here and in `edition/persist.ts` are the only
// gate there is, and a model returning something unrenderable must cost us a
// red workflow rather than a broken front page.

/** Prints the brief and the column instead of writing either. The whole script
 *  bar the commit, so the prompt can be read before it costs anything. */
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

  // The report once the football stops; the preview once lineups lock and before
  // it starts. Between the lock and the first whistle is the preview's window,
  // and it is a window rather than an instant because a cron cannot hit an
  // instant — GitHub's jitter routinely exceeds the fifteen minutes between our
  // lock and the first kickoff.
  const period = info.rosterPeriods.find((each) => each.number === round.period);
  const kickoff = period ? firstKickoff(period, kickoffs) : null;
  const lock = kickoff === null ? null : locksAt(kickoff);
  const locked = lock !== null && Date.now() >= Date.parse(lock);

  // **The preview's window CLOSES at the first whistle, and the lock alone does
  // not close it.** `locked` stays true from the lock right through the round,
  // so a run firing mid-match — which is the ordinary case whenever the
  // lock-time run was skipped, and GitHub skips them — would file a preview
  // whose brief says nobody has kicked a ball over a match in progress, with
  // pre-game projections beside it. A missed preview is simply not written: no
  // column is better than one built on a false premise.
  const started = gameweekStarted(snapshot.fixtures, snapshot.gameweek);

  const kind: EditionKind | null = finished ? "report" : locked && !started ? "preview" : null;
  if (kind === null) {
    return say(
      started
        ? "The round is under way and not finished. A preview is too late and a report is too early."
        : "Lineups have not locked. Nothing to file.",
    );
  }

  // The covered-key is the memory of what was filed — per league, because the
  // ledger is shared by both and a rehearsal filing must not block the real
  // one. `existsSync` on an archive used to be this guard; the ledger replaced
  // it because a rolling paper files many stories a week and the keys are the
  // one grammar all of them share.
  const spent = `${kind === "report" ? "round-report" : "round-preview"}:gw${snapshot.gameweek}`;
  const ledger = readLedger();
  if (isCovered(ledger, FANTRAX_LEAGUE_ID, spent)) return say(`Already filed: ${spent}`);

  const facts = await gatherRoundFacts(info, snapshot, round.period);
  const paper = readPaperStories();

  const brief = buildBrief({
    kind,
    gameweek: snapshot.gameweek,
    period: round.period,
    teams: info.teams.map((team) => ({ teamId: team.teamId, name: team.name })),
    pairings: facts.pairings,
    scores: facts.scores,
    projected: facts.projected,
    stories:
      kind === "report" && facts.eleven !== null
        ? stories(facts.pairings, facts.scores, facts.fielded ? facts.eleven : null, facts.business, round.period)
        : [],
    eleven: facts.eleven,
    fielded: facts.fielded,
    deals: facts.business,
    doubts: facts.doubts,
    pedigree: facts.pedigree,
    // The report owns last week's calls: the preview it answers is still on
    // file (the report's own filing is what retires it), and the results are
    // pure comparison — a pundit nobody marks is a pundit who never has to be
    // right.
    marked:
      kind === "report"
        ? markPreview(previewOnFile(paper, round.period), decided(facts.pairings, facts.scores))
        : null,
  });

  if (DRY_RUN) {
    console.log(brief);
    console.log("\n--- dry run: no column written ---");
    return;
  }

  const column = await writeColumn(kind === "report" ? REPORT : PREVIEW, brief);
  const edition = {
    ...column,
    kind,
    leagueId: FANTRAX_LEAGUE_ID,
    period: round.period,
    gameweek: snapshot.gameweek,
    filedAt: new Date().toISOString(),
    byline: BYLINE[kind],
  };
  // A column we cannot render is a failed run, never a committed one: the
  // fallback is the facts-only paper the app already prints, and it is better
  // than a broken page. `storyOfEdition` validates the story shape the same way.
  const published = normalizePublished(edition);
  if (published === null) throw new Error("The column did not come back in a shape the page can print.");

  const story = storyOfEdition(published, spent, kickoff);
  persistFiling({ story, spentKeys: [spent], threads: [] }, ledger, new Date().toISOString());
  say(`Filed ${kind} for gameweek ${snapshot.gameweek}: "${published.headline}"`);
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
