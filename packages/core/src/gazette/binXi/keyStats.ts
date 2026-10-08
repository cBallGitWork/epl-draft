import { surname, topLines } from "../reports/keyStats";
import type { StoryBinStat } from "./cargo";
import type { BinMan, BinXi } from "./select";

// The desk's key stats for the Bin XI, over the men printed on the page and nobody else. xG and xA
// print here as figures and never in the prose; a line whose leader has nought is left out.

export function binKeyStats(side: BinXi): StoryBinStat[] {
  const men = [...side.xi, ...side.bench];
  const out: StoryBinStat[] = [];

  const shots = leaders(men, (man) => man.shots ?? 0);
  if (shots !== null) {
    const onTarget = shots.men.length === 1 && shots.men[0].shotsOnTarget !== null ? ` (${shots.men[0].shotsOnTarget} on target)` : "";
    out.push({ label: "Most shots", value: `${names(shots.men)} ${shots.value}${onTarget}` });
  }
  const chances = leaders(men, (man) => man.chancesCreated ?? 0);
  if (chances !== null) out.push({ label: "Chances created", value: `${names(chances.men)} ${chances.value}` });
  out.push(...topLines(men));
  return out;
}

/** The men level on the most of one count, or null when nobody has any. */
function leaders(men: readonly BinMan[], value: (man: BinMan) => number): { men: BinMan[]; value: number } | null {
  const best = Math.max(0, ...men.map(value));
  return best === 0 ? null : { men: men.filter((man) => value(man) === best), value: best };
}

function names(men: readonly BinMan[]): string {
  return men.map((man) => surname(man.name)).join(", ");
}
