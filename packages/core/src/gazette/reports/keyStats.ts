import { REPORTS } from "../../config";
import { played } from "./men";
import { assistsBy, goalsBy, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput, Side } from "./types";
import { plural } from "../../format";

// The key-stats box: desk-made lines with figures, never written by the model. xG and xA print here (Craig, 28 Sep 2026:
// "for key stats, can use xg/xa etc, most shots, most chances created"); the prose stays in words. No line says what a man
// failed to do: a stat box proves, it does not sneer.

export interface KeyStat {
  label: string;
  value: string;
}

const PARTICLES = new Set(["van", "de", "da", "dos", "der", "den", "di", "le", "la", "ter"]);

/** "Jan Paul van Hecke" → "van Hecke"; "Sávio" → "Sávio". */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  const at = parts.findIndex((part, i) => i > 0 && PARTICLES.has(part));
  return at > 0 ? parts.slice(at).join(" ") : (parts.at(-1) ?? name);
}

const { mostShots: MOST_SHOTS, chances: CHANCES, expectedAssists: EXPECTED_ASSISTS, saves: SAVES } = REPORTS.stats;
/** How many men a top-xG or top-xA line names, and the least that earns a place in it. */
const TOP_MEN = 3;
const TOP_XG = 0.2;
const TOP_XA = 0.15;

/** The men who lead one count, and the count, or null when nobody reaches `least`. */
function leaders(men: readonly ReportMan[], value: (m: ReportMan) => number, least: number): { men: ReportMan[]; value: number } | null {
  const best = Math.max(0, ...men.map(value));
  return best < least ? null : { men: men.filter((m) => value(m) === best), value: best };
}

export function keyStats(
  match: ReportMatchInput,
  events: readonly MatchEvent[],
  counts: ReadonlyMap<number, ManCounts>,
  budget: number,
): KeyStat[] {
  const men = match.men.filter(played);
  const c = (m: ReportMan) => counts.get(m.code);
  const scored = (m: ReportMan) => goalsBy(events, m.code);
  const assists = (m: ReportMan) => assistsBy(events, m.code);
  const short = (side: Side) => match[side].shorts[0] ?? match[side].name;
  const names = (list: readonly ReportMan[]) => list.map((m) => surname(m.name)).join(", ");
  const out: KeyStat[] = [];

  const xg = (side: Side) => men.filter((m) => m.side === side).reduce((sum, m) => sum + m.expectedGoals, 0);
  if (men.some((m) => m.expectedGoals > 0)) out.push({ label: "xG", value: `${short("home")} ${xg("home").toFixed(2)}, ${short("away")} ${xg("away").toFixed(2)}` });
  if (match.figures !== null) {
    const { home, away } = match.figures;
    out.push({ label: "Shots", value: `${home.shots} (${home.onTarget} on target) - ${away.shots} (${away.onTarget}); corners ${home.corners}-${away.corners}` });
  }
  const shots = leaders(men, (m) => c(m)?.shots ?? 0, MOST_SHOTS);
  if (shots !== null && shots.men.length === 1) {
    const [man] = shots.men;
    const goals = scored(man);
    out.push({ label: "Most shots", value: `${surname(man.name)} ${shots.value} (${c(man)?.onTarget ?? 0} on target${goals > 0 ? `, ${goals} ${plural(goals, "goal")}` : ""})` });
  }
  const chances = leaders(men, (m) => c(m)?.chancesMade ?? 0, 1);
  const byXa = [...men].sort((a, b) => b.expectedAssists - a.expectedAssists)[0];
  if (chances !== null && (chances.value >= CHANCES || (byXa?.expectedAssists ?? 0) >= EXPECTED_ASSISTS)) {
    const made = chances.men.map((m) => `${surname(m.name)}${assists(m) > 0 ? ` (${assists(m)} ${plural(assists(m), "assist")})` : ""}`).join(", ");
    out.push({ label: "Chances created", value: `${made} ${chances.value}` });
  }
  // The men who got into the best positions and made the best chances, whether or not they scored.
  const top = (value: (m: ReportMan) => number, least: number) =>
    [...men].filter((m) => value(m) >= least).sort((a, b) => value(b) - value(a)).slice(0, TOP_MEN).map((m) => `${surname(m.name)} ${value(m).toFixed(2)}`).join(", ");
  const xgMen = top((m) => m.expectedGoals, TOP_XG);
  if (xgMen !== "") out.push({ label: "Top xG", value: xgMen });
  const xaMen = top((m) => m.expectedAssists, TOP_XA);
  if (xaMen !== "") out.push({ label: "Top xA", value: xaMen });
  const keepers = men.filter((m) => m.saves >= SAVES || events.some((e) => e.kind === "penalty-saved" && e.side !== m.side && m.line === "G"));
  if (keepers.length > 0) out.push({ label: "Saves", value: keepers.map((m) => `${surname(m.name)} ${m.saves}`).join(", ") });
  const woodwork = events.filter((e) => e.kind === "woodwork" && e.man !== null).map((e) => e.man!);
  if (woodwork.length > 0) out.push({ label: "Hit the woodwork", value: names(woodwork) });
  if (match.figures !== null) {
    const errors = (["home", "away"] as const).filter((s) => match.figures![s].errorsToGoal > 0).map((s) => `${short(s)} ${match.figures![s].errorsToGoal}`);
    if (errors.length > 0) out.push({ label: "Errors leading to a goal", value: errors.join(", ") });
  }
  return out.slice(0, budget);
}
