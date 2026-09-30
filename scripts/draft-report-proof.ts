import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  buildDraftBrief,
  draftCargo,
  draftFace,
  isSaturday,
  londonWeekday,
  requireLeague,
  weekdayOfDay,
  type Cutoff,
  type StoryDraftMatchup,
  type StoryDraftReport,
  type StoryDraftReturn,
  type StoryDraftRow,
} from "@epl/core";
import { draftDesk } from "./edition/draftDesk";
import { draftColumn } from "./edition/draftWriter";
import { storyOfColumn } from "./edition/newsroom";
import { STORY_BYLINE, editionName } from "./edition/voice/bylines";

// The draft report for a past gameweek, never filed to the paper. With no GAZETTA_PROOF_OUT it prints the brief and calls no
// model. With one it writes each due cut-off (or GAZETTA_CUTOFF's) to that folder: the brief, a plain read and a story
// file a preview can splice in. GAZETTA_TEST=1 is test mode: the lead match-up only (GAZETTA_TEST_MATCHUPS for more)
// and no send-back, the cheapest honest read of the writing.

const say = (line: string) => process.stdout.write(`${line}\n`);

const scorer = (r: StoryDraftReturn) => (r.minutes.length > 0 ? `${r.name} (${r.minutes.map((m) => `${m}'`).join(", ")})` : r.count > 1 ? `${r.name} ${r.count}` : r.name);
const row = (r: StoryDraftRow) =>
  `  ${r.slot} ${r.mark === "sub" ? "SUB " : ""}${r.name} ${r.points ?? "—"}${r.mark === "dnp" ? ", did not play" : r.next === null ? "" : `, ${londonWeekday(r.next.kickoff)} v ${r.next.opponent} (${r.next.home ? "h" : "a"})${r.mark === "sub" && r.points === null ? " if he plays" : ""}`}`;

/** What the page sets out around the writing: the running score, each side's returns, and after the story both elevens. */
function page(m: StoryDraftMatchup): { head: string[]; foot: string[] } {
  const sides = [m.home, m.away];
  const returns = sides.map((s) => `${s.name}: goals ${s.returns.goals.map(scorer).join(", ") || "—"}; assists ${s.returns.assists.map(scorer).join(", ") || "—"}; clean sheets ${s.returns.cleanSheets.map(scorer).join(", ") || "—"}`);
  const steps = m.byDay.map((s) => `${s.day === null ? "Subs" : weekdayOfDay(s.day)} ${s.home}-${s.away}`).join(" · ");
  return { head: [`By day: ${steps || "—"}`, ...returns], foot: sides.flatMap((s) => [`${s.name}:`, ...s.eleven.map(row)]) };
}

/** The report as plain text, for reading before looking at the page. */
function plain(headline: string, draft: StoryDraftReport): string {
  return [...(headline === "" ? [] : [headline, ""]), ...draft.matchups.flatMap((m) => [`## ${m.verdict}`, ...page(m).head, "", m.standfirst, ...m.paragraphs, "", ...page(m).foot, ""])].join("\n");
}

async function main(): Promise<void> {
  if (process.env.CI) throw new Error("draft:proof is a local proof and never runs in CI.");
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek)) throw new Error("GAZETTA_GAMEWEEK names the gameweek to read.");
  const desk = await draftDesk(gameweek);
  say([`League ${FANTRAX_LEAGUE_ID}, period ${desk.period}, gameweek ${gameweek}; played on ${desk.days.join(", ")}.`, ...desk.notes].join("\n"));
  const out = process.env.GAZETTA_PROOF_OUT ?? "";
  const only = process.env.GAZETTA_CUTOFF as Cutoff | undefined;
  const test = process.env.GAZETTA_TEST === "1";
  for (const [cutoff, all] of desk.cutoffs) {
    if (only !== undefined && only !== cutoff) continue;
    const contexts = test ? all.slice(0, Number(process.env.GAZETTA_TEST_MATCHUPS ?? 1)) : all;
    if (out === "") {
      say(`\n########## ${cutoff === "saturday" ? "AFTER SATURDAY" : "END OF THE GAMEWEEK"} ##########\n\n${buildDraftBrief(cutoff, gameweek, contexts)}`);
      say(`\n---------- THE PAGE, unwritten ----------\n\n${plain("", draftCargo(cutoff, gameweek, contexts, new Map(), desk.rankAfter))}`);
      continue;
    }
    const column = await draftColumn({ cutoff, gameweek, contexts, rankAfter: desk.rankAfter }, say, { sendBack: !test });
    const slug = cutoff === "saturday" ? `proof-gw${gameweek}-draft-report-saturday` : `proof-gw${gameweek}-draft-report`;
    const day = cutoff === "saturday" ? (desk.days.find(isSaturday) ?? desk.days[0]) : desk.days.at(-1)!;
    const filedAt = new Date().toISOString();
    const { story } = storyOfColumn(column, {
      slug, kind: "draft-report", leagueId: FANTRAX_LEAGUE_ID, period: desk.period, gameweek, filedAt, expiresAt: null,
      edition: editionName("draft-report", filedAt, day), byline: STORY_BYLINE["draft-report"] ?? "", subject: `draft-report:gw${gameweek}:${cutoff}`, face: draftFace(contexts),
    });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `${slug}.brief.txt`), buildDraftBrief(cutoff, gameweek, contexts));
    writeFileSync(join(out, `${slug}.txt`), plain(story.headline, column.draft as StoryDraftReport));
    writeFileSync(join(out, `${slug}.story.json`), JSON.stringify(story, null, 2));
    say(`Wrote ${slug} to ${out}${test ? " (test mode)" : ""}.`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
