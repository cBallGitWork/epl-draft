import { sumOf } from "../../sum";
import type { PlayerStatLine } from "./playerStats";

// Fantrax's typed fantasy-assist columns, which a league's pool read carries only when its scoring lists them.

/** One man's gameweek in football clothes; the football layer declares the same shape. */
export interface FantraxAssistKinds {
  penaltyWon: number;
  ownGoalForced: number;
  freeKickWon: number;
  freeKickGoals: number;
}

/** Fantrax's column abbreviations behind each kind; AHW is a handball won and scored from a free kick. */
const COLUMNS: Record<keyof FantraxAssistKinds, readonly string[]> = {
  penaltyWon: ["APKG"],
  ownGoalForced: ["AOG"],
  freeKickWon: ["AFKG", "AHW"],
  freeKickGoals: ["FKG"],
};

/** Every man with a kind to report; nobody when the read carried none of the columns. */
export function mapAssistKinds(
  lines: readonly PlayerStatLine[],
): { fantraxId: string; kinds: FantraxAssistKinds }[] {
  return lines.flatMap((line) => {
    const sum = (columns: readonly string[]) => sumOf(columns, (column) => line.stats[column] ?? 0);
    const kinds: FantraxAssistKinds = {
      penaltyWon: sum(COLUMNS.penaltyWon),
      ownGoalForced: sum(COLUMNS.ownGoalForced),
      freeKickWon: sum(COLUMNS.freeKickWon),
      freeKickGoals: sum(COLUMNS.freeKickGoals),
    };
    return Object.values(kinds).some((count) => count > 0) ? [{ fantraxId: line.fantraxId, kinds }] : [];
  });
}
