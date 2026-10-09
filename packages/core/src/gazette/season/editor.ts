import { stringOrEmpty } from "../../untrusted";

// The editor's calls over the desk's order: data, read from `data/editions/editor.json` by the script and filed with
// the story, never a name in code. Pure.

/** A side put at a place by an editor, who called it, when, and what he said. */
export interface EditorMove {
  teamId: string;
  place: number;
  by: string;
  on: string;
  said: string;
}

/** A move as the column printed it: where the code had the side, and where it went. */
export interface AppliedMove extends EditorMove {
  from: number;
}

/** The order with each move applied in turn, the sides between shifting one place, and each recorded at the place it
 *  printed; a move naming no side in the order, or a place off its end, is skipped and not recorded. */
export function editorsOrder<T extends { teamId: string }>(order: readonly T[], moves: readonly EditorMove[]): { order: T[]; applied: AppliedMove[] } {
  const printed = [...order];
  const applied: AppliedMove[] = [];
  for (const move of moves) {
    const at = printed.findIndex((each) => each.teamId === move.teamId);
    if (at === -1 || move.place < 1 || move.place > printed.length) continue;
    const [side] = printed.splice(at, 1);
    printed.splice(move.place - 1, 0, side);
    applied.push({ ...move, from: order.findIndex((each) => each.teamId === move.teamId) + 1 });
  }
  // A later move can shift a side an earlier one placed.
  return { order: printed, applied: applied.map((move) => ({ ...move, place: printed.findIndex((each) => each.teamId === move.teamId) + 1 })) };
}

/** An editor's moves read field by field from the file; anything malformed is dropped. */
export function readMoves(raw: unknown): EditorMove[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((each: Partial<EditorMove> | null) =>
    typeof each?.teamId === "string" && each.teamId !== "" && Number.isInteger(each.place)
      ? [{ teamId: each.teamId, place: each.place as number, by: stringOrEmpty(each.by), on: stringOrEmpty(each.on), said: stringOrEmpty(each.said) }]
      : [],
  );
}

/** The moves a filed story records, each with the place the code gave it; absent when there are none. */
export function normalizeApplied(raw: unknown): AppliedMove[] | undefined {
  const moves = (Array.isArray(raw) ? raw : []).flatMap((each: Partial<AppliedMove> | null) =>
    Number.isInteger(each?.from) ? readMoves([each]).map((move) => ({ ...move, from: each?.from as number })) : [],
  );
  return moves.length === 0 ? undefined : moves;
}
