import Link from "next/link";
import { loggedPlayers, matchLine, sheetSides } from "@epl/core";
import type { Club, IntelMatchPlayer, SheetRow } from "@epl/core";
import Section from "../../../components/shell/Section";
import { PLAYER } from "../../PremNav";
import { BOARD, HEAD_CELL, HEAD_PLATE, HEAD_PLATE_END, ROW_RULE, SCROLL } from "@/app/desk";
import type { Match } from "./match";

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
 *  three letters over a column of figures is not self-explanatory. */
const COLUMNS = [
  { head: "Min", title: "Minutes played", of: (r: Row) => r.minutes },
  { head: "G", title: "Goals", of: (r: Row) => r.line.goals },
  { head: "A", title: "Assists", of: (r: Row) => r.line.assists },
  { head: "Sv", title: "Saves", of: (r: Row) => r.line.saves },
  { head: "B", title: "FPL bonus", of: (r: Row) => r.line.bonus },
] as const;

interface Row {
  player: SheetRow["player"];
  line: SheetRow["line"];
  club: Club | undefined;
  logged: IntelMatchPlayer | undefined;
  minutes: number | null;
}

export default function PlayerStats({ match }: { match: Match }) {
  // Nothing to count before a ball is kicked. The preview above already says
  // what there is to say, and an empty table under it would be furniture.
  if (match.sheet === null || match.sheet.lines.length === 0) return null;

  const { home, away } = sheetSides(match.sheet, match.snapshot);
  const logged = loggedPlayers(match.logged);
  const rows = [
    ...ordered(home, match.home, logged, match),
    ...ordered(away, match.away, logged, match),
  ];

  return (
    <Section title="Player stats" aside="FPL's own · SofaScore's rating">
      <div className={SCROLL}>
        <table className={BOARD}>
          <thead>
            <tr>
              <th className={HEAD_CELL}>
                <div className={HEAD_PLATE}>Player</div>
              </th>
              <th className={HEAD_CELL}>
                <div className={HEAD_PLATE}>Pos</div>
              </th>
              {COLUMNS.map((column) => (
                <th key={column.head} className={HEAD_CELL} title={column.title}>
                  <div className={HEAD_PLATE_END}>{column.head}</div>
                </th>
              ))}
              <th className={HEAD_CELL} title="SofaScore's rating out of ten">
                <div className={HEAD_PLATE_END}>Rtg</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.player.id} className={ROW_RULE}>
                <td className="p-0">
                  <Link
                    href={`${PLAYER}/${row.player.code}`}
                    className="flex min-h-11 items-center gap-1.5 px-1.5 hover:underline lg:min-h-9"
                  >
                    <span className="numeric shrink-0 text-3xs text-faint">
                      {row.club?.shortName ?? "—"}
                    </span>
                    <span className="min-w-0 truncate text-sm">{row.player.name}</span>
                  </Link>
                </td>
                {/* His position in THIS match, from the log — not a fantasy
                    classification, and absent for the 360 matches nobody has
                    logged and for every man who did not start. */}
                <td className="numeric px-1.5 text-2xs text-faint">
                  {row.logged?.position ?? DASH}
                </td>
                {COLUMNS.map((column) => {
                  const value = column.of(row);
                  return (
                    <td key={column.head} className="numeric px-1.5 text-right text-2xs">
                      {value === null || value === 0 ? (
                        <span className="text-faint">{DASH}</span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
                {/* Cyan, because it is the one figure on this table nobody
                    recorded — SofaScore computed it. `--color-info` means a
                    derived reading, and `cm9900/16.jpg` runs its ratings in the
                    same ink. */}
                <td className="numeric px-1.5 text-right text-2xs font-bold text-info">
                  {row.logged?.rating ?? <span className="font-normal text-faint">{DASH}</span>}
                </td>
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
    }))
    .sort(
      (a, b) =>
        matchLine(a.logged?.position ?? null) - matchLine(b.logged?.position ?? null) ||
        b.line.bps - a.line.bps,
    );
}

/** Absence, never a nought — and here a nought is an absence too: a column of
 *  noughts against thirty names buries the two figures that are not one. */
const DASH = "—";
