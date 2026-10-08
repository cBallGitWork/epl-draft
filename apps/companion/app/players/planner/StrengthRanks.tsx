import { ordinal, type Club, type StrengthRank } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import { HeadRow, MUTE, PlateHead } from "../../components/league/TableHeads";
import { BOARD, HEAD_CELL, ROW_HEAD_CELL, ROW_RULE } from "@/app/desk";

// The planner's rankings: every club's own attack or defence at home and away, the weakest first, so 1 is the
// easiest to face and green means easy, as on the Attack and Defence boards (Craig, 30 Sep 2026).

export default function StrengthRanks({
  table,
  clubs,
}: {
  table: readonly StrengthRank[];
  /** The clubs, by FPL code, for the crest and the name. */
  clubs: ReadonlyMap<number, Club>;
}) {
  return (
    <table className={`${BOARD} table-fixed bg-surface`}>
      <colgroup>
        <col className="w-8" />
        <col />
        <col className="w-16" />
        <col className="w-16" />
      </colgroup>
      <thead>
        <HeadRow>
          <th scope="col" className={HEAD_CELL}>
            <span className={MUTE}>Rank</span>
          </th>
          <th scope="col" className={HEAD_CELL}>
            <span className={MUTE}>Club</span>
          </th>
          <PlateHead at="centre">Home</PlateHead>
          <PlateHead at="centre">Away</PlateHead>
        </HeadRow>
      </thead>
      <tbody>
        {table.map((row, at) => {
          const club = clubs.get(row.code);
          return (
            <tr key={row.code} className={ROW_RULE}>
              <td className="cm-index numeric text-center text-2xs">{ordinal(at + 1)}</td>
              <th scope="row" className={ROW_HEAD_CELL}>
                <span className="cm-row flex min-h-9 items-center gap-1.5 px-1.5 lg:min-h-7">
                  {club ? <ClubLabel club={club} /> : row.club}
                </span>
              </th>
              <Rank rank={row.home} />
              <Rank rank={row.away} />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Rank({ rank }: { rank: number }) {
  const { ground, ink } = easeGround(rank);
  return (
    <td className={`numeric border-l border-bg text-center text-xs font-bold ${ink}`} style={{ background: ground }}>
      {ordinal(rank)}
    </td>
  );
}
