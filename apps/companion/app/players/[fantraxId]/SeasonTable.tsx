import ScrollBoard from "../../components/league/ScrollBoard";
import Section from "../../components/shell/Section";
import { BOARD, FIGURE_CELL, ROW_RULE } from "@/app/desk";
import { HeadRow, MUTE, PlateHead } from "../../components/league/TableHeads";
import type { MatchRow } from "./matchRows";
import { totalsOf } from "./matchRows";
import { IndexCell } from "../../components/league/TableCells";
import { DASH, fixed, thousands } from "@epl/core";
import { RATING_TITLE } from "../../ratings";

// What the season adds up to, on CM's appearances table (`cm9900/11.jpg`, Craig, 4 Sep 2026). One row, League, because
// FPL publishes one competition; CM's columns with no source are left off for what we do measure.

const whole = (value: number) => String(value);

export default function SeasonTable({
  rows,
  season,
  club = null,
}: {
  rows: readonly MatchRow[];
  season: string | null;
  /** The club he is at, in the heading when the careers export names it. */
  club?: string | null;
}) {
  if (rows.length === 0) return null;
  const t = totalsOf(rows);

  return (
    <Section title={[season ? `Season · ${season}` : "Season", club].filter(Boolean).join(" · ")}>
      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <PlateHead>
                <span className={MUTE}>Competition</span>
              </PlateHead>
              {COLUMNS.map((column) => (
                <PlateHead key={column.head} at="centre" title={column.title} className={column.rule ? "border-l border-line" : undefined}>
                  {column.head}
                </PlateHead>
              ))}
            </HeadRow>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              {/* CM's left column names the competition. */}
              <IndexCell>League</IndexCell>
              {COLUMNS.map((column) => (
                <td key={column.head} className={`${FIGURE_CELL} font-bold ${column.rule ? "border-l border-line" : ""} ${column.derived ? "text-info" : ""}`}>
                  {column.total(t)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollBoard>
    </Section>
  );
}

type Totals = ReturnType<typeof totalsOf>;

interface Column {
  head: string;
  title: string;
  /** A rule down the left marks where FPL's account ends and Fantrax's begins. */
  rule?: boolean;
  /** Ours rather than recorded, in the derived reading's cyan. */
  derived?: boolean;
  total: (t: Totals) => React.ReactNode;
}

const COLUMNS: readonly Column[] = [
  { head: "Apps", title: "Appearances", total: (t) => whole(t.apps) },
  { head: "Min", title: "Minutes played", total: (t) => thousands(t.minutes) },
  { head: "Gls", title: "Goals", total: (t) => whole(t.goals) },
  { head: "Asts", title: "Assists", total: (t) => whole(t.assists) },
  { head: "Con", title: "Goals conceded while he was on", total: (t) => whole(t.conceded) },
  { head: "CS", title: "Clean sheets", total: (t) => whole(t.cleanSheets) },
  { head: "Sv", title: "Saves", total: (t) => whole(t.saves) },
  { head: "Yel", title: "Yellow cards", total: (t) => whole(t.yellowCards) },
  { head: "Red", title: "Red cards", total: (t) => whole(t.redCards) },
  // FPL's own points, headed as FPL's: never `FPts`, which is Fantrax's.
  { head: "FPL", title: "FPL's own points", total: (t) => whole(t.fplPoints) },
  { head: "Rtg", title: `${RATING_TITLE}; his average over the matches rated`, rule: true, derived: true, total: (t) => (t.rating === null ? DASH : fixed(t.rating, "rating")) },
];
