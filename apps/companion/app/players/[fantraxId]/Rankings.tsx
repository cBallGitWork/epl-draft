import ScrollBoard from "../../components/league/ScrollBoard";
import type { Ranked } from "@epl/core";
import { DASH, fixed, ordinal } from "@epl/core";
import Section from "../../components/shell/Section";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE, PlateHead } from "../../components/league/TableHeads";
import { BOARD, FIGURE_CELL, ROW_RULE } from "@/app/desk";

// Where his season totals rank among the men he is rated against (Craig, 25 Sep 2026:
// "rankings for data such as xg"): the totals on one row, his place on the next.

export default function Rankings({ ranked, group }: { ranked: readonly Ranked[]; group: string | null }) {
  const field = ranked[0]?.of ?? 0;
  if (field === 0) return null;

  return (
    <Section title="Rankings" aside={`Among ${field} ${group ?? "players"}`}>
      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <tr>
              <PlateHead>
                <span className={MUTE}>Row</span>
              </PlateHead>
              {ranked.map((r) => (
                <PlateHead key={r.head} at="centre" title={r.title}>
                  {r.head}
                </PlateHead>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              <IndexCell>Total</IndexCell>
              {ranked.map((r) => (
                <td key={r.head} className={`${FIGURE_CELL} font-bold`}>
                  {r.value === null ? DASH : fixed(r.value, r.kind)}
                </td>
              ))}
            </tr>
            <tr className={ROW_RULE}>
              <IndexCell>Rank</IndexCell>
              {ranked.map((r) => (
                <td
                  key={r.head}
                  className={`${FIGURE_CELL} font-bold ${ink(r.rank, r.of)}`}
                  title={r.rank === null ? undefined : `${ordinal(r.rank)} of ${r.of}`}
                >
                  {r.rank === null ? DASH : ordinal(r.rank)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollBoard>
    </Section>
  );
}

/** Top of the group in CM's orange, its top tenth in amber, the rest in ink. */
function ink(rank: number | null, of: number): string {
  if (rank === null) return "text-faint";
  if (rank === 1) return "text-peak";
  return rank <= Math.max(3, Math.ceil(of / 10)) ? "text-mid" : "";
}
