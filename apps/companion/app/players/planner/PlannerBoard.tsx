import ScrollBoard from "../../components/league/ScrollBoard";
import Link from "next/link";
import { DASH, ordinal, toFantraxClubCode, type PlannerCell, type PlannerRow, type PlannerView } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import { MUTE, PlateHead, SortArrow } from "../../components/league/TableHeads";
import { HEAD_CELL, PINNED_NAME, ROW_RULE } from "@/app/desk";

/** The club column, frozen at the left edge. */
const PIN_CLUB = `${PINNED_NAME} left-0`;
import { POOL } from "../routes";

// Every club's next six opponents, a cell each on the ease ramp, easiest run first. Each names the venue, (H) or (A):
// under the code on a phone, beside it on a desk (Craig, 30 Sep 2026).

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
    <ScrollBoard className="bg-surface">
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
            <th scope="col" className={`${HEAD_CELL} ${PIN_CLUB}`}>
              <span className={MUTE}>Club</span>
            </th>
            {gameweeks.map((gameweek) => (
              <PlateHead key={gameweek} at="centre">
                GW{gameweek}
              </PlateHead>
            ))}
            {/* The column the board is ordered by, drawn pressed, as a sorted head is. */}
            <th scope="col" aria-sort="ascending" className={HEAD_CELL}>
              <span className="cm-bevel-pressed flex h-6 items-center justify-center gap-0.5" title={`The mean rank of the ${gameweeks.length}, 1 the easiest`}>
                Avg<SortArrow down={false} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.club.code} className={ROW_RULE}>
              <th scope="row" className={`p-0 text-left font-normal ${PIN_CLUB}`}>
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
    </ScrollBoard>
  );
}

/** One fixture grounded on the ramp: the opponent, its venue and its rank as an ordinal, on one line on a desk and
 *  the venue and rank under the code on a phone, where a 37px cell cannot hold "20th" beside it. A blank round is a
 *  quiet hole. */
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
  const rank = cell.rank === null ? DASH : ordinal(cell.rank);
  return (
    <div
      className={`numeric grid min-h-11 grid-cols-[auto_auto] content-center items-baseline justify-center gap-0.5 whitespace-nowrap text-2xs leading-none lg:flex lg:min-h-7 lg:items-center lg:gap-1 lg:px-1.5 lg:text-xs ${ink}`}
      style={{ background: ground }}
      title={`${cell.opponent.name} ${cell.home ? "at home" : "away"}: their ${THEIR[view]} ranks ${rank}, 1st the easiest`}
    >
      <span className="col-span-2 text-center">{code}</span>
      <span className="text-3xs lg:text-xs">({cell.home ? "H" : "A"})</span>
      <span className="font-bold lg:ml-auto">{rank}</span>
    </div>
  );
}
