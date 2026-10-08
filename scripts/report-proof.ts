import {
  FANTRAX_LEAGUE_ID,
  buildReportsBrief,
  plainStandfirst,
  reportsCargo,
  datedKickoffs,
  deskDay,
  fetchFixtures,
  fetchLeagueInfo,
  getFootballSnapshot,
  mapFixtures,
  onLondonDay,
  mapLeagueInfo,
  periodGameweeks,
  requireLeague,
} from "@epl/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gatherRoundFacts } from "./edition/facts";
import { matchdayInput } from "./edition/matchday";
import { writeReports } from "./edition/reportsWriter";
import { proofText } from "./edition/reportsProofText";
import { storyOfColumn } from "./edition/newsroom";
import { STORY_BYLINE, editionName } from "./edition/voice/bylines";

// A match-day report for a past gameweek, written to scratch and never to the paper, so Craig can read it before anything files.
// GAZETTA_GAMEWEEK=5 with GAZETTA_FIXTURES=48 (FPL fixture ids) or GAZETTA_DAY=2026-09-19; DRY_RUN=1 prints the brief only.
// Test mode unless GAZETTA_FULL=1: the first match alone and no send-back, since Opus bills every call (8 Oct 2026).

const say = (message: string) => console.log(message);

async function main(): Promise<void> {
  if (process.env.CI) throw new Error("report:proof is a local proof and never runs in CI.");
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek) || gameweek < 1) throw new Error("GAZETTA_GAMEWEEK is required, e.g. 5.");
  const ids = (process.env.GAZETTA_FIXTURES ?? "").split(",").filter(Boolean).map(Number);
  const day = process.env.GAZETTA_DAY ?? "";
  if (ids.length === 0 && day === "") throw new Error("Name the fixtures (GAZETTA_FIXTURES) or the day (GAZETTA_DAY).");

  const [snapshot, info, season] = await Promise.all([
    getFootballSnapshot(gameweek),
    fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo),
    fetchFixtures().then(mapFixtures),
  ]);
  const round = periodGameweeks(info.scoringPeriods, datedKickoffs(season)).find((p) => p.gameweeks.includes(gameweek));
  if (round === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  say(`League ${FANTRAX_LEAGUE_ID}, gameweek ${gameweek}, period ${round.period} (gameweeks ${round.gameweeks.join(", ")}).`);
  const facts = await gatherRoundFacts(info, snapshot, round.period);

  const input = await matchdayInput({
    snapshot,
    facts,
    periodGameweeks: round.gameweeks,
    pick: (f) => (ids.length > 0 ? ids.includes(f.id) : onLondonDay(f.kickoff, day)),
    say,
  });
  if (input === null || input.matches.length === 0) return say("Nothing to report for that choice.");
  const full = process.env.GAZETTA_FULL === "1";
  const desks = full ? deskDay(input) : deskDay(input).slice(0, 1);
  const brief = buildReportsBrief(input.day, gameweek, desks);

  if (process.env.DRY_RUN === "1") {
    say(`\n${brief}`);
    for (const desk of desks) say(`\nKEY STATS, ${desk.match.home.name} v ${desk.match.away.name}:\n${desk.keyStats.map((k) => `- ${k.label}: ${k.value}`).join("\n")}`);
    for (const desk of desks) {
      const marks = [...desk.match.marks].map(([code, mark]) => `${desk.match.men.find((m) => m.code === code)?.name ?? code} ${mark ?? "—"}`);
      say(`\nMARKS, ${desk.match.home.name} v ${desk.match.away.name} (Star man ${desk.star?.name ?? "—"}):\n${marks.join(", ")}`);
    }
    return;
  }
  const out = process.env.GAZETTA_PROOF_OUT ?? "";
  if (out === "") throw new Error("GAZETTA_PROOF_OUT names the scratch folder the proof is written to.");
  const { draft, log } = await writeReports(input.day, gameweek, desks, [], say, { sendBack: full });
  mkdirSync(out, { recursive: true });
  const slug = `proof-gw${gameweek}-${input.day}`;
  writeFileSync(join(out, `${slug}.brief.txt`), brief);
  writeFileSync(join(out, `${slug}.txt`), proofText(draft, desks));
  writeFileSync(join(out, `${slug}.draft.json`), JSON.stringify({ headline: draft.headline, matches: Object.fromEntries(draft.matches) }, null, 2));
  writeFileSync(join(out, `${slug}.log.json`), JSON.stringify(log, null, 2));
  // Filed through the same fold a real filing takes, stamped with the match day, never persisted to the paper.
  const matchDay = desks[0].match.fixture.kickoff ?? new Date().toISOString();
  const { story } = storyOfColumn(
    { headline: draft.headline || plainStandfirst(desks[0]), deck: plainStandfirst(desks[0]).replace(/\.$/u, ""), body: "", reports: reportsCargo(desks, draft) },
    {
      slug, kind: "match-report", leagueId: FANTRAX_LEAGUE_ID, period: round.period, gameweek, filedAt: new Date().toISOString(),
      expiresAt: null, edition: editionName("match-report", new Date().toISOString(), matchDay), byline: STORY_BYLINE["match-report"] ?? "", subject: `match-report:gw${gameweek}:${input.day}`, face: null,
    },
  );
  writeFileSync(join(out, `${slug}.story.json`), JSON.stringify(story, null, 2));
  say(`Wrote ${slug} to ${out}. Kept: ${JSON.stringify(log.kept)}. Tokens in ${log.usage.input}, out ${log.usage.output}.`);
  for (const [i, attempt] of log.attempts.entries()) say(`  attempt ${i + 1}: ${attempt.faults.map((f) => `${f.severity} ${f.section} ${f.check} [${f.evidence}]`).join("\n    ") || "clean"}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
