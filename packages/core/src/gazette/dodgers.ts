import { DODGERS } from "../config";
import type { MomentKind, PlMoment } from "../football/premierleague/moments";
import type { Fixture, PlayerMatchStats } from "../football/types";
import { isResolved, type ResolvedPlayer, type RosteredTeam } from "../join/roster";
import { CLEAN_SHEET, categoryPoints, type ScoringRules } from "../league/scoring";

// The Points Dodgers: the league's men who came closest to points in the real football and did not get them.
// Goals, assists and clean sheets are dodged one by one, so a scorer can still dodge an assist (Craig, 30 Sep 2026).

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
  /** What he did get, which the column must not deny. */
  goals: number;
  assists: number;
  cleanSheet: boolean;
  misses: NearMiss[];
  shots: number;
  onTarget: number;
  /** Shots from inside the box, and of them from close range or the six-yard box. */
  inBox: number;
  close: number;
  chancesMade: number;
  /** Shots he set up from inside the box. */
  chancesInBox: number;
  /** Expected goals and assists he did not turn into points, plus each miss's weight; orders the column, never printed. */
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
      if (dodger !== null && dodger.nearness >= DODGERS.from.goal) found.push(dodger);
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
  const goals = sum(played, (stat) => stat.goals);
  const assists = sum(played, (stat) => stat.assists);
  const cleanSheet = pays && played.some((stat) => stat.cleanSheet);

  const code = rostered.player.code;
  const clubId = rostered.player.clubId;
  // An assist side at its bar weighs what a goal side at its bar does.
  const assistScale = DODGERS.from.goal / DODGERS.from.assist;
  const dodger: Dodger = {
    playerName: rostered.player.name,
    playerCode: code,
    clubId,
    position,
    ownerTeamId: team.teamId,
    ownerName: team.teamName,
    minutes: sum(played, (stat) => stat.minutes),
    goals,
    assists,
    cleanSheet,
    misses: [],
    shots: 0,
    onTarget: 0,
    inBox: 0,
    close: 0,
    chancesMade: 0,
    chancesInBox: 0,
    nearness:
      (goals === 0 ? sum(played, (stat) => stat.expectedGoals) : 0) +
      (assists === 0 ? sum(played, (stat) => stat.expectedAssists) * assistScale : 0),
  };

  for (const stat of played) {
    const match = byFixture.get(stat.fixtureId);
    if (match === undefined) continue;
    for (const moment of match.moments) {
      const [man, other] = moment.men;
      if (goals === 0 && man === code && OWN_MISSES.has(moment.kind)) miss(dodger, moment.kind as NearMiss["kind"], moment.minute);
      if (man === code && SHOTS.has(moment.kind)) {
        dodger.shots += 1;
        if (ON_TARGET.has(moment.kind)) dodger.onTarget += 1;
        if (IN_BOX.has(moment.shot?.from ?? "")) dodger.inBox += 1;
        if (CLOSE.has(moment.shot?.from ?? "")) dodger.close += 1;
      }
      if (other === code && SHOTS.has(moment.kind) && moment.shot?.situation !== "penalty") {
        dodger.chancesMade += 1;
        if (IN_BOX.has(moment.shot?.from ?? "")) dodger.chancesInBox += 1;
        if (assists === 0 && moment.kind === "woodwork") miss(dodger, "set-up-woodwork", moment.minute, assistScale);
      }
    }
    const lost = pays && !cleanSheet ? lateGoalAgainst(match, clubId, stat, input.clubOfCode) : null;
    if (lost !== null) miss(dodger, "clean-sheet-lost", lost);
  }
  return dodger;
}

function miss(dodger: Dodger, kind: NearMiss["kind"], clock: string, scale = 1): void {
  // Opta files a VAR-cancelled goal twice at one minute, and pads a single-figure clock ("07").
  const minute = clock.replace(/^0+(?=\d)/, "");
  if (dodger.misses.some((each) => each.kind === kind && each.minute === minute)) return;
  dodger.misses.push({ kind, minute });
  dodger.nearness += DODGERS.weight[kind] * scale;
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
