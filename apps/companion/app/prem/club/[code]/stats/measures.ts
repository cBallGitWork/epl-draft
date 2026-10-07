import { type FigureKind, type SeasonTotals, fixed } from "@epl/core";

// Which of FPL's counts a club's stat board prints, in three views: one table is wider than any phone.
// All FPL's: a Fantrax figure here would break `SeasonTotals`' bound.

export interface Measure {
  key: keyof SeasonTotals;
  /** The column head, abbreviated as CM abbreviates. */
  head: string;
  /** What the head means, for the `title`. */
  label: string;
  /** A column whose top is the bad end, lit red: goals conceded. */
  worse?: boolean;
  /** The kind of figure, which sets its places; a count when absent. */
  kind?: FigureKind;
}

export interface View {
  key: string;
  label: string;
  measures: readonly Measure[];
}

export const VIEWS: readonly View[] = [
  {
    key: "attack",
    label: "Attacking",
    measures: [
      { key: "goals", head: "G", label: "Goals" },
      { key: "assists", head: "A", label: "Assists" },
      { key: "expectedGoals", head: "xG", label: "Expected goals", kind: "expected" },
      { key: "expectedAssists", head: "xA", label: "Expected assists", kind: "expected" },
    ],
  },
  {
    key: "defence",
    label: "Defensive",
    measures: [
      { key: "cleanSheets", head: "CS", label: "Clean sheets" },
      { key: "goalsConceded", head: "GC", label: "Goals conceded", worse: true },
      { key: "expectedGoalsConceded", head: "xGC", label: "Expected goals conceded", worse: true, kind: "expected" },
      { key: "tackles", head: "Tck", label: "Tackles" },
      { key: "clearancesBlocksInterceptions", head: "CBI", label: "Clearances, blocks and interceptions" },
      { key: "recoveries", head: "Rec", label: "Recoveries" },
      { key: "saves", head: "Sav", label: "Saves" },
    ],
  },
  {
    key: "time",
    label: "Playing time",
    measures: [
      { key: "minutes", head: "Min", label: "Minutes played" },
      { key: "starts", head: "St", label: "Starts" },
    ],
  },
];

/** A measure's figure at its kind's places: every xG in a column to two, so a whole 2 reads 2.00 beside 1.35. */
export function reading(measure: Measure, value: number): string {
  return fixed(value, measure.kind ?? "count");
}
