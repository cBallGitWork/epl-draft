import Link from "next/link";
import {
  GROUPS,
  type GroupKey,
  type LeagueTeam,
  type PlayerBoardRow,
  clubColours,
  playersInGroup,
  toFplClubCode,
} from "@epl/core";
import PlayerPortrait from "../components/football/PlayerPortrait";
import { Head, HeadRow, NameHead, PLATE } from "../components/league/TableHeads";

// CM's stat board, on the player pool.
//
// Craig, 1 Sep 2026, against the "Average Rating" screenshot: rank, the man, his
// fantasy team, his club, one raw count. **These are Fantrax's own scoring
// categories** — see `playerCategories.ts` for why the numbers are theirs and
// not FPL's on a screen about fantasy scoring.
//
// The board is the first twenty. `BOARD_ROWS` records why: the pool is 646 and
// the question "who leads" is answered in the first twenty; the rest is a
// directory, which is what the table below this already is.

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
      <section className="cm-panel px-2 py-1.5">
        <p className="text-center font-chrome text-sm font-bold text-accent lg:text-lg">
          {category}
        </p>
      </section>

      {/* **A box shorter than its list, and a scrollbar that says so.** Fifty
          rows in a container sized to about fourteen, which is what CM's own
          stat lists do — the scrollbar is not decoration on them, it is the
          thing that makes a cut list read as a long one rather than as a short
          one. `--table-row` is the measured row height, so the box holds a whole
          number of rows at both widths rather than half of one at the bottom
          edge. */}
      <div
        className="cm-panel cm-scroll overflow-auto p-2"
        style={{ maxHeight: "calc(14 * var(--table-row) + var(--table-chrome))" }}
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            The pool ranked by {category}, Fantrax&apos;s own count
          </caption>
          <thead>
            <HeadRow>
              <Head width="w-10 lg:w-16">
                <span className="flex h-7 items-center justify-center px-1.5" />
              </Head>
              <NameHead label="Player" />
              <Head width="w-10 lg:w-16" title="What Fantrax lists him as">
                <span className={PLATE}>Pos</span>
              </Head>
              <Head width="w-24 lg:w-40" title="The fantasy team holding him">
                <span className={PLATE}>Team</span>
              </Head>
              <Head width="w-16 lg:w-28" title="His Premier League club">
                <span className={PLATE}>Club</span>
              </Head>
              <Head width="w-16 lg:w-24" title={category}>
                <span className={PLATE}>{category}</span>
              </Head>
            </HeadRow>
          </thead>
          <tbody>
            {rows.map((row) => {
              const owner = row.line.ownerTeamId
                ? teams.get(row.line.ownerTeamId)?.name ?? null
                : null;

              return (
                <tr key={row.line.fantraxId} className="border-b border-bg hover:bg-surface">
                  <td className="cm-index numeric px-1.5 text-center text-2xs font-bold">
                    {ordinal(row.rank)}
                  </td>
                  <td className="pl-2">
                    <Link
                      href={`/players/${row.line.fantraxId}`}
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
                  <td className={`${FIGURE} text-faint`}>{row.line.position ?? DASH}</td>
                  {/* **"In the bin" for nobody's player** (Craig, 1 Sep). Not a
                      dash: an unowned player is not a missing reading, he is a
                      free agent, and the league has a word for that. */}
                  <td className="px-1.5 text-2xs">
                    {owner === null ? (
                      <span className="text-faint">In the bin</span>
                    ) : (
                      <span className="truncate font-bold text-mid">{owner}</span>
                    )}
                  </td>
                  <td className={`${FIGURE} text-faint`}>{row.line.clubShort ?? DASH}</td>
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
            href={`/players?group=${group}&cat=${entry.key}`}
            aria-current={entry.label === category ? "page" : undefined}
            className="cm-tab flex flex-1 items-center justify-center whitespace-nowrap px-2 text-2xs font-bold uppercase lg:min-h-9 lg:text-sm"
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <nav aria-label="Stat groups" className="flex flex-wrap">
        {GROUPS.filter((entry) => entry.key !== "appearances").map((entry) => (
          <Link
            key={entry.key}
            href={`/players?group=${entry.key}`}
            aria-current={entry.key === group ? "page" : undefined}
            className="cm-tab flex min-h-11 flex-1 items-center justify-center px-2 text-2xs font-bold uppercase lg:min-h-9 lg:text-sm"
          >
            {entry.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

const DASH = "—";
const FIGURE = "numeric px-1.5 text-center text-2xs font-bold";

/** `1` becomes `1st`. CM's index cell carries the ordinal and not the number. */
function ordinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return `${rank}th`;
  return `${rank}${["th", "st", "nd", "rd"][rank % 10] ?? "th"}`;
}
