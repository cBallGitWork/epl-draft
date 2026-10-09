import { ATTRIBUTE_ROWS } from "@epl/core";
import type { Attribute } from "@epl/core";
import type { PoolColumn } from "./columns";

// The attribute grid as board columns, so the pool can be ranked by Finishing or Pace (Craig,
// 30 Sep 2026). Ratings ride in the stats bag under their own keys, so sort, marks and the
// position filter work as they do for any count.

/** CM's own three-letter headings. */
const SHORT: Readonly<Record<string, string>> = {
  Acceleration: "Acc",
  Aggression: "Agg",
  Anticipation: "Ant",
  Consistency: "Cns",
  Creativity: "Cre",
  Crossing: "Cro",
  Dribbling: "Dri",
  Finishing: "Fin",
  Handling: "Han",
  Heading: "Hea",
  Influence: "Inf",
  "Long Shots": "Lon",
  Marking: "Mar",
  "Off The Ball": "OtB",
  Pace: "Pac",
  Passing: "Pas",
  "Penalty Taking": "Pen",
  Positioning: "Pos",
  Reflexes: "Ref",
  "Set Pieces": "SP",
  Stamina: "Sta",
  Tackling: "Tck",
  Teamwork: "Tea",
  "Work Rate": "Wor",
};

const bagKey = (name: string) => `cm ${name}`;

export const ATTRIBUTE_COLUMNS: PoolColumn[] = ATTRIBUTE_ROWS.map((row) => {
  const label = SHORT[row.name] ?? row.name;
  return {
    key: label.toLowerCase(),
    label,
    title: `${row.name}, 1–20: ${row.from}`,
    kind: "number",
    group: "attributes",
    mark: "high",
    ascending: false,
    value: (_row, stats) => stats?.[bagKey(row.name)] ?? null,
  };
});

/** His ratings, keyed for the stats bag. */
export function attributeStats(grid: readonly Attribute[] | undefined): Record<string, number | null> {
  return Object.fromEntries((grid ?? []).map((attribute) => [bagKey(attribute.name), attribute.rating]));
}
