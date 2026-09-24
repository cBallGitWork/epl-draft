import Link from "next/link";
import Image from "next/image";
import { crestForShortName, listName, signed, toFplClubCode, DASH } from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { figureOf } from "./figure";
import { standoutInk, type StandoutCut } from "../components/league/standout";
import { STATUS } from "./status";
import { ANALYSIS, playerHref } from "./routes";
import type { PlayersQuery } from "./query";
import { positionsLabel } from "../positions";
import { ROW_LINK } from "../components/league/TableCells";
import { LABEL, ROW_FIGURE, ROW_NAME } from "@/app/desk";

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
  className,
}: {
  row: PoolRow;
  query: PlayersQuery;
  teamNames: Map<string, string>;
  reader: string | null;
  className: string;
}) {
  const { player } = row.entry;
  // Fantrax spells two clubs its own way (`NOT` for Forest); the crest is looked up by FPL's.
  const crest = crestForShortName(toFplClubCode(player.clubCode ?? ""));
  // With a first man chosen (`?compare=`) the board is the picker, and a row completes the pair.
  const href =
    query.compare && query.compare !== player.fantraxId
      ? `${ANALYSIS}?a=${query.compare}&b=${player.fantraxId}`
      : playerHref(player.fantraxId);

  return (
    <td className={className}>
      <Link href={href} className={`${ROW_LINK} w-34 px-1.5 lg:w-80`}>
        <span className="grid size-6 shrink-0 place-items-center">
          {crest ? <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
          <span className={`min-w-0 truncate ${ROW_NAME}`}>
            <span className="lg:hidden">{listName(player.rawName) || player.displayName}</span>
            <span className="hidden lg:inline">{player.displayName}</span>
          </span>
          <span className="flex min-w-0 items-baseline gap-1 text-2xs leading-tight lg:ml-auto lg:shrink-0">
            <span className={`${LABEL} w-7 shrink-0 lg:hidden`}>{positionsLabel(row.entry.eligiblePositions) ?? DASH}</span>
            <Holder row={row} teamNames={teamNames} reader={reader} />
          </span>
        </span>
      </Link>
    </td>
  );
}

/** Who holds him: "Yours" in the accent, a rival quiet, and a man anybody can claim loud. */
function Holder({ row, teamNames, reader }: { row: PoolRow; teamNames: Map<string, string>; reader: string | null }) {
  const owner = row.entry.ownerTeamId;
  if (owner !== null && owner === reader) return <span className="font-bold text-accent">Yours</span>;
  if (owner !== null) return <span className="truncate text-muted">{teamNames.get(owner) ?? owner}</span>;
  if (!row.entry.status) return null;
  return <span className="truncate font-bold text-ink">{STATUS[row.entry.status] ?? row.entry.status}</span>;
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

/** Centred under its head the way CM sets a column, a little tighter under a thumb. */
const FIGURE = `numeric px-1 text-center lg:px-1.5 ${ROW_FIGURE}`;

/** Which way ownership moved, said in the sign as well as the colour. Nought is drawn quiet. */
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-faint">0%</span>;
  return <span className={value > 0 ? "text-up" : "text-bad"}>{signed(value)}%</span>;
}
