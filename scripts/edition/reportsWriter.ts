import {
  REPORTS,
  buildReportsBrief,
  checkReports,
  fanBrief,
  applyFixes,
  faultySentences,
  fanFaults,
  fanHeadline,
  strike,
  survivors,
  matchBlock,
  matchOf,
  mergeReports,
  plainHead,
  readReportsDraft,
  REPORT_NEVER,
  banned,
  surname,
  type Fault,
  type MatchDesk,
  type ReportsDraft,
} from "@epl/core";
import { FANTRAX_LEAGUE_ID, plainStandfirst, reportsCargo } from "@epl/core";
import { writeColumn } from "./newsroom";
import { readArchive } from "./persist";
import type { ReportsJob } from "./reports";
import { FAN_VOICE, LINE_EDIT_VOICE, REPORTS_VOICE, reportsSendBack } from "./voice/reports";

// The match desk's newsroom: the reporter writes the day, the editor checks every match against its facts, the fan reads
// it back, it goes back once for what either found, and each match keeps its best attempt.

export interface ReportsLog {
  attempts: { faults: Fault[] }[];
  fan: Fault[];
  kept: Record<number, "first" | "rewrite" | "plain">;
  usage: { input: number; output: number };
}

export async function writeReports(
  day: string,
  gameweek: number,
  desks: readonly MatchDesk[],
  past: readonly string[],
  say: (message: string) => void,
): Promise<{ draft: ReportsDraft; brief: string; log: ReportsLog }> {
  const usage = { input: 0, output: 0 };
  const count = (u: { input_tokens?: number; output_tokens?: number }) => {
    usage.input += u.input_tokens ?? 0;
    usage.output += u.output_tokens ?? 0;
  };
  const blocks = new Map(desks.map((desk) => [desk.match.fixture.code, matchBlock(desk)]));
  const ctx = { desks, blocks, gameweek, past };
  const codes = desks.map((d) => d.match.fixture.code);
  const surnames = desks.flatMap((d) => d.match.men.map((m) => surname(m.name)));

  // A long day is written in calls of at most `perCall` matches; each later call sees what is already on the page.
  const brief = buildReportsBrief(day, gameweek, desks);
  const first: ReportsDraft = { headline: "", headlines: [], matches: new Map() };
  for (let at = 0; at < desks.length; at += REPORTS.perCall) {
    const chunk = desks.slice(at, at + REPORTS.perCall);
    const written = [...first.matches.values()].map((p) => `${p.standfirst} ${p.account}`).join("\n");
    const part = buildReportsBrief(day, gameweek, chunk) + (written === "" ? "" : `\n\nALREADY ON THE PAGE, not to be echoed:\n${written}`);
    const draft = readReportsDraft(await writeColumn(REPORTS_VOICE, part, count), surnames);
    if (first.headline === "") first.headline = draft.headline;
    if (first.headlineStory === undefined || first.headlineStory === "") first.headlineStory = draft.headlineStory;
    first.headlines.push(...draft.headlines);
    first.meanings = { ...first.meanings, ...draft.meanings };
    for (const [code, piece] of draft.matches) first.matches.set(code, piece);
  }
  const faults1 = checkReports(first, ctx);

  // The desk strikes headlines that break a rule; the fan picks one of the rest, or none and a plain line prints.
  const names = desks.flatMap((d) => [d.match.home.name, d.match.away.name, ...d.match.home.shorts, ...d.match.away.shorts, ...d.match.men.map((m) => m.name)]);
  const candidates = survivors(first.headlines, names);
  for (const h of first.headlines) say(`    headline candidate: "${h}"${candidates.includes(h) ? "" : ` struck (${strike(h, names)})`}${first.meanings?.[h] === undefined ? "" : ` [${first.meanings[h]}]`}`);
  const fanRaw = await writeColumn(FAN_VOICE, fanBrief(first, desks, candidates), count).catch(() => null);
  const fan = fanRaw === null ? [] : fanFaults(fanRaw, first, REPORTS.fanFlags);
  const chosen = fanRaw === null ? null : fanHeadline(fanRaw, candidates);
  if (fanRaw === null) say("  ⚠ reports: the fan's read-back failed; the mechanical checks stand alone.");

  const sendable = [...faults1, ...fan].filter((f) => f.severity !== "warn");
  const attempts = [{ draft: first, faults: [...faults1, ...fan] }];
  if (sendable.length > 0) {
    say(`  ↩ reports: ${sendable.length} faults, sent back once`);
    const again = await writeColumn(REPORTS_VOICE, `${brief}\n\n${reportsSendBack(sendable)}`, count).catch(() => null);
    if (again !== null) {
      const second = readReportsDraft(again, surnames);
      // The rewrite holds only the matches sent back; every other match is judged on its first attempt.
      const faults2 = checkReports(second, ctx).filter((f) => f.section === "headline" || second.matches.has(matchOf(f.section)) || f.section === "day");
      attempts.push({ draft: second, faults: faults2 });
    }
  }

  const merged = mergeReports(attempts, codes);
  // The one pencil after the merge: a head still breaking the rules prints as its man's name.
  const never = (text: string) => banned(text, REPORT_NEVER).length > 0;
  const headed = {
    ...merged,
    headline: chosen ?? "",
    matches: new Map([...merged.matches].map(([code, piece]) => [code, { ...piece, sections: piece.sections.map((s) => ({ ...s, head: plainHead(s.head, s.pitch, surnames, never) })) }])),
  };
  // The sub-editor's last pass: each sentence still carrying a banned phrase goes back alone, and only a clean fix is kept.
  const fixes = faultySentences(headed, names);
  let draft = headed;
  if (fixes.length > 0) {
    const edited = await writeColumn(LINE_EDIT_VOICE, fixes.map((f, i) => `${i + 1}. ${f.sentence} [${f.words.join(", ")}]`).join("\n"), count).catch(() => null);
    const lines = Array.isArray(edited?.lines) ? edited.lines.map(String) : [];
    draft = applyFixes(headed, fixes, lines);
    say(`  reports: line edit fixed ${fixes.length - faultySentences(draft, names).length} of ${fixes.length} sentences`);
  }
  const kept: ReportsLog["kept"] = {};
  for (const code of codes) {
    const piece = draft.matches.get(code);
    kept[code] = piece === undefined ? "plain" : piece.standfirst === first.matches.get(code)?.standfirst ? "first" : "rewrite";
  }
  for (const code of codes.filter((c) => kept[c] === "plain")) {
    const why = attempts.flatMap((a, i) => a.faults.filter((f) => matchOf(f.section) === code && f.severity === "hard").map((f) => `attempt ${i + 1}: ${f.check} [${f.evidence}]`));
    say(`  ⚠ reports: match ${code} prints the plain line. ${why.join("; ") || "No attempt carried it."}`);
  }
  say(`  reports: headline ${chosen === null ? "none chosen, the lead result prints" : `"${chosen}"`} from ${candidates.length} of ${first.headlines.length} candidates`);
  return { draft, brief, log: { attempts: attempts.map((a) => ({ faults: [...a.faults] })), fan, kept, usage } };
}

/** The prose of the last few report days, newest first, so a new day does not echo them. */
function pastReports(): string[] {
  return readArchive(FANTRAX_LEAGUE_ID, "match-report")
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, REPORTS.pastDays)
    .map((story) => (story.extras?.reports ?? []).flatMap((r) => [r.standfirst, r.account, ...r.sections.map((x) => `${x.pitch} ${x.stake}`)]).join("\n"));
}

/** A match-day report as a column the dispatch files: the day's headline, the lead's result as the deck, and the cargo. */
export async function reportsColumn(job: ReportsJob, say: (message: string) => void): Promise<Record<string, unknown>> {
  const { draft, log } = await writeReports(job.day, job.gameweek, job.desks, pastReports(), say);
  say(`  reports ${job.day}: kept ${JSON.stringify(log.kept)}; ${log.usage.input} tokens in, ${log.usage.output} out`);
  const lead = plainStandfirst(job.desks[0]).replace(/\.$/u, "");
  return { headline: draft.headline === "" ? lead : draft.headline, deck: lead, body: "", reports: reportsCargo(job.desks, draft) };
}
