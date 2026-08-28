import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type Bridge,
  type EditionKind,
  type FootballSnapshot,
  type LeagueInfo,
  type PublishedEdition,
  datedKickoffs,
  buildBrief,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchLiveScoring,
  fetchTeamRosters,
  fetchTransactions,
  firstKickoff,
  gameweekStarted,
  getFootballSnapshot,
  locksAt,
  mapDraftPicks,
  mapLeagueInfo,
  mapLiveScores,
  mapProjectedTotals,
  mapTeamRosters,
  mapTransactions,
  normalizePublished,
  periodGameweeks,
  periodPairings,
  resolveRosters,
  roundState,
  availability,
  deals,
  stories,
  teamOfTheWeek,
  wasFielded,
} from "@epl/core";
import { EDITIONS_ROOT } from "./paths";
import { BYLINE, PREVIEW, REPORT } from "./edition/voice";
import mapping from "../data/mappings/fantrax.json";

// The columnist, run from CI twice a week.
//
// **Facts are live and prose is published.** Everything countable on the front
// page updates on the app's thirty-second poll; a column cannot, because a
// column rewritten every thirty seconds is not a column and a sentence about a
// score that has since moved is worse than no sentence. So the writing happens
// here, off the app entirely, and the result is committed as data — which
// triggers the build that bakes it into the page.
//
// It is safe to run as often as you like. Every guard below exits 0 rather than
// failing, in cost order, so the common case is a cron that reads one snapshot
// and stops: GitHub's schedules are late or skipped often enough that the only
// reliable design is to fire repeatedly and let the guards decide.
//
// **It never commits anything it has not validated.** These commits ride
// `GITHUB_TOKEN` and so run no CI beside them, while changing what the app
// renders — so the shape check here is the only gate there is, and a model
// returning something unrenderable must cost us a red workflow rather than a
// broken front page.

const API = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.GAZETTA_MODEL ?? "claude-opus-4-8";
const MAX_TOKENS = 8000;

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

  // The league is in the filename, not only in the payload. Without it a
  // rehearsal edition filed on the Friday BLOCKS the real one — `existsSync`
  // below would find it and the run would report "already filed" for a paper
  // that is about a different competition.
  const archive = join(EDITIONS_ROOT, `${FANTRAX_LEAGUE_ID}-gw${snapshot.gameweek}-${kind}.json`);
  if (existsSync(archive)) return say(`Already filed: ${archive}`);

  const brief = await gather(kind, info, snapshot, round.period);
  if (DRY_RUN) {
    console.log(brief);
    console.log("\n--- dry run: no column written ---");
    return;
  }

  const column = await write(kind === "report" ? REPORT : PREVIEW, brief);
  const edition = normalizePublished({
    ...column,
    kind,
    leagueId: FANTRAX_LEAGUE_ID,
    period: round.period,
    gameweek: snapshot.gameweek,
    filedAt: new Date().toISOString(),
    byline: BYLINE[kind],
  });
  // A column we cannot render is a failed run, never a committed one: the
  // fallback is the facts-only paper the app already prints, and it is better
  // than a broken page.
  if (edition === null) throw new Error("The column did not come back in a shape the page can print.");

  mkdirSync(EDITIONS_ROOT, { recursive: true });
  const json = `${JSON.stringify(edition, null, 2)}\n`;
  writeFileSync(archive, json);
  writeFileSync(join(EDITIONS_ROOT, "latest.json"), json);
  say(`Filed ${kind} for gameweek ${snapshot.gameweek}: "${edition.headline}"`);
}

/** Everything the writer is allowed to know. Read here, at the edge, so
 *  `buildBrief` stays pure and testable. */
async function gather(
  kind: EditionKind,
  info: LeagueInfo,
  snapshot: FootballSnapshot,
  period: number,
): Promise<string> {
  const gameweek = snapshot.gameweek;
  const [live, rosters, claims, trades, draft] = await Promise.all([
    fetchLiveScoring(FANTRAX_LEAGUE_ID, period),
    fetchTeamRosters(FANTRAX_LEAGUE_ID).catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null),
    fetchDraftResults(FANTRAX_LEAGUE_ID).catch(() => null),
  ]);

  const scores = new Map(mapLiveScores(live).map((score) => [score.teamId, score]));
  const projected = new Map(mapProjectedTotals(live).map((guess) => [guess.teamId, guess]));
  const pairings = periodPairings(info.matchups, info.teams, period);

  // The squads, and with them the two things only a join can say: who was in the
  // week's eleven, and whether the arrangement we hold is the one that was
  // actually fielded.
  // `as Bridge` and not a looser cast: a JSON import widens `matchedBy` to
  // `string` and the compiler cannot see that the writer only emits four
  // literals. Asserted exactly as `apps/companion/app/squads.ts` asserts it, and
  // for the same reason.
  const squads =
    rosters === null ? null : resolveRosters(snapshot, mapTeamRosters(rosters), mapping as Bridge);
  const eleven = squads === null ? null : teamOfTheWeek(squads.teams, info.roster);
  const fielded = squads !== null && wasFielded(squads, period);

  const business = deals([
    ...(claims === null ? [] : mapTransactions(claims, "CLAIM_DROP")),
    ...(trades === null ? [] : mapTransactions(trades, "TRADE")),
  ]);

  return buildBrief({
    kind,
    gameweek: snapshot.gameweek,
    period,
    teams: info.teams.map((team) => ({ teamId: team.teamId, name: team.name })),
    pairings,
    scores,
    projected,
    stories:
      kind === "report" && eleven !== null
        ? stories(pairings, scores, fielded ? eleven : null, business, period)
        : [],
    eleven: eleven !== null && eleven.picks.length > 0 ? eleven : null,
    fielded,
    deals: business,
    doubts: squads === null ? [] : availability(squads.teams),
    // Where each man was taken. Empty until a draft completes, which is the real
    // league's state until 10 Oct — and an empty map means the brief says
    // nothing about pedigree rather than calling every squad undrafted.
    pedigree: new Map(
      (draft === null ? [] : mapDraftPicks(draft)).map((taken) => [taken.fantraxId, taken]),
    ),
    // Marking last week's calls needs last week's edition as well as this
    // week's results — a second read of a second file, and not wired.
    marked: null,
  });
}

/** One call, by fetch. No SDK: CODE_RULES §2 says no dependency a small local
 *  function would cover, and this is twenty lines. */
async function write(system: string, brief: string): Promise<Record<string, unknown>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set. The column is written in CI, never on Vercel.");

  const response = await fetch(API, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: brief }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: { type?: string; text?: string }[];
  };
  // A truncated column is a JSON parse away from garbage, and the parse would
  // fail with a message about a bracket rather than about a limit.
  if (body.stop_reason !== "end_turn") throw new Error(`Stopped on ${body.stop_reason}, not a finished column.`);

  const text = body.content?.find((block) => block.type === "text")?.text ?? "";
  return JSON.parse(text.trim().replace(/^```(?:json)?\n?|```$/g, "")) as Record<string, unknown>;
}

function say(message: string): void {
  console.log(message);
}

main().catch((error: unknown) => {
  console.error(error instanceof FantraxError ? `${error.code}: ${error.message}` : error);
  process.exit(1);
});
