import ScrollBoard from "../../components/league/ScrollBoard";
import type { PastSeason } from "@epl/core";
import Section from "../../components/shell/Section";
import { BOARD, FIGURE, ROW_NAME, ROW_RULE, TEXT } from "@/app/desk";
import { HeadRow, MUTE, PlateHead } from "../../components/league/TableHeads";
import { IndexCell } from "../../components/league/TableCells";
import { seasonKey, thousands } from "@epl/core";

// CM's appearances table at season scale (`cm9900/11.jpg`). Only figures FPL kept every season back to 2014/15: one it
// did not collect that year arrives as a nought. Points are FPL's own, never headed FPts.

export default function PastSeasons({
  seasons,
  current,
  clubs,
}: {
  seasons: readonly PastSeason[];
  /** This season, as the first row (Craig, 4 Sep 2026); null for a man with no minutes this season. */
  current?: PastSeason | null;
  /** The club he was at, by the sister store's season key (`"25-26"`); a season it lacks prints a dash. */
  clubs: ReadonlyMap<string, string>;
}) {
  if (seasons.length === 0 && !current) {
    // A debutant: a heading over no rows would claim something failed to load.
    return null;
  }

  const rows = current ? [current, ...seasons] : seasons;

  return (
    // No provenance line (Craig, 4 Sep 2026).
    <Section title={rows.length === 1 ? `Season · ${rows[0].season}` : "Seasons"}>
      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <PlateHead>
                <span className={MUTE}>Season</span>
              </PlateHead>
              <PlateHead>
                <span className={MUTE}>Club</span>
              </PlateHead>
              {COLUMNS.map((column) => (
                <PlateHead key={column.head} at="centre" title={column.title}>
                  {column.head}
                </PlateHead>
              ))}
            </HeadRow>
          </thead>
          <tbody>
            {rows.map((season) => (
              <tr key={season.season} className={ROW_RULE}>
                {/* `IndexCell` is the `<td>`: wrapped in one it breaks hydration. */}
                <IndexCell>{season.season}</IndexCell>
                <td className={`${ROW_NAME} whitespace-nowrap px-1.5`}>
                  {clubs.get(seasonKey(season.season) ?? "") ?? <span className="text-faint">—</span>}
                </td>
                {COLUMNS.map((column) => (
                  <td key={column.head} className={`${FIGURE} ${TEXT.center}`}>
                    {column.of(season)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
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
  {
    head: "Pts",
    title: "FPL's points, under FPL's rules — not this league's",
    of: (s) => s.fplPoints,
  },
];
