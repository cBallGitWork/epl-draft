import type { Ranked } from "@epl/core";
import { DASH, ordinal } from "@epl/core";
import Section from "../../components/shell/Section";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE } from "../../components/league/TableHeads";
import { BOARD, BOARD_FIGURE, HEAD_CELL, HEAD_PLATE, HEAD_PLATE_END, ROW_RULE, SCROLL } from "@/app/desk";

// Where his season totals rank among the men he is rated against (Craig, 25 Sep 2026:
// "rankings for data such as xg"): the totals on one row, his place on the next.

export default function Rankings({ ranked, group }: { ranked: readonly Ranked[]; group: string | null }) {
  const field = ranked[0]?.of ?? 0;
  if (field === 0) return null;

  return (
    <Section title="Rankings" aside={`Among ${field} ${group ?? "players"}`}>
      <div className={SCROLL}>
        <table className={BOARD}>
          <thead>
            <tr>
              <th scope="col" className={HEAD_CELL}>
                <div className={HEAD_PLATE}>
                  <span className={MUTE}>Row</span>
                </div>
              </th>
              {ranked.map((r) => (
                <th key={r.head} scope="col" className={HEAD_CELL} title={r.title}>
                  <div className={HEAD_PLATE_END}>{r.head}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              <IndexCell>Total</IndexCell>
              {ranked.map((r) => (
                <td key={r.head} className={`${BOARD_FIGURE} font-bold`}>
                  {r.value === null ? DASH : r.value.toFixed(r.digits)}
                </td>
              ))}
            </tr>
            <tr className={ROW_RULE}>
              <IndexCell>Rank</IndexCell>
              {ranked.map((r) => (
                <td
                  key={r.head}
                  className={`${BOARD_FIGURE} font-bold ${ink(r.rank, r.of)}`}
                  title={r.rank === null ? undefined : `${ordinal(r.rank)} of ${r.of}`}
                >
                  {r.rank === null ? DASH : ordinal(r.rank)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** Top of the group in CM's orange, its top tenth in amber, the rest in ink. */
function ink(rank: number | null, of: number): string {
  if (rank === null) return "text-faint";
  if (rank === 1) return "text-peak";
  return rank <= Math.max(3, Math.ceil(of / 10)) ? "text-mid" : "";
}
