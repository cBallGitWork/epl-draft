import Section from "../../components/shell/Section";
import { ROW_RULE, SCROLL } from "@/app/desk";
import type { MatchRow } from "./matchRows";
import { per90, totalsOf } from "./matchRows";
import { IndexCell } from "../../components/league/TableCells";

// What the season adds up to, above the matches that made it.
//
// **Its own section rather than the match log's foot** (Craig, 4 Sep 2026:
// "Maybe we need a season data and match log section?"). The season is a
// question a reader asks WITHOUT reading the matches, and a `tfoot` twenty rows
// down a sideways-scrolling table is not where it gets answered. It is also
// where the pitch maps land when the sister repo exports the shot data they
// need.
//
// **Two rows, and both are Championship Manager's.** `cm9900/11.jpg` closes a
// profile with rows of appearances against columns of statistics; FPL's own
// player page closes the same table with `Totals` and `Per 90`. Two references,
// one shape. The row label sits in CM's index block, drawn in the club's colour
// like every other index cell on his screens.
//
// Everything left of the rule is FPL's measurement of the play; everything right
// is Fantrax's scoring of it. `FPts` is the only per-match source of our league's
// points anywhere, and it totals over the matches Fantrax reached rather than
// over the season — a sum of the season would count matches nobody showed us as
// noughts.

const dash = <span className="text-faint">—</span>;
const two = (value: number | null) =>
  value === null ? dash : value.toFixed(2);
const one = (value: number | null) =>
  value === null ? dash : value.toFixed(1);
const whole = (value: number | null) => (value === null ? dash : String(value));

export default function SeasonTable({
  rows,
  season,
}: {
  rows: readonly MatchRow[];
  season: string | null;
}) {
  if (rows.length === 0) return null;
  const t = totalsOf(rows);
  const rate = (value: number | null) => per90(value, t.minutes);

  return (
    <Section
      title={season ? `Season · ${season}` : "Season"}
      aside="FPL's own · Fantrax's own"
    >
      <div className={SCROLL}>
        <table className="w-full min-w-[44rem] border-collapse text-2xs">
          <thead className="border-b border-line text-faint">
            <tr>
              <th scope="col" className="py-1.5 pr-2 text-left font-bold">
                {rows.length} apps
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.head}
                  scope="col"
                  title={column.title}
                  className={`whitespace-nowrap px-1 py-1.5 text-right font-bold ${
                    column.rule ? "border-l border-line" : ""
                  }`}
                >
                  {column.head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={`${ROW_RULE} font-bold`}>
              <IndexCell>Total</IndexCell>
              {COLUMNS.map((column) => (
                <td
                  key={column.head}
                  className={`numeric px-1 text-right ${column.rule ? "border-l border-line" : ""}`}
                >
                  {column.total(t)}
                </td>
              ))}
            </tr>
            <tr className="text-muted">
              <IndexCell>Per 90</IndexCell>
              {COLUMNS.map((column) => (
                <td
                  key={column.head}
                  className={`numeric px-1 text-right ${column.rule ? "border-l border-line" : ""}`}
                >
                  {/* A per-ninety of no minutes is a dash, never a division by
                      nought — and a count that has no meaningful rate (minutes
                      itself) simply has no cell. */}
                  {column.rate ? column.rate(t, rate) : dash}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

type Totals = ReturnType<typeof totalsOf>;
type Rate = (value: number | null) => number | null;

interface Column {
  head: string;
  title: string;
  /** A rule down the left marks where FPL's account ends and Fantrax's begins. */
  rule?: boolean;
  total: (t: Totals) => React.ReactNode;
  rate?: (t: Totals, per: Rate) => React.ReactNode;
}

const COLUMNS: readonly Column[] = [
  {
    head: "Min",
    title: "Minutes played",
    total: (t) => t.minutes.toLocaleString("en-GB"),
  },
  {
    head: "G",
    title: "Goals",
    total: (t) => t.goals,
    rate: (t, per) => two(per(t.goals)),
  },
  {
    head: "A",
    title: "Assists",
    total: (t) => t.assists,
    rate: (t, per) => two(per(t.assists)),
  },
  {
    head: "xG",
    title: "Expected goals",
    total: (t) => two(t.expectedGoals),
    rate: (t, per) => two(per(t.expectedGoals)),
  },
  {
    head: "xA",
    title: "Expected assists",
    total: (t) => two(t.expectedAssists),
    rate: (t, per) => two(per(t.expectedAssists)),
  },
  {
    head: "BPS",
    title: "FPL's bonus-points score",
    total: (t) => t.bps,
    rate: (t, per) => one(per(t.bps)),
  },
  {
    head: "B",
    title: "Bonus points",
    total: (t) => t.bonus,
    rate: (t, per) => one(per(t.bonus)),
  },
  {
    head: "FPL",
    title: "FPL's points, under FPL's rules — not this league's",
    total: (t) => t.fplPoints,
    rate: (t, per) => one(per(t.fplPoints)),
  },
  {
    head: "FPts",
    title:
      "This league's points — Fantrax's own, over the matches they publish",
    rule: true,
    total: (t) => whole(t.points),
    rate: (t, per) => one(per(t.points)),
  },
  {
    head: "S",
    title: "Shots — Fantrax's own; FPL does not publish it",
    total: (t) => whole(t.shots),
    rate: (t, per) => one(per(t.shots)),
  },
  {
    head: "SOT",
    title: "Shots on target — Fantrax's own",
    total: (t) => whole(t.shotsOnTarget),
    rate: (t, per) => one(per(t.shotsOnTarget)),
  },
  {
    head: "FC",
    title: "Fouls committed — Fantrax's own",
    total: (t) => whole(t.foulsCommitted),
    rate: (t, per) => one(per(t.foulsCommitted)),
  },
];
