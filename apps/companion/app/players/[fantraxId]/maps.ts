import { assistsOf, touchesOf } from "@epl/core";
import type { Shot, Touch, TouchPlayer } from "@epl/core";
import { PITCH_BOX } from "../../components/football/pitchBox";

// His season on the profile's three pitches, read off the sister's shot and touch files by FPL code.

/** His shots, the shots he set up, and every touch; an empty list is a map not drawn. */
export interface SeasonMaps {
  shots: Shot[];
  chances: Shot[];
  touches: Touch[];
}

/** The grass kept behind the deepest mark when a map must reach into his own half, in pitch units. */
const REACH_BACK = 3;

/** Everything the files hold for him this season; a keeper keeps only his touches. */
export function seasonMaps(
  code: number,
  shots: ReadonlyMap<number, readonly Shot[]>,
  touches: ReadonlyMap<number, TouchPlayer>,
  keeper: boolean,
): SeasonMaps {
  const touched = touchesOf(touches.get(code), null);
  if (keeper) return { shots: [], chances: [], touches: touched };
  return { shots: [...(shots.get(code) ?? [])], chances: assistsOf(shots, code), touches: touched };
}

/** The stretch of pitch a shot map draws: the attacking half, reaching back only for a mark that started deeper. */
export function attackingSpan(points: readonly { x: number }[]): { x: number; width: number } {
  const half = PITCH_BOX.width / 2;
  const deepest = Math.min(half, ...points.map((point) => point.x - REACH_BACK));
  const x = Math.max(0, Math.floor(deepest));
  return { x, width: PITCH_BOX.width - x };
}
