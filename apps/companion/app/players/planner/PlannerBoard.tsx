import Link from "next/link";
import { DASH, toFantraxClubCode, type PlannerCell, type PlannerRow, type PlannerView } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import { MUTE } from "../../components/league/TableHeads";
import { HEAD_CELL, HEAD_PLATE_CENTRE, ROW_RULE, SCROLL, STICKY_LEAD } from "@/app/desk";
import { POOL } from "../routes";

// Every club's next six opponents, a cell each on the ease ramp, easiest run first. One line to a fixture
// (Craig, 24 Sep 2026): a phone sets a home side in capitals and an away side in lower case, as FPL's tickers do.

/** Where a club's name leads: its men on the Players board, the positions this view is about. */
const POSITIONS: Record<PlannerView, string> = { attack: "F,M", defence: "D,G" };

/** What a rank is of, for a cell's title. */
const THEIR: Record<PlannerView, string> = { attack: "defence", defence: "attack" };

export default function PlannerBoard({
  view,
  rows,
  gameweeks,
}: {
  view: PlannerView;
  rows: readonly PlannerRow[];
  gameweeks: readonly number[];
}) {
  return (
    <div className={`cm-scroll bg-surface ${SCROLL}`}>
      <table className="w-full min-w-[21.5rem] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-20" />
          {gameweeks.map((gameweek) => (
            <col key={gameweek} />
          ))}
          <col className="w-10 lg:w-12" />
        </colgroup>
        <thead>
          <tr className="text-2xs">
            <th scope="col" className={`${HEAD_CELL} ${STICKY_LEAD}`}>
              <span className={MUTE}>Club</span>
            </th>
            {gameweeks.map((gameweek) => (
              <th key={gameweek} scope="col" className={HEAD_CELL}>
                <span className={`${HEAD_PLATE_CENTRE}`}>GW{gameweek}</span>
              </th>
            ))}
            {/* The column the board is ordered by, drawn pressed, as a sorted head is. */}
            <th scope="col" aria-sort="ascending" className={HEAD_CELL}>
              <span className="cm-bevel-pressed flex h-6 items-center justify-center gap-0.5" title="The mean rank of the six, 1 the easiest">
                Avg<span aria-hidden className="text-[0.5rem]">▲</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.club.code} className={ROW_RULE}>
              <th scope="row" className={`p-0 text-left font-normal ${STICKY_LEAD}`}>
                <Link
                  href={`${POOL}?club=${toFantraxClubCode(row.club.shortName)}&pos=${POSITIONS[view]}`}
                  title={`${row.club.name}: its ${view === "attack" ? "forwards and midfielders" : "defenders and keepers"} on the board`}
                  className="cm-row flex min-h-11 items-center gap-1.5 px-1.5"
                >
                  <ClubLabel club={{ ...row.club, name: row.club.shortName }} />
                </Link>
              </th>
              {row.cells.map((round, at) => (
                <td key={gameweeks[at]} className="border-l border-bg p-0 align-middle">
                  {round.length === 0 ? <Fixture view={view} cell={null} /> : round.map((cell, n) => <Fixture key={n} view={view} cell={cell} />)}
                </td>
              ))}
              <td className="numeric px-1 text-center text-sm font-bold text-info">{row.mean.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One fixture: the opponent and its rank on one line, grounded on the ramp. A blank round is a quiet hole. */
function Fixture({ view, cell }: { view: PlannerView; cell: PlannerCell | null }) {
  const { ground, ink } = easeGround(cell?.rank ?? null);
  if (cell === null) {
    return (
      <div className={`flex min-h-11 items-center justify-center text-2xs lg:min-h-7 ${ink}`} style={{ background: ground }} title="No match this gameweek">
        {DASH}
      </div>
    );
  }
  const code = cell.opponent.shortName;
  return (
    <div
      className={`numeric flex min-h-11 items-center justify-center gap-1 whitespace-nowrap px-0.5 text-2xs leading-none lg:min-h-7 lg:justify-between lg:px-1.5 lg:text-xs ${ink}`}
      style={{ background: ground }}
      title={`${cell.opponent.name} ${cell.home ? "at home" : "away"}: their ${THEIR[view]} ranks ${cell.rank ?? DASH} of 20, 1 the weakest (ours: Dixon-Coles strength)`}
    >
      <span className="lg:hidden">{cell.home ? code : code.toLowerCase()}</span>
      <span className="hidden lg:inline">
        {code} ({cell.home ? "H" : "A"})
      </span>
      <span className="font-bold">{cell.rank ?? DASH}</span>
    </div>
  );
}
