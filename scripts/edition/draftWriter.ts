import {
  DRAFT_WRITING,
  buildDraftBrief,
  checkDraft,
  draftBlocks,
  draftCargo,
  fanHeadline,
  matchupOf,
  mergeDraft,
  readDraftWriting,
  readHeadlines,
  strike,
  survivors,
  type Cutoff,
  type Fault,
  type MatchupContext,
} from "@epl/core";
import { writeColumn } from "./newsroom";
import { DRAFT_JUDGE_VOICE, DRAFT_VOICE, draftSendBack } from "./voice/draft";
import { PUN_VOICE } from "./voice/reports";

// The draft report's newsroom, the Prem report's in miniature: the reporter writes the gameweek's match-ups, the editor
// checks each against its block, the pun writer offers headlines, a manager in the league picks one and flags what no
// manager would say, it goes back once, and each match-up keeps its better attempt.

export interface DraftJob {
  cutoff: Cutoff;
  gameweek: number;
  /** The lead first. */
  contexts: MatchupContext[];
  rankAfter: Map<string, number>;
}

type Usage = { input_tokens?: number; output_tokens?: number };

/** The judge's quotes, capped per match-up; a quote not in the writing is dropped. */
function judgeFlags(raw: Record<string, unknown>, prose: ReadonlyMap<number, string>): Fault[] {
  const flags = Array.isArray(raw.flags) ? raw.flags : [];
  const kept = new Map<number, number>();
  return flags.flatMap((f): Fault[] => {
    const r = typeof f === "object" && f !== null ? (f as Record<string, unknown>) : {};
    const n = Number(r.number);
    const quote = typeof r.quote === "string" ? r.quote.trim() : "";
    if (quote === "" || !(prose.get(n) ?? "").includes(quote) || (kept.get(n) ?? 0) >= 3) return [];
    kept.set(n, (kept.get(n) ?? 0) + 1);
    return [{ section: `${n}:matchup`, check: "a manager in the league would not say this", severity: "send-back", evidence: `${quote} (${typeof r.why === "string" ? r.why : ""})` }];
  });
}

export async function draftColumn(job: DraftJob, say: (message: string) => void): Promise<Record<string, unknown>> {
  const usage = { input: 0, output: 0 };
  const count = (u: Usage) => ((usage.input += u.input_tokens ?? 0), (usage.output += u.output_tokens ?? 0));
  const brief = buildDraftBrief(job.cutoff, job.gameweek, job.contexts);
  const blocks = draftBlocks(job.cutoff, job.contexts);
  const men = job.contexts.flatMap((c) => [c.state.home.side, c.state.away.side]).flatMap((s) => [...s.eleven, ...s.bench]);
  const surnames = men.map((m) => m.name.split(/\s+/u).at(-1) ?? m.name);
  const names = [...job.contexts.flatMap((c) => [c.state.home.side.name, c.state.away.side.name]), ...men.map((m) => m.name)];

  const first = readDraftWriting(await writeColumn(DRAFT_VOICE, brief, count), surnames);
  const faults1 = checkDraft(first, job.contexts, blocks);

  // The pun writer's go on the lead match-up alone; its candidates join the reporter's before the strike and the judge.
  const puns = await writeColumn(PUN_VOICE, `THE STORY: ${first.headlineStory}\n\n${blocks[0] ?? ""}`, count).then(readHeadlines).catch(() => ({ headlines: [], meanings: {} }));
  const offered = [...first.headlines, ...puns.headlines.filter((h) => !first.headlines.includes(h))].slice(0, DRAFT_WRITING.puns + 6);
  const meanings = { ...first.meanings, ...puns.meanings };
  const candidates = survivors(offered, names);
  for (const h of offered) say(`    headline candidate: "${h}"${candidates.includes(h) ? "" : ` struck (${strike(h, names)})`} [${meanings[h] ?? ""}]`);

  const prose = new Map([...first.matchups].map(([n, p]) => [n, [p.standfirst, ...p.paragraphs].join("\n")]));
  const judged = [`HEADLINE CANDIDATES for the lead match-up (${first.headlineStory}):`, ...candidates.map((h, i) => `${i + 1}. ${h} [${meanings[h] ?? ""}]`), "", ...[...prose].map(([n, text]) => `MATCH-UP ${n}:\n${text}`)].join("\n");
  const judgeRaw = await writeColumn(DRAFT_JUDGE_VOICE, judged, count).catch(() => null);
  const chosen = judgeRaw === null ? null : fanHeadline(judgeRaw, candidates);
  const flags = judgeRaw === null ? [] : judgeFlags(judgeRaw, prose);

  const sendable = [...faults1, ...flags].filter((f) => f.severity !== "warn");
  const attempts = [{ writing: first, faults: [...faults1, ...flags] }];
  if (sendable.length > 0) {
    say(`  ↩ draft report: ${sendable.length} faults, sent back once`);
    const again = await writeColumn(DRAFT_VOICE, `${brief}\n\n${draftSendBack(sendable)}`, count).catch(() => null);
    if (again !== null) {
      const second = readDraftWriting(again, surnames);
      attempts.push({ writing: second, faults: checkDraft(second, job.contexts, blocks).filter((f) => second.matchups.has(matchupOf(f.section)) || f.section === "page") });
    }
  }
  const pieces = mergeDraft(attempts, job.contexts.length);
  for (const f of attempts.at(-1)!.faults.filter((x) => x.severity !== "warn")) say(`    fault ${f.section}: ${f.check} [${f.evidence}]`);
  const lead = job.contexts[0]?.state.score ?? "";
  say(`  draft report: ${pieces.size} of ${job.contexts.length} match-ups written; headline ${chosen === null ? "none chosen, the lead verdict prints" : `"${chosen}"`}; ${usage.input} tokens in, ${usage.output} out`);
  return { headline: chosen ?? lead, deck: lead, body: "", draft: draftCargo(job.cutoff, job.gameweek, job.contexts, pieces, job.rankAfter) };
}
