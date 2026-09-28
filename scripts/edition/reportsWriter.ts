import {
  REPORTS,
  buildReportsBrief,
  checkReports,
  fanBrief,
  fanFaults,
  matchBlock,
  matchOf,
  mergeReports,
  readReportsDraft,
  surname,
  type Fault,
  type MatchDesk,
  type ReportsDraft,
} from "@epl/core";
import { writeColumn } from "./newsroom";
import { FAN_VOICE, REPORTS_VOICE, reportsSendBack } from "./voice/reports";

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
  const blocks = new Map(desks.map((desk, i) => [desk.match.fixture.code, matchBlock(desk, i === 0)]));
  const ctx = { desks, blocks, gameweek, past };
  const codes = desks.map((d) => d.match.fixture.code);
  const surnames = desks.flatMap((d) => d.match.men.map((m) => surname(m.name)));

  // A long day is written in calls of at most `perCall` matches; each later call sees what is already on the page.
  const brief = buildReportsBrief(day, gameweek, desks);
  const first: ReportsDraft = { headline: "", matches: new Map() };
  for (let at = 0; at < desks.length; at += REPORTS.perCall) {
    const chunk = desks.slice(at, at + REPORTS.perCall);
    const written = [...first.matches.values()].map((p) => `${p.standfirst} ${p.account}`).join("\n");
    const part = buildReportsBrief(day, gameweek, chunk) + (written === "" ? "" : `\n\nALREADY ON THE PAGE, not to be echoed:\n${written}`);
    const draft = readReportsDraft(await writeColumn(REPORTS_VOICE, part, count), surnames);
    if (first.headline === "") first.headline = draft.headline;
    for (const [code, piece] of draft.matches) first.matches.set(code, piece);
  }
  const faults1 = checkReports(first, ctx);

  const fanRaw = await writeColumn(FAN_VOICE, fanBrief(first, desks), count).catch(() => null);
  const fan = fanRaw === null ? [] : fanFaults(fanRaw, first, REPORTS.fanFlags);
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

  const draft = mergeReports(attempts, codes);
  const kept: ReportsLog["kept"] = {};
  for (const code of codes) {
    const piece = draft.matches.get(code);
    kept[code] = piece === undefined ? "plain" : piece === first.matches.get(code) ? "first" : "rewrite";
  }
  return { draft, brief, log: { attempts: attempts.map((a) => ({ faults: [...a.faults] })), fan, kept, usage } };
}
