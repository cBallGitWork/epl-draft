import { surname } from "./keyStats";
import { played } from "./men";
import { isGoal, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";

// The league's side of one match, desk-made for the sidebar: the Draft Man of the Match, the top league scorers, and the men
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
  motm: FantasyMan | null;
  top: FantasyMan[];
  wire: FantasyMan[];
}

const TOP = 3;
const WIRE = 4;

export function fantasyPanel(match: ReportMatchInput, events: readonly MatchEvent[]): FantasyPanel {
  const goals = events.filter(isGoal);
  const scored = (m: ReportMan) => goals.filter((g) => g.kind !== "own-goal" && g.man?.code === m.code).length;
  const made = (m: ReportMan) => goals.filter((g) => g.other?.code === m.code).length;
  const did = (m: ReportMan) =>
    [scored(m) > 0 ? `${scored(m)} goal${scored(m) === 1 ? "" : "s"}` : null, made(m) > 0 ? `${made(m)} assist${made(m) === 1 ? "" : "s"}` : null].filter(Boolean).join(", ");
  const man = (m: ReportMan): FantasyMan => ({
    name: surname(m.name),
    club: match[m.side].shorts[0] ?? match[m.side].name,
    holder: m.holder?.team ?? null,
    points: m.points,
    did: did(m),
  });
  const held = match.men
    .filter((m) => played(m) && m.holder !== null && m.points !== null)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || scored(b) + made(b) - (scored(a) + made(a)) || b.minutes - a.minutes);
  const top = held.filter((m) => (m.points ?? 0) > 0).slice(0, TOP).map(man);
  return {
    motm: top[0] ?? null,
    top,
    // Free agents who returned, goals first, so the sidebar names the few worth a look.
    wire: match.men
      .filter((m) => played(m) && m.holder === null && scored(m) + made(m) > 0)
      .sort((a, b) => scored(b) * 2 + made(b) - (scored(a) * 2 + made(a)))
      .slice(0, WIRE)
      .map(man),
  };
}
