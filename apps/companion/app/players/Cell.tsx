import Link from "next/link";
import { listName, signed, toFplClubCode, DASH } from "@epl/core";
import type { FootballPlayer } from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { figureOf } from "./figure";
import { standoutInk, type StandoutCut } from "../components/league/standout";
import { STATUS } from "./status";
import { ANALYSIS, playerHref } from "./routes";
import type { PlayersQuery } from "./query";
import { ROW_LINK } from "../components/league/TableCells";
import { FIGURE, LEAD_WIDTH, LeadFace } from "./BoardRow";
import StateBox from "../components/football/StateBox";

// One row of the pool board: the lead (crest, name, and who holds him) and the figures beside it.
// Figures are centred and lit in ink (DESIGN §3), never on a ground; a nought is quiet, an absence a dash.

/** The pinned lead: his club's crest, his name, and under it his position and who holds him.
 *  The phone sets the name as a list does ("Gross, P") and leads line two with the position; the desk
 *  reads him in full, and its tile carries the position. */
export function Lead({
  row,
  query,
  teamNames,
  reader,
  footballer,
  className,
}: {
  row: PoolRow;
  query: PlayersQuery;
  teamNames: Map<string, string>;
  reader: string | null;
  /** The footballer behind him, for his status tile; null where the bridge has not settled him. */
  footballer: FootballPlayer | null;
  className: string;
}) {
  const { player } = row.entry;
  // With a first man chosen (`?compare=`) the board is the picker, and a row completes the pair.
  const href =
    query.compare && query.compare !== player.fantraxId
      ? `${ANALYSIS}?a=${query.compare}&b=${player.fantraxId}`
      : playerHref(player.fantraxId);

  return (
    <td className={className}>
      <Link href={href} className={`${ROW_LINK} ${LEAD_WIDTH}`}>
        {/* The holder in brackets straight after the name (Craig, 24 Sep 2026), so the lead needs no room of its own. */}
        <LeadFace
          club={toFplClubCode(player.clubCode ?? "")}
          name={listName(player.rawName) || player.displayName}
          fullName={player.displayName}
          positions={row.entry.eligiblePositions}
          after={
            <>
              <Holder row={row} teamNames={teamNames} reader={reader} />
              <StateBox player={footballer} />
            </>
          }
        />
      </Link>
    </td>
  );
}

/** Who holds him, in brackets: "Yours" in the accent, a rival quiet, and Fantrax's own code for a man anybody can
 *  claim (FA, WW), loud. */
function Holder({ row, teamNames, reader }: { row: PoolRow; teamNames: Map<string, string>; reader: string | null }) {
  const owner = row.entry.ownerTeamId;
  const [text, ink] =
    owner !== null && owner === reader
      ? ["Yours", "font-bold text-accent"]
      : owner !== null
        ? [teamNames.get(owner) ?? owner, "text-muted"]
        : row.entry.status
          ? [row.entry.status, "font-bold text-ink"]
          : [null, ""];
  if (text === null) return null;
  return (
    <span className={`min-w-0 truncate text-2xs ${ink}`} title={STATUS[text] ?? text}>
      ({text})
    </span>
  );
}

/** One figure, centred under its head. */
export default function Cell({
  column,
  row,
  stats,
  rated,
  cut,
}: {
  column: PoolColumn;
  row: PoolRow;
  stats: RawStats;
  rated: boolean;
  cut: StandoutCut | undefined;
}) {
  const value = figureOf(column, row, stats, rated);
  if (value === null) return <td className={`${FIGURE} text-faint`}>{DASH}</td>;
  if (column.kind === "signed") {
    return (
      <td className={FIGURE}>
        <Trend value={Number(value)} />
      </td>
    );
  }
  const figure = Number(value);
  // Zero is a stat, and a quiet one.
  if (figure === 0) return <td className={`${FIGURE} text-faint`}>{column.kind === "percent" ? "0%" : "0"}</td>;
  const printed = rated && column.rate === true ? figure.toFixed(2) : String(value);
  return (
    <td className={`${FIGURE} ${column.mark ? standoutInk(figure, cut, column.mark) : ""}`}>
      {column.kind === "percent" ? `${printed}%` : printed}
    </td>
  );
}

/** Which way ownership moved, said in the sign as well as the colour. Nought is drawn quiet. */
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-faint">0%</span>;
  return <span className={value > 0 ? "text-up" : "text-bad"}>{signed(value)}%</span>;
}
