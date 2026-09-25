import Section from "../../components/shell/Section";
import { BOARD, BOARD_FIGURE, ROW_RULE, SCROLL } from "@/app/desk";
import { PlateHead } from "../../components/league/TableHeads";
import type { MatchRow } from "./matchRows";
import { totalsOf } from "./matchRows";
import { IndexCell } from "../../components/league/TableCells";
import { thousands } from "@epl/core";

// What the season adds up to, above the matches that made it.
//
// **Its own section rather than the match log's foot** (Craig, 4 Sep 2026:
// "Maybe we need a season data and match log section?"). The season is a
// question a reader asks WITHOUT reading the matches, and a `tfoot` twenty rows
// down a sideways-scrolling table is not where it gets answered. It is also
// where the pitch maps land when the sister repo exports the shot data they
// need.
//
// **Championship Manager's own appearances table, and only its own** (Craig,
// 4 Sep 2026: *"this row is bad. copy the rows the real cm profile shows."*).
// `cm9900/11.jpg` closes a profile with COMPETITION rows down the left —
// `Non Competitive · League · Cup · Continental · International · Senior Club` —
// against plated column heads reading `Apps Gls Con Pens Asts Yel Red MoM Av R`.
// This had been FPL's `Totals`/`Per 90` pair against thirteen abbreviations,
// which is a fantasy site's table wearing CM's furniture.
//
// **One row, because FPL publishes one competition.** The other five of CM's
// rows are cups, Europe and internationals, and nothing in the feed knows about
// any of them — `docs/ui/prem.md` records the same limit for the fixture list's
// competition column. Six rows of dashes would be five confident statements that
// he has played no cup football, which is not a thing we know.
//
// **`Pens`, `MoM` and `Av R` are not drawn**, for the same reason: no source.
// What replaces them is what we do measure — clean sheets, saves and FPL's own
// points. The row label sits in CM's index block, drawn in the club's colour
// like every other index cell on his screens.

const dash = <span className="text-faint">—</span>;
const whole = (value: number | null) => (value === null ? dash : String(value));

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
      <div className={SCROLL}>
        <table className={BOARD}>
          <thead>
            <tr>
              <PlateHead>Competition</PlateHead>
              {COLUMNS.map((column) => (
                <PlateHead key={column.head} at="end" title={column.title}>
                  {column.head}
                </PlateHead>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              {/* CM's left column names the competition, not the row's kind.
                  `League` is the only one FPL publishes. */}
              <IndexCell>League</IndexCell>
              {COLUMNS.map((column) => (
                <td key={column.head} className={`${BOARD_FIGURE} font-bold`}>
                  {column.total(t)}
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

interface Column {
  head: string;
  title: string;
  /** A rule down the left marks where FPL's account ends and Fantrax's begins. */
  rule?: boolean;
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
  // FPL's own points, and headed as FPL's. Never `FPts`, which is Fantrax's word
  // for Fantrax's scoring of a roster slot we chose.
  { head: "FPL", title: "FPL's own points", total: (t) => whole(t.fplPoints) },
];
