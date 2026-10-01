import { BIN_XI } from "../../config";
import { surname } from "../reports/keyStats";
import type { StoryBinStat } from "./cargo";
import type { BinMan, BinXi } from "./select";

// The desk's key stats for the Bin XI, over the men printed on the page and nobody else. xG and xA
// print here as figures and never in the prose (Craig, 28 Sep 2026). A line whose leader has nought
// is left out: a stat box proves, it does not sneer.

const { topMen: TOP_MEN, expectedGoals: TOP_XG, expectedAssists: TOP_XA } = BIN_XI.stats;

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

  const top = (value: (man: BinMan) => number, least: number) =>
    [...men].filter((man) => value(man) >= least).sort((a, b) => value(b) - value(a)).slice(0, TOP_MEN)
      .map((man) => `${surname(man.name)} ${value(man).toFixed(2)}`).join(", ");
  const xg = top((man) => man.expectedGoals, TOP_XG);
  if (xg !== "") out.push({ label: "Top xG", value: xg });
  const xa = top((man) => man.expectedAssists, TOP_XA);
  if (xa !== "") out.push({ label: "Top xA", value: xa });
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
