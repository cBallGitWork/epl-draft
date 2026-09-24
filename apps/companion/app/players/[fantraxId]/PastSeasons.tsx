import type { PastSeason } from "@epl/core";
import Section from "../../components/shell/Section";
import { BOARD, FIGURE, HEAD_CELL, HEAD_PLATE, HEAD_PLATE_CENTRE, ROW_RULE, SCROLL, TEXT } from "@/app/desk";
import { IndexCell } from "../../components/league/TableCells";
import { thousands } from "@epl/core";

// Championship Manager's appearances table, at season scale (`cm9900/11.jpg`
// draws `Apps Gls Con Pens Asts Yel Red MoM Av R` over six competition rows).
//
// **The column set is short because it is measured, not because it is cautious.**
// FPL writes every key on every row back to 2014/15, so a statistic it did not
// collect that year arrives as a nought rather than as an absence — `raw.ts`
// carries the count. Starts, expected goals and tackles all read zero for
// Maguire's 2021/22 — a season in which he played 2,513 minutes. Everything
// drawn here is real in every season FPL publishes, and minutes stands in for
// appearances, which FPL has never published at all.
//
// **Points are FPL's own and the heading says so.** They are not our league's
// and must never appear in a column headed FPts, which is Fantrax's word for
// Fantrax's scoring of a slot we chose.

export default function PastSeasons({
  seasons,
  current,
}: {
  seasons: readonly PastSeason[];
  /** This season, drawn as the first row. **FPL's own arrangement** (Craig,
   *  4 Sep 2026: *"this season at top, have previous sesasons underneath"*),
   *  and one table rather than two: the columns are identical, and two tables
   *  with the same heads one above the other is a reader checking whether they
   *  agree. Null for a man with no minutes this season. */
  current?: PastSeason | null;
}) {
  if (seasons.length === 0 && !current) {
    // A debutant, and a real answer rather than an empty table. A heading over
    // no rows is a claim that something failed to load.
    return null;
  }

  const rows = current ? [current, ...seasons] : seasons;

  return (
    // **"Previous seasons", and no provenance line** (Craig, 4 Sep 2026:
    // *"remove … before this season / FPL's own row"*). FPL's own player page
    // heads the same table "Previous Seasons" and this tab follows it: the
    // current season on top, the completed ones under. "Before this season" was
    // relative to a table that is no longer above it.
    <Section title={current ? "Seasons" : "Previous seasons"}>
      <div className={SCROLL}>
        <table className={BOARD}>
          <thead>
            <tr>
              <th className={HEAD_CELL}>
                <div className={HEAD_PLATE}>Season</div>
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.head}
                  className={HEAD_CELL}
                  title={column.title}
                >
                  <div className={`${HEAD_PLATE_CENTRE}`}>
                    {column.head}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((season) => (
              <tr key={season.season} className={ROW_RULE}>
                {/* `IndexCell` IS the `<td>` — it is not a block to put inside
                    one. Wrapping it nested a cell in a cell, which the browser
                    repairs on parse, so the server HTML and the client tree
                    disagreed and the whole table re-rendered with a hydration
                    error. Invisible in the source and loud in the console. */}
                <IndexCell>{season.season}</IndexCell>
                {COLUMNS.map((column) => (
                  <td key={column.head} className={`${FIGURE} ${TEXT.center}`}>
                    {/* Absence is a dash, never a nought — DESIGN §7. A season
                        he did not play is kept, and a nil in it is a
                        measurement rather than a gap, so only a genuinely
                        missing figure dashes. */}
                    {column.of(season)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

interface Column {
  head: string;
  title: string;
  of: (season: PastSeason) => number | string;
}

const COLUMNS: readonly Column[] = [
  {
    head: "Min",
    title: "Minutes played",
    of: (s) => thousands(s.minutes),
  },
  { head: "Gls", title: "Goals", of: (s) => s.goals },
  { head: "Ast", title: "Assists", of: (s) => s.assists },
  { head: "CS", title: "Clean sheets", of: (s) => s.cleanSheets },
  {
    head: "Con",
    title: "Goals conceded while he was on",
    of: (s) => s.goalsConceded,
  },
  { head: "Sv", title: "Saves", of: (s) => s.saves },
  { head: "Yel", title: "Yellow cards", of: (s) => s.yellowCards },
  { head: "Red", title: "Red cards", of: (s) => s.redCards },
  { head: "Bon", title: "Bonus points", of: (s) => s.bonus },
  {
    head: "Pts",
    title: "FPL's points, under FPL's rules — not this league's",
    of: (s) => s.fplPoints,
  },
];
