import {
  type Assignment,
  type Dodger,
  type StandingsRow,
  type StoryThread,
  buildDodgersBrief,
  buildElevenBrief,
  buildPowerBrief,
  buildWireBrief,
  decided,
  powerRows,
  wireFacts,
} from "@epl/core";
import type { DeskFacts } from "./facts";

// The opinion columns' wiring: what each one is told, out of the facts the firing already gathered.

interface ColumnContext {
  gameweek: number;
  facts: DeskFacts;
  /** Fantrax's table, for the rankings to argue with. Empty when the standings
   *  read refused, which costs that column and no other. */
  table: readonly StandingsRow[];
  /** The gameweek's near misses, null when the commentary was not read. */
  dodgers: readonly Dodger[] | null;
  threads: readonly StoryThread[];
  named: (teamId: string) => string;
}

/** One column's brief, or null where the facts cannot support it — an empty
 *  column is not filed, and the assignment's key stays unspent so a later
 *  firing can try again. */
export function columnBrief(assignment: Assignment, ctx: ColumnContext): string | null {
  const results = decided(ctx.facts.pairings, ctx.facts.scores);

  if (assignment.kind === "power-ranking") {
    if (ctx.table.length === 0) return null;
    return buildPowerBrief({
      gameweek: ctx.gameweek,
      rows: powerRows(ctx.table, results),
      threads: ctx.threads,
    });
  }

  if (assignment.kind === "dodgers") {
    // A week in which nobody came close files nothing rather than a column apologising for it.
    if (ctx.dodgers === null || ctx.dodgers.length === 0) return null;
    return buildDodgersBrief({ gameweek: ctx.gameweek, dodgers: ctx.dodgers, threads: ctx.threads });
  }

  if (assignment.kind === "eleven") {
    // Only when the arrangement it was read from is the one fielded: "benched" is a claim about a side somebody picked.
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

  return null;
}
