import {
  type Assignment,
  type Persona,
  type StandingsRow,
  type StoryThread,
  buildDodgersBrief,
  buildElevenBrief,
  buildPowerBrief,
  buildPredictionsBrief,
  buildPresserBrief,
  buildStudioBrief,
  buildWireBrief,
  decided,
  dodgers,
  markCalls,
  powerRows,
  predictionTies,
  wireFacts,
} from "@epl/core";
import type { RoundFacts } from "./facts";
import { MANAGER_TRAITS, STUDIO_ANALYST, STUDIO_ANCHOR } from "./voice/personas";

// The opinion columns' wiring: what each one is told, out of the facts the
// firing already gathered. The joins live here rather than in core for the
// same reason `assemble.ts` does — core is pure and a script does the wiring.

export interface ColumnContext {
  gameweek: number;
  facts: RoundFacts;
  /** Fantrax's table, for the rankings to argue with. Empty when the standings
   *  read refused, which costs that column and no other. */
  table: readonly StandingsRow[];
  threads: readonly StoryThread[];
  /** How the last predictions column's calls turned out. */
  marked: { right: number; called: number } | null;
  named: (teamId: string) => string;
}

/** One column's brief, or null where the facts cannot support it — an empty
 *  column is not filed, and the assignment's key stays unspent so a later
 *  firing can try again. */
export function columnBrief(assignment: Assignment, ctx: ColumnContext): string | null {
  const results = decided(ctx.facts.pairings, ctx.facts.scores);

  if (assignment.kind === "predictions") {
    const ties = predictionTies(ctx.facts.pairings, ctx.facts.projected);
    // A column with no projections to call from is not a column: Fantrax
    // withheld the one number a prediction can stand on.
    if (ties.every((tie) => tie.homeProjected === null && tie.awayProjected === null)) return null;
    return buildPredictionsBrief({ gameweek: ctx.gameweek, ties, marked: ctx.marked, threads: ctx.threads });
  }

  if (assignment.kind === "power-ranking") {
    if (ctx.table.length === 0) return null;
    return buildPowerBrief({
      gameweek: ctx.gameweek,
      rows: powerRows(ctx.table, results),
      threads: ctx.threads,
    });
  }

  if (assignment.kind === "dodgers") {
    // The same gate the eleven keeps, and for a stronger reason: this column
    // is ENTIRELY the claim that somebody was benched. `getTeamRosters` is
    // asked for no period and Fantrax rolls the label forward hours before the
    // boundary, so between rounds the arrangement on hand is next week's plan
    // — and this fires in the finished-round window, which is exactly when
    // that is most likely. Ungated, the paper names five managers for benching
    // men they started, in a side nobody fielded.
    if (!ctx.facts.fielded) return null;
    const benched = dodgers(ctx.facts.teams);
    // Nobody left anybody out worth writing about. A column saying so would be
    // the paper apologising for a week in which every manager picked well.
    if (benched.length === 0) return null;
    return buildDodgersBrief({ gameweek: ctx.gameweek, benched, threads: ctx.threads });
  }

  if (assignment.kind === "eleven") {
    // The eleven is only written about when the arrangement it was read from
    // is the one that was actually fielded — the same rule the front page
    // keeps, because "benched" is the column's best line and it is a claim
    // about a side somebody picked.
    if (ctx.facts.eleven === null || !ctx.facts.fielded) return null;
    return buildElevenBrief({
      gameweek: ctx.gameweek,
      picks: ctx.facts.eleven.picks,
      shape: ctx.facts.eleven.shape,
      threads: ctx.threads,
    });
  }

  if (assignment.kind === "wire") {
    const facts = wireFacts(ctx.facts.business);
    if (facts.deals === 0) return null;
    return buildWireBrief({ gameweek: ctx.gameweek, facts, named: ctx.named, threads: ctx.threads });
  }

  if (assignment.kind === "presser") {
    if (results.length === 0) return null;
    return buildPresserBrief({
      gameweek: ctx.gameweek,
      results,
      personas: personasFor(results, ctx.named),
      threads: ctx.threads,
    });
  }

  if (assignment.kind === "studio") {
    // The round's biggest tie by margin's opposite: the closest of them, which
    // is the one two pundits can actually disagree about.
    const tie = [...results].sort((a, b) => a.margin - b.margin)[0];
    if (tie === undefined) return null;
    return buildStudioBrief({
      gameweek: ctx.gameweek,
      tie: {
        homeName: tie.winner.name,
        awayName: tie.loser.name,
        homePoints: tie.winner.points,
        awayPoints: tie.loser.points,
      },
      talkingPoints: talkingPoints(ctx.facts, tie.winner.teamId, tie.loser.teamId),
      anchor: STUDIO_ANCHOR,
      analyst: STUDIO_ANALYST,
      threads: ctx.threads,
    });
  }

  return null;
}

/** The managers in this round's results, with whatever trait Craig has set.
 *  An empty table is a working sketch: the persona is then played off his
 *  result alone. */
function personasFor(
  results: readonly ReturnType<typeof decided>[number][],
  named: (teamId: string) => string,
): Persona[] {
  const ids = new Set(results.flatMap((result) => [result.winner.teamId, result.loser.teamId]));
  return [...ids].map((teamId) => ({
    teamId,
    name: named(teamId),
    trait: MANAGER_TRAITS[teamId] ?? "",
  }));
}

/** What the studio has to talk about: the men who actually did something for
 *  the two sides in the tie. */
function talkingPoints(facts: RoundFacts, ...teamIds: string[]): string[] {
  if (facts.eleven === null) return [];
  return facts.eleven.picks
    .filter((pick) => teamIds.includes(pick.ownerTeamId))
    .slice(0, 4)
    .map(
      (pick) =>
        `${pick.playerName} (${pick.ownerName}): ${pick.goals}G ${pick.assists}A${pick.cleanSheet ? " clean sheet" : ""} in ${pick.minutes} min${pick.started ? "" : ", and was on the bench"}`,
    );
}
