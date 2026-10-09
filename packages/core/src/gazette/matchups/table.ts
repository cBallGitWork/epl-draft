import { DRAFT_DESK } from "../../config";
import { placeTable } from "../../league/fantrax/standings";
import { ordinal } from "../../league/ordinal";
import type { FormGame } from "../../league/form";
import type { StandingsRow } from "../../league/types";
import type { SideResult } from "./form";

// The table after the gameweek: the table before it, with each side's result and points added, placed by the league's
// own rule (points, then points for). What a win and a draw are worth is read off the table before, never assumed;
// a table that cannot say is left unmoved. Pure.

export type TableKind = "top" | "stayed-top" | "bottom" | "climb" | "fall";

interface TableFact {
  teamId: string;
  kind: TableKind;
  text: string;
}

/** What the table pays for a win and a draw, solved from its own rows; null when the rows cannot say. */
export function tablePoints(rows: readonly StandingsRow[]): { win: number; draw: number } | null {
  const winners = rows.filter((r) => r.won > 0 && r.drawn === 0);
  if (winners.length === 0) return null;
  const win = winners[0].points / winners[0].won;
  if (winners.some((r) => r.points !== win * r.won)) return null;
  const drawers = rows.filter((r) => r.drawn > 0);
  const draw = drawers.length === 0 ? null : (drawers[0].points - win * drawers[0].won) / drawers[0].drawn;
  if (draw === null) return rows.some((r) => r.drawn > 0) ? null : { win, draw: 0 };
  return drawers.every((r) => r.points === win * r.won + draw * r.drawn) ? { win, draw } : null;
}

/** The table as it stood before `period`, rebuilt from each side's settled results: Fantrax's own table may already
 *  hold the gameweek, or not yet, depending on when it is read. */
export function tableBefore(rows: readonly StandingsRow[], runs: ReadonlyMap<string, readonly FormGame[]>, period: number, pay: { win: number; draw: number }): StandingsRow[] {
  return placeTable(
    rows.map((row) => {
      const games = (runs.get(row.teamId) ?? []).filter((g) => g.period < period);
      const count = (r: FormGame["result"]) => games.filter((g) => g.result === r).length;
      const [won, drawn, lost] = [count("W"), count("D"), count("L")];
      const sum = (pick: (g: FormGame) => number) => games.reduce((total, g) => total + pick(g), 0);
      return { ...row, won, drawn, lost, played: games.length, points: won * pay.win + drawn * pay.draw, pointsFor: sum((g) => g.pointsFor), pointsAgainst: sum((g) => g.pointsAgainst) };
    }),
  );
}

/** The table with the gameweek added, in the league's order; null when what a result is worth cannot be read. */
export function tableAfter(before: readonly StandingsRow[], results: readonly SideResult[]): StandingsRow[] | null {
  const pay = tablePoints(before);
  if (pay === null) return null;
  return placeTable(
    before.map((row) => {
      const side = results.find((s) => s.teamId === row.teamId);
      if (side === undefined) return row;
      const [won, drawn, lost] = side.for > side.against ? [1, 0, 0] : side.for < side.against ? [0, 0, 1] : [0, 1, 0];
      return {
        ...row,
        won: row.won + won,
        drawn: row.drawn + drawn,
        lost: row.lost + lost,
        played: row.played + 1,
        points: row.points + won * pay.win + drawn * pay.draw,
        pointsFor: row.pointsFor + side.for,
        pointsAgainst: row.pointsAgainst + side.against,
      };
    }),
  );
}

/** Who went top or bottom, and who climbed or fell far enough to be news. */
export function tableMoves(before: readonly StandingsRow[], after: readonly StandingsRow[]): TableFact[] {
  const facts: TableFact[] = [];
  const rankIn = (rows: readonly StandingsRow[], teamId: string) => rows.find((r) => r.teamId === teamId)?.rank ?? null;
  const [oldTop, newTop] = [before.find((r) => r.rank === 1), after.find((r) => r.rank === 1)];
  if (oldTop !== undefined && newTop !== undefined && oldTop.teamId !== newTop.teamId) facts.push({ teamId: newTop.teamId, kind: "top", text: `${newTop.teamName} went top, above ${oldTop.teamName}` });
  if (oldTop !== undefined && newTop !== undefined && oldTop.teamId === newTop.teamId) facts.push({ teamId: newTop.teamId, kind: "stayed-top", text: `${newTop.teamName} stayed top` });
  const [oldBottom, newBottom] = [before.find((r) => r.rank === before.length), after.find((r) => r.rank === after.length)];
  if (oldBottom !== undefined && newBottom !== undefined && oldBottom.teamId !== newBottom.teamId) facts.push({ teamId: newBottom.teamId, kind: "bottom", text: `${newBottom.teamName} went bottom` });
  for (const row of after) {
    const was = rankIn(before, row.teamId);
    if (was === null || [newTop?.teamId, newBottom?.teamId].includes(row.teamId)) continue;
    const moved = was - row.rank;
    if (moved >= DRAFT_DESK.tableMove) facts.push({ teamId: row.teamId, kind: "climb", text: `${row.teamName} rose from ${ordinal(was)} to ${ordinal(row.rank)}` });
    if (-moved >= DRAFT_DESK.tableMove) facts.push({ teamId: row.teamId, kind: "fall", text: `${row.teamName} fell from ${ordinal(was)} to ${ordinal(row.rank)}` });
  }
  return facts;
}
