import {
  REPORTS,
  buildReportsBrief,
  checkReports,
  fanBrief,
  applyFixes,
  faultySentences,
  fanFaults,
  fanHeadline,
  punBrief,
  readHeadlines,
  strike,
  survivors,
  matchBlock,
  matchOf,
  mergeReports,
  plainHead,
  readReportsDraft,
  weaveBrief,
  REPORT_NEVER,
  banned,
  surname,
  type Fault,
  type MatchDesk,
  type ReportsDraft,
} from "@epl/core";
import { FANTRAX_LEAGUE_ID, plainStandfirst, reportsCargo } from "@epl/core";
import { writeColumn, type Say } from "./newsroom";
import { serious } from "./sendBack";
import { readArchive } from "./persist";
import type { ReportsJob } from "./reports";
import { FAN_VOICE, LINE_EDIT_VOICE, PUN_VOICE, REPORTS_VOICE, WEAVE_VOICE, reportsSendBack } from "./voice/reports";

// The match desk's newsroom: the reporter writes the day, the editor checks every match against its facts, the fan reads
// it back, it goes back once for what either found, each match keeps its best attempt, and the senior writer weaves it.

interface ReportsLog {
  attempts: { faults: Fault[] }[];
  fan: Fault[];
  kept: Record<number, "first" | "rewrite" | "woven" | "plain">;
  usage: { input: number; output: number };
}

export async function writeReports(
  day: string,
  gameweek: number,
  desks: readonly MatchDesk[],
  past: readonly string[],
  say: Say,
  /** `sendBack: false` is a proof's test mode: the first attempt stands with its faults logged, and calls are saved. */
  options: { sendBack?: boolean } = {},
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
  // The pun writer's go, on the lead match alone; its candidates join the reporter's before the strike and the judge.
  const puns = await writeColumn(PUN_VOICE, punBrief(desks[0], first.headlineStory ?? ""), count, "helper").then(readHeadlines).catch(() => ({ headlines: [], meanings: {} }));
  first.headlines.push(...puns.headlines.filter((h) => !first.headlines.includes(h)));
  first.meanings = { ...first.meanings, ...puns.meanings };
  const candidates = survivors(first.headlines, names);
  for (const h of first.headlines) say(`    headline candidate: "${h}"${candidates.includes(h) ? "" : ` struck (${strike(h, names)})`}${first.meanings?.[h] === undefined ? "" : ` [${first.meanings[h]}]`}`);
  const fanRaw = await writeColumn(FAN_VOICE, fanBrief(first, desks, candidates), count, "helper").catch(() => null);
  const fan = fanRaw === null ? [] : fanFaults(fanRaw, first, REPORTS.fanFlags);
  const chosen = fanRaw === null ? null : fanHeadline(fanRaw, candidates);
  if (fanRaw === null) say("  ⚠ reports: the fan's read-back failed; the mechanical checks stand alone.");

  const sendable = serious([...faults1, ...fan]);
  const attempts = [{ draft: first, faults: [...faults1, ...fan] }];
  if (sendable.length > 0 && options.sendBack !== false) {
    say(`  ↩ reports: ${sendable.length} faults, sent back once`);
    const again = await writeColumn(REPORTS_VOICE, `${brief}\n\n${reportsSendBack(sendable)}`, count).catch(() => null);
    if (again !== null) {
      const second = readReportsDraft(again, surnames);
      // The rewrite holds only the matches sent back; every other match is judged on its first attempt.
      const faults2 = checkReports(second, ctx).filter((f) => f.section === "headline" || second.matches.has(matchOf(f.section)) || f.section === "day");
      attempts.push({ draft: second, faults: faults2 });
    }
  }

  const checked = mergeReports(attempts, codes);
  // The senior writer's pass over what survived; each match keeps the woven copy unless it breaks more rules than before.
  const woven = await weave(day, gameweek, checked, ctx, codes, surnames, count, say);
  const merged = woven.draft;
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
    const edited = await writeColumn(LINE_EDIT_VOICE, fixes.map((f, i) => `${i + 1}. ${f.sentence} [${f.words.join(", ")}]`).join("\n"), count, "helper").catch(() => null);
    const lines = Array.isArray(edited?.lines) ? edited.lines.map(String) : [];
    draft = applyFixes(headed, fixes, lines);
    say(`  reports: line edit fixed ${fixes.length - faultySentences(draft, names).length} of ${fixes.length} sentences`);
  }
  const kept: ReportsLog["kept"] = {};
  for (const code of codes) {
    const piece = draft.matches.get(code);
    kept[code] = piece === undefined ? "plain" : woven.codes.has(code) ? "woven" : piece.standfirst === first.matches.get(code)?.standfirst ? "first" : "rewrite";
  }
  for (const code of codes.filter((c) => kept[c] === "plain")) {
    const why = attempts.flatMap((a, i) => a.faults.filter((f) => matchOf(f.section) === code && f.severity === "hard").map((f) => `attempt ${i + 1}: ${f.check} [${f.evidence}]`));
    say(`  ⚠ reports: match ${code} prints the plain line. ${why.join("; ") || "No attempt carried it."}`);
  }
  say(`  reports: headline ${chosen === null ? "none chosen, the lead result prints" : `"${chosen}"`} from ${candidates.length} of ${first.headlines.length} candidates`);
  return { draft, brief, log: { attempts: attempts.map((a) => ({ faults: [...a.faults] })), fan, kept, usage } };
}

/** One call per match, all at once, each with its own facts; a match whose woven copy has a hard fault, or more faults
 *  than the checked one, keeps the checked one. */
async function weave(
  day: string,
  gameweek: number,
  checked: ReportsDraft,
  ctx: Parameters<typeof checkReports>[1],
  codes: readonly number[],
  surnames: readonly string[],
  count: (u: { input_tokens?: number; output_tokens?: number }) => void,
  say: Say,
): Promise<{ draft: ReportsDraft; codes: Set<number> }> {
  const present = codes.filter((code) => checked.matches.has(code));
  const woven: ReportsDraft = { headline: "", headlines: [], matches: new Map() };
  await Promise.all(
    present.map(async (code) => {
      const desk = ctx.desks.find((d) => d.match.fixture.code === code)!;
      const raw = await writeColumn(WEAVE_VOICE, weaveBrief(buildReportsBrief(day, gameweek, [desk]), checked, [code]), count).catch((error: unknown) => {
        say(`  ⚠ reports: the senior writer failed on match ${code}: ${error instanceof Error ? error.message.slice(0, 160) : String(error)}`);
        return null;
      });
      const piece = raw === null ? undefined : readReportsDraft(raw, surnames).matches.get(code);
      // The standfirst was checked and stays as filed: the first woven filing rewrote Spurs' into a result that never happened.
      if (piece !== undefined) woven.matches.set(code, { ...piece, standfirst: checked.matches.get(code)!.standfirst });
    }),
  );
  const before = checkReports(checked, ctx);
  const after = checkReports(woven, ctx).filter((f) => f.section === "day" || woven.matches.has(matchOf(f.section)));
  const draft = { ...checked, matches: mergeReports([{ draft: woven, faults: after }, { draft: checked, faults: before }], present).matches };
  const kept = new Set(present.filter((code) => draft.matches.get(code) === woven.matches.get(code)));
  say(`  reports: woven ${kept.size} of ${present.length}; faults ${serious(before).length} before, ${serious(after).length} woven`);
  for (const f of serious(after)) say(`    woven fault ${f.section}: ${f.check} [${f.evidence}]`);
  return { draft, codes: kept };
}

/** The prose of the last few report days, newest first, so a new day does not echo them. */
function pastReports(): string[] {
  return readArchive(FANTRAX_LEAGUE_ID, "match-report")
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, REPORTS.pastDays)
    .map((story) => (story.extras?.reports ?? []).flatMap((r) => [r.standfirst, r.account, ...r.sections.map((x) => `${x.pitch} ${x.stake}`)]).join("\n"));
}

/** A match-day report as a column the dispatch files: the day's headline, the lead's result as the deck, and the cargo. */
export async function reportsColumn(job: ReportsJob, say: Say): Promise<Record<string, unknown>> {
  const { draft, log } = await writeReports(job.day, job.gameweek, job.desks, pastReports(), say);
  say(`  reports ${job.day}: kept ${JSON.stringify(log.kept)}; ${log.usage.input} tokens in, ${log.usage.output} out`);
  const lead = plainStandfirst(job.desks[0]).replace(/\.$/u, "");
  return { headline: draft.headline === "" ? lead : draft.headline, deck: lead, body: "", reports: reportsCargo(job.desks, draft) };
}
