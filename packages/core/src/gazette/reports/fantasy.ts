import { surname } from "./keyStats";
import { played } from "./men";
import { assistsBy, goalsBy, isGoal, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";
import { howMany } from "../../format";

// The league's side of one match, desk-made for the sidebar: the top league scorers, and the men
// nobody holds who scored or made one (the only unheld men worth a line: somebody could still pick them up). A chance not
// taken is the report's to tell, not a panel's.

export interface FantasyMan {
  name: string;
  club: string;
  holder: string | null;
  points: number | null;
  /** "2 goals, 1 assist"; empty when he did neither. */
  did: string;
}

export interface FantasyPanel {
  top: FantasyMan[];
  wire: FantasyMan[];
}

const TOP = 3;
const WIRE = 4;

/** "2 goals, 1 assist"; empty when he did neither. */
export function didOf(goals: readonly MatchEvent[], code: number): string {
  const [scored, made] = [goalsBy(goals, code), assistsBy(goals, code)];
  return [scored > 0 ? howMany(scored, "goal") : null, made > 0 ? howMany(made, "assist") : null].filter(Boolean).join(", ");
}

/** His club as the sidebar names it: the short name, else the full one. */
export const sidebarClub = (match: ReportMatchInput, m: ReportMan) => match[m.side].shorts[0] ?? match[m.side].name;

export function fantasyPanel(match: ReportMatchInput, events: readonly MatchEvent[]): FantasyPanel {
  const goals = events.filter(isGoal);
  const scored = (m: ReportMan) => goalsBy(goals, m.code);
  const made = (m: ReportMan) => assistsBy(goals, m.code);
  const man = (m: ReportMan): FantasyMan => ({
    name: surname(m.name),
    club: sidebarClub(match, m),
    holder: m.holder?.team ?? null,
    points: m.points,
    did: didOf(goals, m.code),
  });
  const held = match.men
    .filter((m) => played(m) && m.holder !== null && m.points !== null)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || scored(b) + made(b) - (scored(a) + made(a)) || b.minutes - a.minutes);
  return {
    top: held.filter((m) => (m.points ?? 0) > 0).slice(0, TOP).map(man),
    // Free agents who returned, goals first, so the sidebar names the few worth a look.
    wire: match.men
      .filter((m) => played(m) && m.holder === null && scored(m) + made(m) > 0)
      .sort((a, b) => scored(b) * 2 + made(b) - (scored(a) * 2 + made(a)))
      .slice(0, WIRE)
      .map(man),
  };
}
