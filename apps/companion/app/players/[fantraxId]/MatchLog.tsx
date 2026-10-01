import Link from "next/link";
import { DASH } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import ScrollBoard from "../../components/league/ScrollBoard";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE, PlateHead } from "../../components/league/TableHeads";
import { standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import Section from "../../components/shell/Section";
import { BOARD, FIGURE, HEAD_CELL, PINNED_NAME, PINNED_TILE, ROW_RULE } from "@/app/desk";
import { matchHref } from "../../prem/match/[id]/matchRoutes";
import { RATING_TITLE } from "../../ratings";
import type { MatchRow } from "./matchRows";

// Every match of his season on the house board (Craig, 25 Sep 2026: "this table is not like our
// normal CM standards, use the shared code"): bevelled plates over the figures, the round in CM's
// blue index block, the opponent pinned beside it, and each column's standouts lit as a board lights
// them. Left of the rule is FPL's account of the match; right of it Fantrax's, including `FPts`, and
// FPL's own points are left off so neither side's points sit beside the other's. Our mark closes the
// row behind its own rule, in the derived reading's cyan.

interface Column {
  head: string;
  title: string;
  of: (row: MatchRow) => number | null;
  /** Decimal places, for the expected figures. */
  digits?: number;
  /** A yes-or-no column, printed `Y` or a dash. */
  flag?: boolean;
  /** The first of Fantrax's columns, which carries the rule. */
  rule?: boolean;
  /** Ours rather than recorded: cyan, and never lit as a standout. */
  derived?: boolean;
}

const COLUMNS: readonly Column[] = [
  { head: "Min", title: "Minutes played", of: (r) => r.fpl.match.minutes },
  { head: "G", title: "Goals", of: (r) => r.fpl.match.goals },
  { head: "A", title: "Assists", of: (r) => r.fpl.match.assists },
  { head: "CS", title: "Clean sheet", of: (r) => (r.fpl.match.cleanSheet ? 1 : 0), flag: true },
  { head: "Sv", title: "Saves", of: (r) => r.fpl.match.saves },
  { head: "xG", title: "Expected goals", of: (r) => r.fpl.match.expectedGoals, digits: 2 },
  { head: "xA", title: "Expected assists", of: (r) => r.fpl.match.expectedAssists, digits: 2 },
  { head: "Def", title: "Defensive contribution", of: (r) => r.fpl.match.defensiveContribution },
  { head: "BPS", title: "FPL's bonus-points score", of: (r) => r.fpl.match.bps },
  { head: "B", title: "Bonus points", of: (r) => r.fpl.match.bonus },
  { head: "FPts", title: "This league's points for the match — Fantrax's own", of: (r) => r.paid?.points ?? null, rule: true },
  { head: "S", title: "Shots — Fantrax's own", of: (r) => r.paid?.shots ?? null },
  { head: "SOT", title: "Shots on target — Fantrax's own", of: (r) => r.paid?.shotsOnTarget ?? null },
  { head: "FC", title: "Fouls committed — Fantrax's own", of: (r) => r.paid?.foulsCommitted ?? null },
  { head: "FS", title: "Fouls suffered — Fantrax's own", of: (r) => r.paid?.foulsSuffered ?? null },
  { head: "Off", title: "Offsides — Fantrax's own", of: (r) => r.paid?.offsides ?? null },
  { head: "Rtg", title: RATING_TITLE, of: (r) => r.mark, digits: 1, rule: true, derived: true },
];

/** A column's standouts over his matches: its best in orange, its top quarter in yellow. */
const SHARES = { good: 0.25, best: 0.1 };

const RULE = "border-l border-line";

export default function MatchLog({ rows }: { rows: readonly MatchRow[] }) {
  if (rows.length === 0) {
    return (
      <Section title="Every match">
        <p className="text-sm text-muted">No match he has played yet this season.</p>
      </Section>
    );
  }

  const cuts = new Map<string, StandoutCut>(
    COLUMNS.map((column) => [column.head, standoutCuts(rows.map(column.of), SHARES, { of: rows.length })]),
  );
  const covered = rows.filter((row) => row.paid !== null).length;

  return (
    <Section title="Every match">
      <ScrollBoard className="bg-surface">
        <table className={BOARD}>
          <thead>
            <tr className="text-2xs">
              <th scope="col" className={`${HEAD_CELL} ${PINNED_TILE} min-w-8 bg-surface lg:min-w-9`}>
                <span className={MUTE}>Gameweek</span>
              </th>
              <th scope="col" className={`${HEAD_CELL} ${PINNED_NAME} left-8 lg:left-9`}>
                <span className={MUTE}>Opponent</span>
              </th>
              <PlateHead at="centre" title="The score, from his club's point of view — tap it for the match" className="whitespace-nowrap">
                Res
              </PlateHead>
              {COLUMNS.map((column) => (
                <PlateHead key={column.head} at="centre" title={column.title} className={`whitespace-nowrap ${column.rule ? RULE : ""}`}>
                  {column.head}
                </PlateHead>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.fpl.match.gameweek}-${row.fpl.match.fixtureId}`} className={`${ROW_RULE} hover:bg-raised`}>
                <IndexCell className={PINNED_TILE}>{row.fpl.match.gameweek ?? DASH}</IndexCell>
                <td className={`${PINNED_NAME} left-8 px-1.5 lg:left-9`}>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {row.fpl.opponent ? <ClubLabel club={row.fpl.opponent} /> : DASH}
                    <span className="text-2xs text-faint">{row.fpl.match.home ? "H" : "A"}</span>
                  </span>
                </td>
                <Score row={row.fpl} />
                {COLUMNS.map((column) => (
                  <Figure key={column.head} column={column} value={column.of(row)} cut={cuts.get(column.head)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
      {covered < rows.length ? (
        <p className="pt-1 text-2xs text-faint">
          Fantrax&apos;s columns cover his last {covered} of {rows.length} matches.
        </p>
      ) : null}
    </Section>
  );
}

/** One figure, centred, lit when it stands out; a dash where nobody measured it. */
function Figure({ column, value, cut }: { column: Column; value: number | null; cut: StandoutCut | undefined }) {
  const shown =
    value === null ? DASH : column.flag ? (value > 0 ? "Y" : DASH) : column.digits ? value.toFixed(column.digits) : value;
  const ink = value === null ? "text-faint" : column.derived ? "text-info" : standoutInk(value, cut, "high") || (value === 0 ? "text-muted" : "");
  return <td className={`${FIGURE} ${column.rule ? RULE : ""} ${ink}`}>{shown}</td>;
}

/** The score his way round, green for a win and red for a loss, and a way into the match. */
function Score({ row }: { row: MatchRow["fpl"] }) {
  const { match } = row;
  const result = match.scored > match.conceded ? "won" : match.scored < match.conceded ? "lost" : "drew";
  const ink = result === "lost" ? "text-bad" : result === "won" ? "text-up" : "text-muted";
  return (
    <td className={`${FIGURE} whitespace-nowrap ${ink}`}>
      {/* A tappable score is a control, so it takes the control floor: 44 under a thumb, 36 on a desk. */}
      <Link href={matchHref(match.fixtureId, "overview")} className="flex min-h-11 items-center justify-center hover:underline lg:min-h-9">
        <span className="sr-only">{`${result} `}</span>
        {match.scored}–{match.conceded}
      </Link>
    </td>
  );
}
