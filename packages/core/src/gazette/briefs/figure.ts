import { DASH } from "../../format";
// A total in a brief: the number, or the dash absence prints as everywhere
// else. Three briefs wrote it out before this earned its name.

export function figure(points: number | null): string {
  return points === null ? DASH : String(points);
}
