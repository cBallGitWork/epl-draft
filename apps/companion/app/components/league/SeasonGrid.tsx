import ScrollBoard from "./ScrollBoard";
import { columnLabel, DASH, fixed } from "@epl/core";
import type { TeamStats } from "@epl/core";
import {
  BOARD_FIGURE,
  PANEL_FLUSH,
  ROW_NAME,
  ROW_RULE,
  SMALL_CAPS,
} from "@/app/desk";
import { MUTE, PlateHead, HeadRow } from "./TableHeads";

// Championship Manager's attribute grid, for a squad's season.
//
// The second panel on `/squad/[teamId]`, and the reason it exists is that a CM
// screen is two to four bevelled panels laid out together rather than one column
// that scrolls. This one was already paid for: `teamStats.ts` reads the whole
// `TeamStats` to build a points map and drops everything else on the floor —
// thirteen goalkeeper columns and eleven outfield ones, `perGame`, the season's
// own name, and Fantrax's prose definition of every category. All of it was one
// `leagueCache` hit away and none of it was on screen.
//
// **Read, never computed.** Every figure is Fantrax's own, re-rendered by their
// `FPTS` view as the points that category contributed, and they sum to the total
// exactly — the same property `breakdownOf` stands on. Our engine could only ever
// have approximated the five categories FPL does not publish.
//
// **Column-driven, never a fixed list.** The real league scores five categories
// the rehearsal league does not, so the header is whatever the league we are
// serving answered with. Probed 31 Aug 2026 on the rehearsal league: 13 keeper
// columns (`GP Min CS GA Sv YC RC PKS PKM G A AF OG`) and 11 outfield
// (`GP Min G A AF YC RC PKM OG GAO CS`), every value a real number and not one
// null in either group.
//
// **Beside the board above `lg`, stacked below it.** This comment argued the
// opposite for a day — "seventeen columns and a pitch both want the width, so
// side by side gives neither enough" — while its only caller laid the two out
// side by side, and while the pitch it named had been deleted from that branch
// by the same commit. `cm9900/05.jpg` does stack a list panel over a detail one,
// so the citation was sound and the reasoning was not. Both panels scroll their
// own tables, so neither has to fit; what the phone cannot do is put them side
// by side, and there they stack.
//
// Rows are dense on purpose and the tap floor does not apply to them: nothing in
// this table is a control, and `min-h-11` is a rule about what a thumb has to
// hit (DESIGN §7).

/** What a figure is. Amber is "a figure" and red "a negative" in the desk's
 *  grammar (DESIGN §3); a nought is a figure nobody needs to read, so it takes
 *  the quietest step of the ink ladder rather than a fourth colour. A null is
 *  Fantrax printing a dash for a category a man never registered, and a dash is
 *  what it stays — never a nought, which would be a claim. */
function tone(value: number | null): string {
  if (value === null || value === 0) return "text-faint";
  return value < 0 ? "text-bad" : "text-mid";
}

export default function SeasonGrid({
  stats,
  names,
}: {
  stats: TeamStats;
  /** Fantrax's ids are the join key and its rows carry no names — every caller
   *  already holds the squad, which names a man properly, and a second copy is
   *  the copy that disagrees when a commissioner renames somebody. */
  names: Map<string, string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {stats.groups
        .filter((group) => group.lines.length > 0)
        .map((group) => (
          <section key={group.name} className={PANEL_FLUSH}>
            {/* Its own title bar, which is how a CM panel opens. The bar carries
                a title and nothing else — the season below it is content. */}
            <div className="cm-titlebar px-2 py-1">
              <h2 className={`truncate ${SMALL_CAPS} text-ink`}>
                {group.name}
              </h2>
            </div>

            {/* Fantrax's own label for the season, verbatim. It is a better
                heading than the `projected` boolean the list derives "Proj" and
                "FPts" from, because it says WHICH season as well as whether it
                has been played. No count beside it: the index block on the last
                row IS the count, which is the whole argument for the index
                block. */}
            <p className="numeric px-2 py-1 text-3xs text-faint">
              {stats.season.name || (stats.season.projected ? "Fantrax projects" : "This season")}
            </p>

            <ScrollBoard>
              <table className="w-full border-collapse whitespace-nowrap">
                <thead>
                  <HeadRow>
                    {/* The bevel goes on a block inside each cell and never on
                        the cell: these tables collapse their borders, so a strip
                        of bevelled cells loses its inner edges (desk.css). */}
                    <PlateHead at="end">
                      <span className={MUTE}>Rank</span>
                    </PlateHead>
                    <PlateHead>
                      <span className={MUTE}>Player</span>
                    </PlateHead>
                    {group.columns.map((column) => {
                      const { name, definition } = columnLabel(column);
                      return (
                        // Fantrax's own sentence is where this league's rules are published, so the title carries it.
                        <PlateHead key={column.code} at="end" title={definition === null ? name : `${name} — ${definition}`}>
                          {column.code}
                        </PlateHead>
                      );
                    })}
                    <PlateHead at="end" title="Fantasy points, Fantrax's own">FPts</PlateHead>
                    <PlateHead at="end" title="Fantasy points a game">FP/G</PlateHead>
                  </HeadRow>
                </thead>

                <tbody>
                  {group.lines.map((line, index) => (
                    <tr key={line.fantraxId} className={ROW_RULE}>
                      {/* CM's leading index block, so the eye counts down the
                          blocks rather than the rows. */}
                      <td className="cm-index numeric px-1.5 py-1 text-right">
                        {index + 1}
                      </td>
                      {/* Sized to the longest name rather than truncated. The
                          table is wider than a phone whatever this column does —
                          seventeen columns are — so squeezing the name buys no
                          screen and loses the one thing on the row a reader
                          cannot infer from the figures. */}
                      <td className={`px-1.5 py-1 ${ROW_NAME} text-ink`}>
                        {names.get(line.fantraxId) ?? line.fantraxId}
                      </td>
                      {line.values.map((value, at) => (
                        <td
                          key={group.columns[at]?.code ?? at}
                          className={`${BOARD_FIGURE} py-1 ${tone(value)}`}
                        >
                          {value ?? DASH}
                        </td>
                      ))}
                      <td className={`${BOARD_FIGURE} py-1 font-bold text-ink`}>
                        {line.points ?? DASH}
                      </td>
                      <td className={`${BOARD_FIGURE} py-1 text-muted`}>
                        {line.perGame === null ? DASH : fixed(line.perGame, "perGame")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollBoard>
          </section>
        ))}
    </div>
  );
}
