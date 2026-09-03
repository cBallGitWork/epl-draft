import Caption from "../components/shell/Caption";
import Link from "next/link";
import {
  type GroupKey,
  type LeagueTeam,
  type PlayerBoardRow,
  clubColours,
  ordinal,
  playersInGroup,
  toFplClubCode,
} from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import GroupNav from "../components/league/GroupNav";
import { IndexCell } from "../components/league/TableCells";
import { PLAYERS } from "../league/SectionNav";
import { BOARD, FIGURE, ROW_RULE } from "@/app/desk";

// CM's stat board, on the player pool.
//
// Craig, 1 Sep 2026, against the "Average Rating" screenshot: rank, the man, his
// fantasy team, his club, one raw count. **These are Fantrax's own scoring
// categories** — see `playerCategories.ts` for why the numbers are theirs and
// not FPL's on a screen about fantasy scoring.
//
// The board is the first `BOARD_ROWS` of the pool, in a box that holds
// `VISIBLE_ROWS` of them — see those constants for why each is the number it is.
// The rest of the 646 is the directory below this, which has the search and the
// filters a scroll box cannot offer.

export default function Board({
  rows,
  group,
  category,
  teams,
  codes,
}: {
  rows: PlayerBoardRow[];
  group: GroupKey;
  category: string;
  teams: Map<string, LeagueTeam>;
  /** FPL's season-stable player code, for the portrait. Null is ordinary — the
   *  academy names FPL has never listed — and costs the photograph and nothing
   *  else. */
  codes: Map<string, number | null>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* **The board needs its own plate**, and `/players` is not a league route
          so `LeagueShell` does not give it one. Without it the match photograph
          runs straight through every row — `groundfit` exists to catch exactly
          that, and CM's own rule is that nothing prints on the bare ground.

          Its own caption strip above it, for the same reason the league screens
          have one: the blue bar names the SCREEN and this names what is in the
          panel. */}
      <Caption>{category}</Caption>

      {/* **A box shorter than its list, and a scrollbar that says so.** Fifty
          rows in a container sized to about fourteen, which is what CM's own
          stat lists do — the scrollbar is not decoration on them, it is the
          thing that makes a cut list read as a long one rather than as a short
          one. `--table-row` is the measured row height, so the box holds a whole
          number of rows at both widths rather than half of one at the bottom
          edge. */}
      <div
        className="cm-panel cm-scroll cm-scroll-y overflow-auto p-2"
        style={{ maxHeight: `calc(${VISIBLE_ROWS} * var(--table-row) + var(--table-chrome))` }}
      >
        <table className={BOARD}>
          <caption className="sr-only">
            The pool ranked by {category}, Fantrax&apos;s own count
          </caption>
          {/* **No column heads, because CM has none.** Craig, 1 Sep 2026:
              "the rows don't really look like CM, we don't need column headers
              for all". The Average Rating shot is a caption and then the list —
              no `Pos`, no `Club`, no header over the rating. The caption above
              this table already says which category it is, and a head over every
              column repeats it while stealing a row's worth of height from a
              board whose whole problem was density. The `<caption>` stays for a
              screen reader, which is the one reader that cannot see the strip
              above. */}
          <tbody>
            {rows.map((row) => {
              const owner = row.line.ownerTeamId
                ? teams.get(row.line.ownerTeamId)?.name ?? null
                : null;

              return (
                <tr key={row.line.fantraxId} className={`${ROW_RULE} hover:bg-surface`}>
                  <IndexCell>{ordinal(row.rank)}</IndexCell>
                  {/* `w-full` on the NAME cell, which under automatic table
                      layout means "take the slack" rather than "be the whole
                      row" — the other cells keep their content width and the
                      name absorbs what is left. Without it the name pushed the
                      figure off the right edge of a 390 phone and the board
                      ranked by goals did not show the goals. `max-w-0` plus
                      `truncate` inside is what makes the name give way rather
                      than the column that matters. */}
                  <td className="w-full max-w-0 pl-2">
                    <Link
                      href={`/players/${row.line.fantraxId}`}
                      // `min-h-11` AND `.cm-row`, which is the documented pair
                      // rather than a belt and braces: `desk.css` says in as
                      // many words that "`.cm-row` says nothing below `lg`, and
                      // that is the whole design" — the phone's 44px tap floor
                      // is the `min-h-11`, and the class takes over at `lg` to
                      // bring the row down to CM's 28. Dropping the `min-h`
                      // took every row on a 390 phone to 32px, which tapfit
                      // caught as 50 under-floor targets in one sweep.
                      className="cm-row flex min-h-11 items-center gap-2 font-bold hover:underline"
                    >
                      <PlayerPortrait
                        player={{
                          code: codes.get(row.line.fantraxId) ?? null,
                          name: row.line.name,
                        }}
                        colours={clubColours(toFplClubCode(row.line.clubShort ?? ""))}
                      />
                      <span className="min-w-0 truncate">{row.line.name}</span>
                    </Link>
                  </td>
                  {/* Position and club stand down under a thumb. A 390 phone
                      cannot hold six columns and the one it was dropping was
                      the FIGURE — a board ranked by goals that does not show
                      the goals. What a reader needs on a phone is the order,
                      the man, who owns him and the number; his position and his
                      club are on his own page, one tap away. */}
                  <td className={`${FIGURE} hidden text-faint lg:table-cell`}>
                    {row.line.position ?? DASH}
                  </td>
                  {/* **"In the bin" for nobody's player** (Craig, 1 Sep). Not a
                      dash: an unowned player is not a missing reading, he is a
                      free agent, and the league has a word for that.

                      The owner is plain ink and not `text-mid`. Amber is
                      DESIGN §3's slot for A FIGURE, and a manager's team name is
                      not one — it was the loudest thing in a row whose figures
                      are the point, and it was making the same claim they do. */}
                  <td className="max-w-24 px-1.5 text-2xs lg:max-w-none">
                    {owner === null ? (
                      <span className="text-faint">In the bin</span>
                    ) : (
                      <span className="block truncate font-bold text-ink">{owner}</span>
                    )}
                  </td>
                  <td className={`${FIGURE} hidden text-faint lg:table-cell`}>
                    {row.line.clubShort ?? DASH}
                  </td>
                  <td className={`${FIGURE} text-base text-accent lg:text-lg`}>
                    {row.value === null ? DASH : row.value.toLocaleString("en-GB")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* The category strip: the group's own categories, as the tabs they behave
          like. Fewer than the twelve on the team board because a player has no
          team-level categories, and `Min` is deliberately absent — Craig asked
          for it out, and it is a denominator rather than an achievement. */}
      <nav aria-label="Categories" className="flex flex-wrap gap-1">
        {playersInGroup(group).map((entry) => (
          <Link
            key={entry.key}
            href={`${PLAYERS}?group=${group}&cat=${entry.key}`}
            aria-current={entry.label === category ? "page" : undefined}
            className="cm-tab flex flex-1 items-center justify-center whitespace-nowrap px-2 text-2xs font-bold uppercase lg:min-h-9 lg:text-sm"
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <GroupNav
        group={group}
        href={(key) => `${PLAYERS}?group=${key}`}
        omit={["appearances"]}
      />
    </div>
  );
}

/** How many rows the box shows at once, the rest reached by the scrollbar.
 *
 *  Fourteen because that is what CM's own stat lists show — the Average Rating
 *  shot has fourteen visible with a scrollbar saying there are more, and the
 *  scrollbar only means anything if the list is longer than the box. Counted in
 *  ROWS rather than set in pixels for the reason `LeagueShell` sizes its panel
 *  that way: `--table-row` is measured and differs between the phone and the
 *  desk, so a pixel height would be right at one width and wrong at the other. */
const VISIBLE_ROWS = 14;

const DASH = "—";
