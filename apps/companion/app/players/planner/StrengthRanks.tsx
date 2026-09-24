import type { Club, StrengthRank } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import { MUTE } from "../../components/league/TableHeads";
import { HEAD_CELL, HEAD_PLATE, ROW_RULE } from "@/app/desk";

// The ranking behind the planner's colours (Craig, 24 Sep 2026: "a ranking section too"): every club as an
// opponent, at home and away, easiest first, on the same ramp as the cells above it.

export default function StrengthRanks({
  table,
  clubs,
}: {
  table: readonly StrengthRank[];
  /** The clubs, by FPL code, for the crest and the name. */
  clubs: ReadonlyMap<number, Club>;
}) {
  return (
    <table className="w-full table-fixed border-collapse bg-surface text-sm">
      <colgroup>
        <col className="w-8" />
        <col />
        <col className="w-16" />
        <col className="w-16" />
      </colgroup>
      <thead>
        <tr className="text-2xs">
          <th scope="col" className={HEAD_CELL}>
            <span className={MUTE}>Rank</span>
          </th>
          <th scope="col" className={HEAD_CELL}>
            <span className={MUTE}>Club</span>
          </th>
          <th scope="col" className={HEAD_CELL}>
            <span className={`${HEAD_PLATE} justify-center`}>Home</span>
          </th>
          <th scope="col" className={HEAD_CELL}>
            <span className={`${HEAD_PLATE} justify-center`}>Away</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {table.map((row, at) => {
          const club = clubs.get(row.code);
          return (
            <tr key={row.code} className={ROW_RULE}>
              <td className="cm-index numeric text-center text-2xs">{at + 1}</td>
              <th scope="row" className="p-0 text-left font-normal">
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
      {rank}
    </td>
  );
}
