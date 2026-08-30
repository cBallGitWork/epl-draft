import Columns, { COLUMNS } from "./Columns";
import LeagueShell from "./Shell";
import Skeleton from "../components/shell/Skeleton";

// The table, waiting on Fantrax.
//
// `LeagueShell` is the real one, so the header and the section nav are on screen
// and working before a row exists — a reader who wanted Schedule or Matchups can
// go there without waiting for the standings he did not come for. The column
// heads are the page's own words about what the columns mean and not part of the
// answer, so they print too — and they come from `Columns`, so there is one
// place to change them rather than two that can disagree.
//
// **Not `SkeletonRows`.** That primitive draws the app's standard stack of cards
// and four other screens still open on it; the table stopped being cards, and a
// loading state whose shape the answer does not land in is the one thing a
// skeleton must not be.

/** A frame hint, never a fact about the league: how many teams are in it is read
 *  from `getLeagueInfo` (CLAUDE.md), so a skeleton asserting one would be
 *  writing down one of the few things this app has promised never to assume. */
const ROWS = 6;

export default function Loading() {
  return (
    <LeagueShell title="Table" current="table">
      <div aria-busy>
        <table className="w-full border-collapse text-sm">
          <Columns />
          <tbody>
            {Array.from({ length: ROWS }, (_, at) => (
              <tr key={at} className="border-b border-line/60">
                {COLUMNS.map((column) => (
                  <td key={column.key} className="px-1 py-1">
                    {column.key === "team" ? (
                      // The one cell whose height sets the row's, so the real
                      // rows land inside these boxes rather than pushing them
                      // down the screen.
                      <span className="flex min-h-11 items-center gap-2 pl-1">
                        <Skeleton width="1.5rem" height="1.5rem" circle />
                        <Skeleton width="45%" height="0.875rem" />
                      </span>
                    ) : (
                      <span className="flex justify-end">
                        <Skeleton width="100%" height="0.75rem" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LeagueShell>
  );
}
