import { DODGERS } from "../config";
import type { MomentKind, PlMoment } from "../football/premierleague/moments";
import type { Fixture, PlayerMatchStats } from "../football/types";
import { isResolved, type ResolvedPlayer, type RosteredTeam } from "../join/roster";
import { CLEAN_SHEET, categoryPoints, type ScoringRules } from "../league/scoring";

// The Points Dodgers: the league's men who came closest to points in the real football and got none.
// Nearness ranks them and is never printed; the brief prints only what happened (Craig, 30 Sep 2026).

/** A moment he nearly returned, at the clock as printed. */
export interface NearMiss {
  kind: keyof typeof DODGERS.weight;
  minute: string;
}

export interface Dodger {
  playerName: string;
  playerCode: number;
  clubId: number;
  position: string;
  ownerTeamId: string;
  ownerName: string;
  minutes: number;
  misses: NearMiss[];
  shots: number;
  onTarget: number;
  /** Shots from inside the box, and of them from close range or the six-yard box. */
  inBox: number;
  close: number;
  chancesMade: number;
  /** Expected goals and assists plus each miss's weight; orders the column, never printed. */
  nearness: number;
}

/** One finished match's commentary, men as FPL codes. */
export interface DodgerMatch {
  fixture: Fixture;
  moments: readonly PlMoment[];
}

const SHOTS: ReadonlySet<MomentKind> = new Set(["saved", "missed", "blocked", "woodwork", "penalty-missed", "penalty-saved"]);
const ON_TARGET: ReadonlySet<MomentKind> = new Set(["saved", "penalty-saved"]);
const OWN_MISSES: ReadonlySet<MomentKind> = new Set(["ruled-out", "penalty-missed", "penalty-saved", "woodwork"]);
const CLOSE = new Set(["from close range", "from inside the six-yard box"]);
const IN_BOX = new Set([...CLOSE, "from inside the box"]);

export function dodgers(input: {
  teams: readonly RosteredTeam[];
  matches: readonly DodgerMatch[];
  /** The league's scoring, which says where a clean sheet pays; null pays none. */
  scoring: ScoringRules | null;
  /** FPL code → club, for which side a goal went in for. */
  clubOfCode: ReadonlyMap<number, number>;
}): Dodger[] {
  const byFixture = new Map(input.matches.map((match) => [match.fixture.id, match]));
  const found: Dodger[] = [];
  for (const team of input.teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered) || rostered.slot.position === null) continue;
      const dodger = dodgerOf(rostered, rostered.slot.position, team, byFixture, input);
      if (dodger !== null && dodger.nearness >= DODGERS.from) found.push(dodger);
    }
  }
  return found.sort((a, b) => b.nearness - a.nearness).slice(0, DODGERS.shown);
}

function dodgerOf(
  rostered: ResolvedPlayer,
  position: string,
  team: RosteredTeam,
  byFixture: ReadonlyMap<number, DodgerMatch>,
  input: Parameters<typeof dodgers>[0],
): Dodger | null {
  const played = rostered.stats.filter((stat) => stat.minutes > 0);
  if (played.length === 0) return null;
  const pays = input.scoring !== null && (categoryPoints(input.scoring, CLEAN_SHEET, position) ?? 0) > 0;
  // Any return is points: he is not a dodger, whatever else he missed.
  if (played.some((stat) => stat.goals > 0 || stat.assists > 0 || (pays && stat.cleanSheet))) return null;

  const code = rostered.player.code;
  const clubId = rostered.player.clubId;
  const dodger: Dodger = {
    playerName: rostered.player.name,
    playerCode: code,
    clubId,
    position,
    ownerTeamId: team.teamId,
    ownerName: team.teamName,
    minutes: sum(played, (stat) => stat.minutes),
    misses: [],
    shots: 0,
    onTarget: 0,
    inBox: 0,
    close: 0,
    chancesMade: 0,
    nearness: sum(played, (stat) => stat.expectedGoals + stat.expectedAssists),
  };

  for (const stat of played) {
    const match = byFixture.get(stat.fixtureId);
    if (match === undefined) continue;
    for (const moment of match.moments) {
      const [man, other] = moment.men;
      if (man === code && OWN_MISSES.has(moment.kind)) miss(dodger, moment.kind as NearMiss["kind"], moment.minute);
      if (man === code && SHOTS.has(moment.kind)) {
        dodger.shots += 1;
        if (ON_TARGET.has(moment.kind)) dodger.onTarget += 1;
        if (IN_BOX.has(moment.shot?.from ?? "")) dodger.inBox += 1;
        if (CLOSE.has(moment.shot?.from ?? "")) dodger.close += 1;
      }
      if (other === code && SHOTS.has(moment.kind) && moment.shot?.situation !== "penalty") {
        dodger.chancesMade += 1;
        if (moment.kind === "woodwork") miss(dodger, "set-up-woodwork", moment.minute);
      }
    }
    const lost = pays ? lateGoalAgainst(match, clubId, stat, input.clubOfCode) : null;
    if (lost !== null) miss(dodger, "clean-sheet-lost", lost);
  }
  return dodger;
}

function miss(dodger: Dodger, kind: NearMiss["kind"], minute: string): void {
  dodger.misses.push({ kind, minute });
  dodger.nearness += DODGERS.weight[kind];
}

/** The minute of the one goal his side let in, when it came late and he was on for it; else null. */
function lateGoalAgainst(
  match: DodgerMatch,
  clubId: number,
  stat: PlayerMatchStats,
  clubOfCode: ReadonlyMap<number, number>,
): string | null {
  const against = match.moments.filter((moment) => {
    const scorer = moment.men[0] === null ? undefined : clubOfCode.get(moment.men[0]);
    if (scorer === undefined) return false;
    if (moment.kind === "own-goal") return scorer === clubId;
    return (moment.kind === "goal" || moment.kind === "penalty-goal") && scorer !== clubId;
  });
  if (against.length !== 1) return null;
  const at = Number.parseInt(against[0].minute, 10);
  // On the pitch at least as long as the clock read: a starter still on, never a late substitute.
  if (Number.isNaN(at) || at < DODGERS.lateGoal || stat.minutes < at) return null;
  return against[0].minute;
}

function sum<T>(rows: readonly T[], of: (row: T) => number): number {
  return rows.reduce((total, row) => total + of(row), 0);
}
