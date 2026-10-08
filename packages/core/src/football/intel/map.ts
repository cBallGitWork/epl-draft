import type {
  IntelClubPieces,
  IntelClubXi,
  IntelPlayer,
  IntelSquads,
  IntelStarter,
  IntelTaker,
} from "./types";
import { ON_THE_PITCH } from "../types";

// Reads the sister repo's already-parsed export and refuses what is wrong. A null position must stay null:
// filling it would put FPL's fantasy classification on a football screen.

/** Every player the export carries by FPL code; a row without one is dropped, never kept under `NaN`. */
export function squadIntel(squads: IntelSquads | null): Map<number, IntelPlayer> {
  const byCode = new Map<number, IntelPlayer>();
  if (squads === null) return byCode;
  for (const player of squads.players ?? []) {
    if (!Number.isInteger(player?.code)) continue;
    byCode.set(player.code, player);
  }
  return byCode;
}

/** What is wrong with a club's predicted eleven, or null when nothing is: reported, never repaired. */
export function xiFault(club: IntelClubXi | undefined): string | null {
  if (club === undefined) return "no predicted eleven";
  const starters = club.starters ?? [];
  if (starters.length !== ON_THE_PITCH) return `${starters.length} starters, not ${ON_THE_PITCH}`;
  if (!club.formation) return "no formation";
  if (club.slots === null) return `unknown formation ${club.formation}`;
  const slots = Object.values(club.slots).reduce((total, n) => total + n, 0);
  if (slots !== ON_THE_PITCH) return `${club.formation} fills ${slots} places, not ${ON_THE_PITCH}`;
  return null;
}

/** One club's predicted eleven in its formation's rows, goal first. The source's order is the line-up, so it is
 *  chunked by the formation's numbers, never regrouped by position; the keeper is a row of his own. */
export function predictedEleven(
  club: IntelClubXi | undefined,
): { line: string; players: IntelStarter[] }[] {
  if (club === undefined) return [];

  const shape = outfieldShape(club.formation);
  const starters = club.starters ?? [];
  if (shape === null || starters.length !== ON_THE_PITCH) return [];

  const [keeper, ...outfield] = starters;
  const rows = [{ line: "GK", players: [keeper] }];

  let at = 0;
  for (const count of shape) {
    // Kept right-back first: the team faces the reader, so its right is the reader's left; reversing mirrors the pitch.
    rows.push({ line: String(count), players: outfield.slice(at, at + count) });
    at += count;
  }
  return rows.filter((row) => row.players.length > 0);
}

/** A formation as its outfield row sizes, or null unless they add to ten (no formation counts the keeper). */
function outfieldShape(formation: string | null | undefined): number[] | null {
  if (!formation) return null;
  const parts = formation.split("-").map((part) => Number(part.trim()));
  if (parts.length < 2 || parts.some((n) => !Number.isInteger(n) || n < 1)) return null;
  return parts.reduce((total, n) => total + n, 0) === ON_THE_PITCH - 1 ? parts : null;
}

/** One club's set-piece orders, biggest share first, pieces in the order asked; one nobody takes comes back empty. */
export function setPieceOrder(
  club: IntelClubPieces | undefined,
  pieces: readonly { key: keyof IntelClubPieces; label: string }[],
): { piece: string; label: string; takers: IntelTaker[] }[] {
  return pieces.map(({ key, label }) => ({
    piece: key,
    label,
    takers: [...(club?.[key] ?? [])].sort((a, b) => b.share - a.share),
  }));
}

/** One man's place in one set-piece order. A null rank is a piece he does not take; `of` is how many do. */
export interface SetPieceRank {
  piece: string;
  label: string;
  rank: number | null;
  of: number;
}

/** One man's place in each of his club's set-piece orders, counting only the men still there. */
export function setPieceRanks(
  club: IntelClubPieces | undefined,
  pieces: readonly { key: keyof IntelClubPieces; label: string }[],
  code: number,
  present: ReadonlySet<number>,
): SetPieceRank[] {
  return setPieceOrder(club, pieces).map(({ piece, label, takers }) => {
    const here = takers.filter((taker) => present.has(taker.code));
    const at = here.findIndex((taker) => taker.code === code);
    return { piece, label, rank: at === -1 ? null : at + 1, of: here.length };
  });
}
