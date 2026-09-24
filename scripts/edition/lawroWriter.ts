import {
  LAWRO_CORE,
  applySkit,
  assembleLawro,
  checkLawro,
  mergeAttempts,
  readDraft,
  tieKey,
  type CheckContext,
  type Fault,
  type LawroDraft,
} from "@epl/core";
import { writeColumn } from "./newsroom";
import type { PredictionsDesk } from "./predictions";
import { LAWRO, SKIT, lawroSendBack } from "./voice/lawro";

// The newsroom behind Lawro's column: he writes, the editor reads him, he writes again once if he
// has to, the skit writer looks for a groaner, and the desk files his words beside its own calls.

const EMPTY: LawroDraft = { deck: "", intro: "", ties: new Map() };

/** The column ready to file. Throws only when the first call cannot be made at all, which leaves
 *  the key unspent for the next firing; every later failure files what was checked. */
export async function writeLawro(desk: PredictionsDesk, brief: string, facts: string, say: (message: string) => void): Promise<Record<string, unknown>> {
  const calls = desk.ties.map((tie) => tie.call);
  const named = new Map(desk.ties.flatMap((tie) => [[tie.home.teamId, tie.home.name], [tie.away.teamId, tie.away.name]] as const));
  const name = (teamId: string) => named.get(teamId) ?? teamId;
  const ctx: CheckContext = {
    calls,
    name,
    facts: [facts, LAWRO_CORE, ...desk.past.map((line) => line.line), ...desk.clubs, "Lawro"].join("\n"),
    offered: desk.past,
    names: desk.names,
    past: desk.archive.prose,
  };
  const label = (section: string) => {
    const call = calls.find((each) => tieKey(each.homeTeamId, each.awayTeamId) === section);
    return call === undefined ? `the ${section}` : `the tie ${name(call.homeTeamId)} v ${name(call.awayTeamId)}`;
  };

  const first = await writeColumn(LAWRO, brief);
  const attempts = [attempt(first, ctx)];
  const faults = attempts[0].faults.filter((fault) => fault.severity !== "warn");
  if (faults.length > 0) {
    say(`  ↩ lawro: ${faults.length} faults, sent back once: ${summary(faults)}`);
    const second = await writeColumn(LAWRO, `${brief}\n\n${lawroSendBack(faults, label)}`).catch(() => null);
    if (second !== null) attempts.push(attempt(second, ctx));
  }
  let draft = mergeAttempts(attempts, calls);
  const left = checkLawro(draft, ctx).filter((fault) => fault.severity !== "warn");
  if (left.length > 0) say(`  ⚠ lawro files with ${left.length} faults the rewrite kept: ${summary(left)}`);
  const empty = calls.filter((call) => draft.ties.get(tieKey(call.homeTeamId, call.awayTeamId))?.line === "");
  if (empty.length > 0) say(`  ⚠ lawro: ${empty.length} ties print their call alone; their prose failed twice.`);

  const skit = await writeColumn(SKIT, skitBrief(draft, desk, name)).catch((error: unknown) => {
    say(`  ⚠ skit: no edits, the call failed: ${String(error).slice(0, 160)}`);
    return null;
  });
  const edited = applySkit(skit, draft, { check: ctx, doubts: desk.doubts, wornShapes: desk.archive.shapes, wornTargets: desk.archive.targets, lastLines: desk.archive.lastLines });
  draft = edited.draft;
  if (edited.applied.length > 0 || edited.refused.length > 0) {
    say(`  ↩ skit: ${edited.applied.length} applied${edited.refused.length === 0 ? "" : `, refused ${edited.refused.join("; ")}`}`);
  }

  return assembleLawro({
    draft,
    calls,
    headline: `Lawro's Predictions: GW${desk.gameweek}`,
    men: new Map(desk.ties.map((tie) => [tieKey(tie.call.homeTeamId, tie.call.awayTeamId), [...tie.home.squad, ...tie.away.squad]])),
    record: desk.record.season.all,
    skit: edited.applied.map((edit) => ({ shape: edit.shape, target: edit.target })),
    threads: attempts.at(-1)?.raw.threads,
  });
}

function attempt(raw: Record<string, unknown>, ctx: CheckContext): { draft: LawroDraft; faults: Fault[]; raw: Record<string, unknown> } {
  const draft = readDraft(raw, ctx.calls);
  if (draft === null) return { draft: EMPTY, faults: [{ section: "column", check: "not the JSON shape", severity: "hard", evidence: "" }], raw };
  return { draft, faults: checkLawro(draft, ctx), raw };
}

function summary(faults: readonly Fault[]): string {
  return faults.slice(0, 6).map((fault) => `${fault.check} (${fault.evidence})`).join(", ");
}

/** The column as filed, and nothing else: the skit writer never sees the brief. */
function skitBrief(draft: LawroDraft, desk: PredictionsDesk, name: (teamId: string) => string): string {
  const ties = desk.ties.map(({ call }) => {
    const key = tieKey(call.homeTeamId, call.awayTeamId);
    const line = draft.ties.get(key)?.line ?? "";
    return line === "" ? null : `TIE ${key}, ${name(call.homeTeamId)} v ${name(call.awayTeamId)}${call.instinct === null ? "" : ", AGAINST THE FAVOURITES"}: ${line}`;
  });
  const worn = [
    desk.archive.shapes.length === 0 ? null : `Shapes: ${desk.archive.shapes.join(", ")}.`,
    desk.archive.targets.length === 0 ? null : `Targets: ${desk.archive.targets.join(", ")}.`,
  ].filter((line) => line !== null);
  return [
    "THE COLUMN AS FILED",
    `OPENING: ${draft.intro}`,
    ...ties.filter((line) => line !== null),
    worn.length === 0 ? null : `USED LATELY, and not yours this week. ${worn.join(" ")}`,
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
