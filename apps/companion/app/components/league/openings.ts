import type { Move } from "@epl/core";
import { positionDepth } from "@epl/core";
import type { PitchRow } from "./PitchRows";

// The free places on the pitch a picked man can move into with nobody coming off.

type Free = Extract<Move, { kind: "shift" | "promote" }>;

/** The moves that fill a free place rather than take somebody's. */
export const freeMoves = (moves: readonly Move[]): Free[] =>
  moves.filter((move): move is Free => move.kind === "shift" || move.kind === "promote");

/** Each opening as an empty place at the end of its line; a line nobody stands in yet is drawn at its depth. */
export function withOpenings<T>(rows: readonly PitchRow<T>[], openings: readonly string[]): PitchRow<T | string>[] {
  const lines = rows.map<PitchRow<T | string>>((row) => ({
    label: row.label,
    players: [...row.players, ...openings.filter((position) => position === row.label)],
  }));
  const fresh = openings.filter((position) => !rows.some((row) => row.label === position));
  return [...lines, ...fresh.map((position) => ({ label: position, players: [position] }))].sort(
    (a, b) => positionDepth(a.label) - positionDepth(b.label),
  );
}
