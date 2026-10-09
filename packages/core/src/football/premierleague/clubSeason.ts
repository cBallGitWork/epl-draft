import { sumOf } from "../../sum";
import { optaMetrics } from "./map";
import type { RawPlTeamStats } from "./rawStats";

// One club's season in Opta's counting, off `/stats/team`. Pure: no clock, no network (CODE_RULES §5).
// A metric worth nought is omitted from the payload (`RawPlMetric`), so a missing name reads 0.

/** A club's season to date, as the football counts it. */
export interface PlClubSeason {
  /** FPL's club `code`, off Opta's `t{code}`. */
  clubCode: number;
  goals: number;
  shots: number;
  shotsOnTarget: number;
  /** Big chances had, scored or missed. */
  bigChances: number;
  assists: number;
  /** Passes that led to a shot: Opta's key passes. */
  chancesCreated: number;
  bigChancesCreated: number;
  goalsConceded: number;
  cleanSheets: number;
  shotsConceded: number;
  tackles: number;
  interceptions: number;
  /** Loose balls won back. */
  recoveries: number;
  /** Shots blocked by an outfielder. */
  blocks: number;
  errorsLeadingToShot: number;
  errorsLeadingToGoal: number;
  /** Fouls committed; `fk_foul_won` is the other end of the pair. */
  fouls: number;
  yellowCards: number;
  redCards: number;
}

/** The club's season, or null when the read names no club or carries no metric at all: that is an absence. */
export function plClubSeason(raw: RawPlTeamStats): PlClubSeason | null {
  const opta = raw.entity?.altIds?.opta;
  const clubCode = opta?.startsWith("t") ? Number(opta.slice(1)) : NaN;
  if (!Number.isInteger(clubCode) || raw.stats.length === 0) return null;

  const metric = optaMetrics(raw.stats);
  // Opta's names; a figure of two names is their sum.
  const sum = (...names: string[]) => sumOf(names, metric);
  return {
    clubCode,
    goals: sum("goals"),
    shots: sum("total_scoring_att"),
    shotsOnTarget: sum("ontarget_scoring_att"),
    bigChances: sum("big_chance_scored", "big_chance_missed"),
    assists: sum("goal_assist"),
    chancesCreated: sum("total_att_assist"),
    bigChancesCreated: sum("big_chance_created"),
    goalsConceded: sum("goals_conceded"),
    cleanSheets: sum("clean_sheet"),
    shotsConceded: sum("attempts_conceded_ibox", "attempts_conceded_obox"),
    tackles: sum("total_tackle"),
    interceptions: sum("interception"),
    recoveries: sum("ball_recovery"),
    blocks: sum("outfielder_block"),
    errorsLeadingToShot: sum("error_lead_to_shot"),
    errorsLeadingToGoal: sum("error_lead_to_goal"),
    fouls: sum("fk_foul_lost"),
    yellowCards: sum("total_yel_card"),
    redCards: sum("total_red_card"),
  };
}
