import Image from "next/image";
import Link from "next/link";
import { crestUrl, loggedPlayers, matchLine, sheetSides } from "@epl/core";
import type { Club, IntelMatchPlayer, PlayerMatchStats, SheetRow } from "@epl/core";
import Section from "../../../components/shell/Section";
import { PLAYER } from "../../routes";
import {
  BOARD,
  BOARD_FIGURE,
  HEAD_CELL,
  HEAD_PLATE,
  ROW_NAME,
  ROW_RULE,
  SCROLL,
  STICKY_LEAD,
} from "@/app/desk";
import { ROW_LINK } from "../../../components/league/TableCells";
import type { Match } from "./match";
import { MUTE, SortHead } from "../../../components/league/TableHeads";
import { statsHref } from "./statsSort";
import Absent from "@/app/components/shell/Absent";

// Every man in the match, and what he did in it (Craig, 4 Sep 2026: *"Add a
// players stats section. This can be a table of rows like fantrax/fpl do for a
// page."*).
//
// **The football half, where the Fantasy Scores tab is the league's half.** This
// counts goals, assists, saves and minutes and prints SofaScore's rating; that
// one carries the shirt number, the sub note and what the afternoon was worth.
// The two are one table's worth of columns split by whose question they answer,
// which is the same split `/prem/club/[code]` makes between Pos and Elig.
//
// **One table across both clubs, not two.** The Fantasy tab already draws the
// two sides facing each other, and a second pair of columns saying the same
// thing about the same men would be the screen repeating itself. A club column
// says which side each row is, and the table sorts by side then down the pitch.

/** Columns, declared as data so the head and the body cannot disagree about how
 *  many there are. `title` is the long form for the header's tooltip, because
 *  three letters over a column of figures is not self-explanatory.
 *
 *  **Eleven measures where there were four** (Craig, 10 Sep 2026: *"shoudl also
 *  use more advanced stats too"*). Every one of them was already on
 *  `PlayerMatchStats` or `MatchSheetLine` and simply not drawn.
 *
 *  **Which of the two owns a figure is not arbitrary.** `MatchSheetLine` comes
 *  from FPL's fixture list and is genuinely per-fixture, so `bps` and the
 *  defensive contribution are read from there. The expected family is only on
 *  the live endpoint, where it is a GAMEWEEK total that `mapLiveStats` writes as
 *  0 on a double — which is why the section's aside says whose figures these are
 *  and `docs/ui/match.md` carries the bound. */
const COLUMNS = [
  { head: "Pts", title: "What the afternoon was worth — FPL's own points", of: (r: Row) => r.points },
  { head: "Min", title: "Minutes played", of: (r: Row) => r.minutes },
  { head: "G", title: "Goals", of: (r: Row) => r.line.goals },
  { head: "A", title: "Assists", of: (r: Row) => r.line.assists },
  { head: "xG", title: "Expected goals", of: (r: Row) => r.stats?.expectedGoals ?? null, dp: 2 },
  { head: "xA", title: "Expected assists", of: (r: Row) => r.stats?.expectedAssists ?? null, dp: 2 },
  { head: "CS", title: "Clean sheet", of: (r: Row) => (r.stats?.cleanSheet === true ? 1 : 0) },
  { head: "GC", title: "Goals conceded", of: (r: Row) => r.stats?.goalsConceded ?? null },
  { head: "Sv", title: "Saves", of: (r: Row) => r.line.saves },
  {
    head: "DC",
    title: "Defensive contribution — tackles, interceptions, clearances, recoveries",
    of: (r: Row) => r.line.defensiveContribution,
  },
  { head: "B", title: "FPL bonus", of: (r: Row) => r.line.bonus },
  { head: "YC", title: "Yellow cards", of: (r: Row) => r.line.yellowCards },
  { head: "Rtg", title: "SofaScore's rating out of ten", of: (r: Row) => r.logged?.rating ?? null, dp: 1 },
] as const;

/** Which column the table is ordered by, by its own head — the heads are already
 *  unique and short, so they are the query value too and there is no second
 *  vocabulary to keep in step. */
export type StatSort = (typeof COLUMNS)[number]["head"];

/** The column a reader lands on (Craig, 11 Sep 2026: *"default ordering is
 *  fantasy points"*).
 *
 *  It used to be the team sheet's order — down the pitch, each side in turn —
 *  which is the right default for a LINE UP and the wrong one for a table of
 *  measures. That order is still a tab away and is what `/players` is for now.
 *
 *  **And `Pts` is a column now because of it.** The board had eleven measures
 *  and no points, so ordering by them would have been an order with no visible
 *  author — the thing `prem/Columns.tsx` says in as many words about an
 *  invisible tiebreak. `BPS` came out to make the room, which is what Craig
 *  asked for in the same message: it is the input to the bonus, and `B` beside
 *  it is the output a reader can act on. */
export const DEFAULT_SORT: StatSort = "Pts";

interface Row {
  player: SheetRow["player"];
  line: SheetRow["line"];
  club: Club | undefined;
  logged: IntelMatchPlayer | undefined;
  minutes: number | null;
  /** The live endpoint's row for him, which is the only source of the expected
   *  family and of a clean sheet. Undefined for a man it has no row for. */
  stats: PlayerMatchStats | undefined;
  /** FPL's own points for this fixture — the column the table opens on. */
  points: number | null;
}

export default function PlayerStats({
  match,
  sort = DEFAULT_SORT,
  descending = true,
}: {
  match: Match;
  sort?: StatSort;
  descending?: boolean;
}) {
  const id = match.fixture.id;
  // Nothing to count before a ball is kicked. The preview above already says
  // what there is to say, and an empty table under it would be furniture.
  if (match.sheet === null || match.sheet.lines.length === 0) return null;

  const { home, away } = sheetSides(match.sheet, match.snapshot);
  const logged = loggedPlayers(match.logged);
  const rows = sorted(
    [...ordered(home, match.home, logged, match), ...ordered(away, match.away, logged, match)],
    sort,
    descending,
  );

  return (
    // **No title** (Craig, 11 Sep 2026: *"remove Player stats"*). The tab strip
    // above already reads PLAYER STATS and the caption under it said it again —
    // the same fact twice, and one row of a phone's screen to say it. The aside
    // stays: whose figures these are is not on the plate above.
    <Section aside="FPL's own · SofaScore's rating">
      {/* **Opaque, and the frozen column is why.** A sticky lead has to hide the
          figures passing under it, so it takes `bg-surface`; against
          `.cm-panel`'s 88% the column then reads as a lighter plate laid on the
          board rather than as part of it. `/players`' own table made this call
          first and for the same reason — it is the one other board in the app
          that overrides the panel's translucency. */}
      <div className={`${SCROLL} bg-surface`}>
        <table className={BOARD}>
          <thead>
            <tr>
              {/* **The name freezes and the measures scroll under it.** Eleven
                  figure columns is `DESIGN` §2's many-measure board, which keeps
                  every column and scrolls sideways — and a board you can scroll
                  off the names of is a grid of numbers about nobody. The pool's
                  own table settled this pattern; this is its second use. */}
              <th className={`${HEAD_CELL} ${STICKY_LEAD} ${NAME_WIDTH}`}>
                <div className={HEAD_PLATE}>
                  <span className={MUTE}>Player</span>
                </div>
              </th>
              {/* **Every measure is a link** (Craig, 11 Sep 2026: *"let us rank
                  by columns"*), which is the app's own sorting idiom rather than
                  a new one: `prem/sort.ts` records why it is a link and not a
                  click handler — the server does the ordering, a phone gets
                  HTML, and a sorted table survives being shared. */}
              {COLUMNS.map((column) => (
                <SortHead
                  key={column.head}
                  width=""
                  title={column.title}
                  href={statsHref(id, column.head, sort, descending)}
                  label={column.head}
                  sorted={column.head === sort ? (descending ? "descending" : "ascending") : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.player.id} className={ROW_RULE}>
                <td className={`p-0 ${STICKY_LEAD} ${NAME_WIDTH}`}>
                  <Link href={`${PLAYER}/${row.player.code}`} className={ROW_LINK}>
                    {/* **The crest, where the club's three letters were** (Craig,
                        10 Sep 2026: *"need the club logos etc"*). One table across
                        both sides needs a per-row mark saying which, and a badge
                        reads at a glance where `IPS` has to be parsed. Sized here
                        rather than by a shared component: `TableCells` records
                        that a crest cell was counted and refused, because every
                        site wants its own size and fallback. */}
                    <Crest club={row.club} />
                    <span className={`min-w-0 truncate ${ROW_NAME}`}>{row.player.name}</span>
                  </Link>
                </td>
                {COLUMNS.map((column) => {
                  const value = column.of(row);
                  const dp = "dp" in column ? column.dp : 0;
                  // **Cyan for the two figures nobody recorded** — FPL computed
                  // the points and SofaScore the rating, and `--color-info` is
                  // exactly "a derived reading". `cm9900/16.jpg` runs its
                  // ratings column in the same ink.
                  const derived = column.head === "Rtg" || column.head === "Pts";
                  return (
                    <td
                      key={column.head}
                      className={`${BOARD_FIGURE} ${derived ? "font-bold text-info" : ""}`}
                    >
                      {/* A nought is shown as absence here: thirty rows of 0 bury the figures that are not. */}
                      {value === null || value === 0 ? (
                        <Absent />
                      ) : (
                        value.toFixed(dp)
                      )}
                    </td>
                  );
                })}

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** One side, keeper to attack, with the bench under it. */
function ordered(
  rows: readonly SheetRow[],
  club: Club | undefined,
  logged: Map<number, IntelMatchPlayer>,
  match: Match,
): Row[] {
  return rows
    .map((row) => ({
      player: row.player,
      line: row.line,
      club,
      logged: logged.get(row.player.code),
      minutes: match.figures.get(row.player.id)?.minutes ?? null,
      stats: match.figures.get(row.player.id),
      points: match.figures.get(row.player.id)?.fplPoints ?? null,
    }))
    .sort(
      (a, b) =>
        matchLine(a.logged?.position ?? null) - matchLine(b.logged?.position ?? null) ||
        (b.points ?? 0) - (a.points ?? 0),
    );
}

/** Both sides as one board, in the column the reader asked for.
 *
 *  **A stable order under the sort**, which `ordered` above supplies: men level
 *  on the column in force keep the team sheet's own sequence rather than
 *  whatever `sort` happens to do with equal keys. A table of thirty names where
 *  half of them are on 1 point would otherwise reshuffle its middle every time
 *  a different column was picked.
 *
 *  Absence sinks in both directions. A man with no figure for this column has
 *  not scored lowest on it; he has no reading, and floating him to the top of an
 *  ascending sort would be exactly the claim DESIGN §7 refuses. */
export function sorted(rows: readonly Row[], sort: StatSort, descending: boolean): Row[] {
  const column = COLUMNS.find((entry) => entry.head === sort) ?? COLUMNS[0];
  return [...rows].sort((a, b) => {
    const left = column.of(a);
    const right = column.of(b);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return descending ? right - left : left - right;
  });
}

/** The club's badge, at the size a dense row can carry.
 *
 *  20px, against `--row-badge`'s 26/20 — this row has eleven figure columns
 *  after it and the badge is an identifier rather than a subject. A club the
 *  snapshot does not carry draws nothing rather than a placeholder: a wrong
 *  crest is worse than none, which is `clubs.ts`' own rule for the same reason.
 */
function Crest({ club }: { club: Club | undefined }) {
  if (club === undefined) return <span className="size-5 shrink-0" />;
  return (
    <Image
      src={crestUrl(club)}
      alt={club.shortName}
      width={CREST_PX}
      height={CREST_PX}
      className="size-5 shrink-0 object-contain"
    />
  );
}

const CREST_PX = 20;

/** What the frozen column costs the scrolling ones.
 *
 *  9rem at 390 leaves about 200px of the scroller for figures — four columns in
 *  view at a time against eleven, which is a board you page through rather than
 *  one you read across. Wider and the first screen is a crest and a name; the
 *  measured names fit, and `truncate` covers the two that do not. */
const NAME_WIDTH = "w-36 lg:w-48";

