import { DRAFT_DESK } from "../../config";
import { autoSubs, blank, type AutoSub } from "./autoSubs";
import type { DraftMan, DraftMatchupInput, DraftSide, PositionLimits, SlotWorth } from "./types";

// A match-up at the cut-off in fantasy terms: the score with Fantrax's coming substitutions counted, who is left to play,
// what one goal from each of them is worth against the margin, and the men worth a line. Facts only; the writer judges.

export interface SideState {
  side: DraftSide;
  subs: AutoSub[];
  /** Fantrax's total plus the points of reserves certain to come on. */
  total: number;
  /** Men in the eleven, or certain to come into it, with a match still to play. */
  left: DraftMan[];
}

export interface MatchupState {
  home: SideState;
  away: SideState;
  /** Home minus away. */
  margin: number;
  lines: string[];
}

const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
const tag = (man: DraftMan) => `${man.name} (${man.club}, ${man.slot})`;

function sideState(side: DraftSide, limits: PositionLimits): SideState {
  const subs = autoSubs(side.eleven, side.bench, limits);
  const coming = subs.filter((s) => !s.provisional).reduce((sum, s) => sum + (s.in.points ?? 0), 0);
  const eleven = side.eleven.filter((m) => !subs.some((s) => s.out === m));
  const left = [...eleven, ...subs.map((s) => s.in)].filter((m) => m.left > 0);
  return { side, subs, total: (side.total ?? 0) + coming, left };
}

/** What one goal from each man still to play does to the margin, for the side behind or level. */
function swing(chasing: SideState, ahead: SideState, gap: number, worth: SlotWorth): string[] {
  const name = chasing.side.name;
  if (chasing.left.length === 0) return ahead.left.length === 0 ? [] : [`${name} have nobody left to play; ${ahead.side.name} have ${ahead.left.length}`];
  const goals = chasing.left.map((m) => ({ m, worth: worth.goal[m.slot] ?? 0 }));
  const winners = goals.filter((g) => g.worth > gap);
  const levellers = goals.filter((g) => g.worth === gap);
  const lines = [`${name} have ${chasing.left.length} to play: ${chasing.left.map(tag).join(", ")}`];
  if (ahead.left.length === 0) {
    if (winners.length > 0) lines.push(`one goal from ${winners.map((g) => `${g.m.name} (worth ${g.worth})`).join(", ")} would win it for ${name}`);
    if (levellers.length > 0) lines.push(`one goal from ${levellers.map((g) => g.m.name).join(", ")} would level it`);
    if (winners.length + levellers.length === 0) lines.push(`${name} need more than one goal from any of them`);
  } else {
    lines.push(`${ahead.side.name} still have ${ahead.left.length} to play too: ${ahead.left.map(tag).join(", ")}`);
  }
  return lines;
}

/** The men worth a line on one side: reserves who scored, big and small scores, early exits, debuts, doubles, blanks. */
function talkingPoints(state: SideState): string[] {
  const { side, subs } = state;
  const lines: string[] = [];
  const cameOn = new Set(subs.map((s) => s.in.fantraxId));
  for (const s of subs) lines.push(`${s.out.name} (${s.out.club}) did not play; ${s.in.name} (${s.in.club}) comes on from the bench${s.provisional ? " if he plays" : `, bringing ${pts(s.in.points ?? 0)}`}`);
  for (const m of side.eleven.filter((x) => blank(x) && !subs.some((s) => s.out === x))) lines.push(`${m.name} (${m.club}) did not play, and nobody on the bench can come on for him`);
  for (const m of side.bench.filter((x) => !cameOn.has(x.fantraxId) && (x.points ?? 0) >= DRAFT_DESK.benchScore)) lines.push(`${m.name} (${m.club}) scored ${pts(m.points ?? 0)} on the bench, which do not count`);
  for (const m of side.eleven) {
    if ((m.points ?? 0) >= DRAFT_DESK.bigScore) lines.push(`${m.name} (${m.club}) scored ${pts(m.points ?? 0)}`);
    else if (m.minutes > 0 && m.left === 0 && (m.points ?? 0) <= DRAFT_DESK.lowScore) lines.push(`${m.name} (${m.club}) played and scored ${pts(m.points ?? 0)}`);
    if (m.minutes > 0 && m.minutes < DRAFT_DESK.earlyOff && m.left === 0) lines.push(`${m.name} (${m.club}) played ${m.minutes} minutes`);
    if (m.debut && m.minutes > 0) lines.push(`${m.name} (${m.club}) started for ${side.name} for the first time`);
    if (m.played + m.left > 1) lines.push(`${m.name} (${m.club}) has ${m.played + m.left} matches this period`);
  }
  return lines.map((l) => `${side.name}: ${l}`);
}

export function matchupState(input: DraftMatchupInput, worth: SlotWorth, limits: PositionLimits): MatchupState {
  const home = sideState(input.home, limits);
  const away = sideState(input.away, limits);
  const margin = home.total - away.total;
  const [ahead, behind] = margin >= 0 ? [home, away] : [away, home];
  const gap = Math.abs(margin);
  // Fantrax's score as it stands; the lead is judged with the substitutions it will make, when they change the score.
  const now = `${home.side.name} ${home.side.total ?? 0}-${away.side.total ?? 0} ${away.side.name}`;
  const subbed = home.total !== (home.side.total ?? 0) || away.total !== (away.side.total ?? 0);
  const lines = [
    `${now}${subbed ? `; ${home.total}-${away.total} with the substitutions Fantrax will make` : ""}: ${gap === 0 ? "level" : `${ahead.side.name} lead by ${pts(gap)}`}`,
    ...swing(behind, ahead, gap, worth),
    ...(gap === 0 ? swing(ahead, behind, gap, worth).slice(1) : []),
    ...talkingPoints(home),
    ...talkingPoints(away),
  ];
  return { home, away, margin, lines };
}
