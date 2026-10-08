import {
  LAWRO_CORE,
  PAPER_TITLE,
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
import { writeColumn, type Say } from "./newsroom";
import type { PredictionsDesk } from "./predictions";
import { faultSummary, sendBackOnce, serious } from "./sendBack";
import { SKIT, lawroSendBack, predictionsVoice } from "./voice/lawro";

// The newsroom behind Lawro's column: he writes, the editor reads him, he writes again once if he
// has to, the skit writer looks for a groaner, and the desk files his words beside its own calls.

const EMPTY: LawroDraft = { deck: "", intro: "", ties: new Map() };

/** The column ready to file. Throws only when the first call cannot be made at all, which leaves
 *  the key unspent for the next firing; every later failure files what was checked. */
export async function writeLawro(desk: PredictionsDesk, brief: string, facts: string, say: Say): Promise<Record<string, unknown>> {
  const calls = desk.ties.map((tie) => tie.call);
  const named = new Map(desk.ties.flatMap((tie) => [[tie.home.teamId, tie.home.name], [tie.away.teamId, tie.away.name]] as const));
  const name = (teamId: string) => named.get(teamId) ?? teamId;
  const ctx: CheckContext = {
    calls,
    name,
    // His ground and his paper are his to name: the voice sends Liverpool's visitors to Anfield.
    facts: [facts, LAWRO_CORE, ...desk.past.map((line) => line.line), ...desk.clubs, "Lawro", "Anfield", PAPER_TITLE].join("\n"),
    offered: desk.past,
    names: desk.names,
    past: desk.archive.prose,
    // Whose each man is, so a line naming him without his side goes back.
    holders: new Map(
      desk.ties.map((tie) => [
        tieKey(tie.call.homeTeamId, tie.call.awayTeamId),
        new Map([...tie.home.squad.map((man) => [man.name, tie.home.name] as const), ...tie.away.squad.map((man) => [man.name, tie.away.name] as const)]),
      ]),
    ),
  };
  const label = (section: string) => {
    const call = calls.find((each) => tieKey(each.homeTeamId, each.awayTeamId) === section);
    return call === undefined ? `the ${section}` : `the tie ${name(call.homeTeamId)} v ${name(call.awayTeamId)}`;
  };
  const voice = predictionsVoice(desk.ties.length);

  const attempts = await sendBackOnce({ desk: "lawro", voice, brief, read: (raw) => attempt(raw, ctx), sendBack: (faults) => lawroSendBack(faults, label) }, say);
  let draft = mergeAttempts(attempts, calls);
  const left = serious(checkLawro(draft, ctx));
  if (left.length > 0) say(`  ⚠ lawro files with ${left.length} faults the rewrite kept: ${faultSummary(left)}`);
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
