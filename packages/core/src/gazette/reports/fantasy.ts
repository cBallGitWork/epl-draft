import { surname } from "./keyStats";
import { played } from "./men";
import { isGoal, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";

// The league's side of one match, desk-made for the sidebar: the Draft Man of the Match, the top league scorers, and the men
// nobody holds who scored or made one (the only unheld men worth a line: somebody could still pick them up).

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
  /** Who had an off day: chances not taken, or a high pick who gave his holder little. `did` says why. */
  offDays: FantasyMan[];
}

const TOP = 3;
const OFF_DAYS = 4;
/** A held starter who scored this few points had an off day. */
const LOW_POINTS = 1;
/** Expected goals worth a line when none went in. */
const WASTED_XG = 0.5;
const CLOSE = new Set(["from close range", "from inside the six-yard box"]);

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
  const close = (m: ReportMan) => events.filter((e) => (e.kind === "missed" || e.kind === "saved") && e.man?.code === m.code && CLOSE.has(e.shot?.from ?? "")).length;
  const offDay = (m: ReportMan): string | null => {
    if (scored(m) > 0) return null;
    const why: string[] = [];
    if (m.expectedGoals >= WASTED_XG) why.push(`${m.expectedGoals.toFixed(2)} xG, no goal`);
    if (close(m) > 0) why.push(`missed ${close(m) === 1 ? "a chance" : `${close(m)} chances`} from close range`);
    if (m.started && m.holder?.fielded === true && m.points !== null && m.points <= LOW_POINTS) {
      why.push(`${m.points} point${m.points === 1 ? "" : "s"}${m.holder.round === null ? "" : `, a round-${m.holder.round} pick`}`);
    }
    return why.length === 0 ? null : why.join("; ");
  };
  const offDays = match.men
    .filter(played)
    .flatMap((m) => {
      const why = offDay(m);
      return why === null ? [] : [{ ...man(m), did: why, weight: (m.holder?.round ?? 99) - m.expectedGoals * 10 }];
    })
    .sort((a, b) => a.weight - b.weight)
    .slice(0, OFF_DAYS)
    .map(({ weight: _, ...rest }) => rest);
  return {
    motm: top[0] ?? null,
    top,
    wire: match.men.filter((m) => played(m) && m.holder === null && scored(m) + made(m) > 0).map(man),
    offDays,
  };
}
