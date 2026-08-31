import { columnLabel } from "@epl/core";
import type { TeamStats } from "@epl/core";

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
          <section key={group.name} className="cm-panel flex flex-col">
            {/* Its own title bar, which is how a CM panel opens. The bar carries
                a title and nothing else — the season below it is content. */}
            <div className="cm-titlebar px-2 py-1">
              <h2 className="truncate text-2xs font-bold uppercase text-ink">
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

            <div className="overflow-x-auto">
              <table className="w-full border-collapse whitespace-nowrap">
                <thead>
                  <tr className="text-3xs uppercase">
                    {/* The bevel goes on a block inside each cell and never on
                        the cell: these tables collapse their borders, so a strip
                        of bevelled cells loses its inner edges (desk.css). */}
                    <th scope="col" className="p-0 font-bold">
                      <span className="cm-bevel flex h-6 items-center justify-end px-1.5">#</span>
                    </th>
                    <th scope="col" className="p-0 text-left font-bold">
                      <span className="cm-bevel flex h-6 items-center px-1.5">Player</span>
                    </th>
                    {group.columns.map((column) => {
                      const { name, definition } = columnLabel(column);
                      return (
                        <th
                          key={column.code}
                          scope="col"
                          // Fantrax's own sentence, which is where this league's
                          // rules are published — what counts as a clean sheet
                          // is theirs, not ours, and this header is the only
                          // place in the payload it appears.
                          title={definition === null ? name : `${name} — ${definition}`}
                          className="p-0 font-bold"
                        >
                          <span className="cm-bevel flex h-6 items-center justify-end px-1.5">
                            {column.code}
                          </span>
                        </th>
                      );
                    })}
                    <th scope="col" className="p-0 font-bold" title="Fantasy points, Fantrax's own">
                      <span className="cm-bevel flex h-6 items-center justify-end px-1.5">FPts</span>
                    </th>
                    <th scope="col" className="p-0 font-bold" title="Fantasy points a game">
                      <span className="cm-bevel flex h-6 items-center justify-end px-1.5">FP/G</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {group.lines.map((line, index) => (
                    <tr key={line.fantraxId} className="border-b border-bg">
                      {/* CM's leading index block, so the eye counts down the
                          blocks rather than the rows. */}
                      <td className="cm-index numeric px-1.5 py-1 text-right text-3xs font-bold">
                        {index + 1}
                      </td>
                      {/* Sized to the longest name rather than truncated. The
                          table is wider than a phone whatever this column does —
                          seventeen columns are — so squeezing the name buys no
                          screen and loses the one thing on the row a reader
                          cannot infer from the figures. */}
                      <td className="px-1.5 py-1 text-2xs text-info">
                        {names.get(line.fantraxId) ?? line.fantraxId}
                      </td>
                      {line.values.map((value, at) => (
                        <td
                          key={group.columns[at]?.code ?? at}
                          className={`numeric px-1.5 py-1 text-right text-2xs ${tone(value)}`}
                        >
                          {value ?? "—"}
                        </td>
                      ))}
                      <td className="numeric px-1.5 py-1 text-right text-2xs font-bold text-ink">
                        {line.points ?? "—"}
                      </td>
                      <td className="numeric px-1.5 py-1 text-right text-2xs text-muted">
                        {line.perGame ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  );
}
