import { derbyOf, type Derby, type DerbyName } from "@epl/core";
import file from "../../../data/leagues/derbies.json";

// The derby two of our teams play, off `data/leagues/derbies.json`; `between` in the file is for the reader only.
export const DERBIES: readonly Derby[] = file.derbies;

export function derbyBetween(a: string, b: string): DerbyName | null {
  return derbyOf(DERBIES, a, b);
}
