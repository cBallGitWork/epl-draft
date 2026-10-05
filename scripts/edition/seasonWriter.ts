import {
  FANTRAX_LEAGUE_ID,
  LAWRO_CORE,
  assembleSeason,
  checkSeason,
  lineKey,
  mergeSeason,
  readSeasonDraft,
  type CheckContext,
  type Fault,
  type SeasonDraft,
} from "@epl/core";
import { writeColumn } from "./newsroom";
import { readArchive } from "./persist";
import { proseOf } from "./predictions";
import type { SeasonDesk } from "./season";
import { lawroSendBack } from "./voice/lawro";
import { LAWRO_SEASON } from "./voice/lawroSeason";

// Lawro's power rankings through his newsroom: he writes, the editor reads him, he writes again once if he has to,
// and the desk files his words in its own order under its own headline.

const HEADLINE = "Lawro's Power Rankings";

/** The column ready to file. Throws only when the first call cannot be made at all, which leaves the key unspent. */
export async function writeSeason(desk: SeasonDesk, brief: string, say: (message: string) => void): Promise<Record<string, unknown>> {
  const named = new Map(desk.calls.sides.map((side) => [side.teamId, side.name]));
  const ctx: CheckContext = {
    calls: [],
    name: (teamId) => named.get(teamId) ?? teamId,
    // His ground and his paper are his to name, as in his weekly column.
    facts: [brief, LAWRO_CORE, ...desk.clubs, "Lawro", "Anfield", "Gazetta"].join("\n"),
    offered: [],
    names: desk.names,
    past: readArchive(FANTRAX_LEAGUE_ID, "predictions").sort((a, b) => b.period - a.period).map(proseOf),
  };
  const attempt = (raw: Record<string, unknown>) => {
    const draft = readSeasonDraft(raw, desk.calls);
    return draft === null ? { draft: EMPTY, faults: [{ section: "column", check: "not the JSON shape", severity: "hard", evidence: "" } as Fault] } : { draft, faults: checkSeason(draft, desk.calls, desk.squads, ctx) };
  };
  const label = (section: string) => (section.startsWith("table:") ? `the line for ${named.get(section.slice("table:".length)) ?? section}` : `the ${section}`);

  const attempts = [attempt(await writeColumn(LAWRO_SEASON, brief))];
  const faults = serious(attempts[0].faults);
  if (faults.length > 0) {
    say(`  ↩ lawro season: ${faults.length} faults, sent back once: ${summary(faults)}`);
    const second = await writeColumn(LAWRO_SEASON, `${brief}\n\n${lawroSendBack(faults, label)}`).catch(() => null);
    if (second !== null) attempts.push(attempt(second));
  }
  const draft = mergeSeason(attempts, desk.calls);
  const left = serious(checkSeason(draft, desk.calls, desk.squads, ctx));
  say(left.length === 0 ? "  ✓ lawro season: the editor passes every section" : `  ⚠ lawro season files with ${left.length} faults the rewrite kept: ${summary(left)}`);
  const empty = desk.calls.sides.filter((side) => draft.table.get(side.teamId) === "").map((side) => lineKey(side.teamId));
  if (empty.length > 0) say(`  ⚠ lawro season: ${empty.length} sides print their place alone; their line failed twice.`);
  return assembleSeason(draft, desk.calls, HEADLINE);
}

const EMPTY: SeasonDraft = { deck: "", opening: "", table: new Map() };

function serious(faults: readonly Fault[]): Fault[] {
  return faults.filter((fault) => fault.severity !== "warn");
}

function summary(faults: readonly Fault[]): string {
  return faults.slice(0, 8).map((fault) => `${fault.section} ${fault.check} (${fault.evidence})`).join(", ");
}
