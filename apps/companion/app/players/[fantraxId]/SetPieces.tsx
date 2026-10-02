import { DASH, ordinal } from "@epl/core";
import type { SetPieceRank } from "@epl/core";
import ScrollBoard from "../../components/league/ScrollBoard";
import Section from "../../components/shell/Section";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE, PlateHead } from "../../components/league/TableHeads";
import { BOARD, FIGURE_CELL, ROW_RULE } from "@/app/desk";

// Where he stands in his club's penalty, free-kick and corner orders: first choice in CM's orange.

export default function SetPieces({ pieces, club }: { pieces: readonly SetPieceRank[]; club: string | null }) {
  if (pieces.every((p) => p.of === 0)) return null;

  return (
    <Section title="Set pieces" aside={club === null ? undefined : `At ${club}`}>
      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <tr>
              <PlateHead>
                <span className={MUTE}>Row</span>
              </PlateHead>
              {pieces.map((p) => (
                <PlateHead key={p.piece} at="centre">
                  {p.label}
                </PlateHead>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              <IndexCell>Rank</IndexCell>
              {pieces.map((p) => (
                <td
                  key={p.piece}
                  className={`${FIGURE_CELL} font-bold ${p.rank === null ? "text-faint" : p.rank === 1 ? "text-peak" : ""}`}
                  title={p.rank !== null ? `${ordinal(p.rank)} of ${p.of} takers` : p.of === 0 ? "Nobody ranked yet" : `Not among the ${p.of} takers`}
                >
                  {p.rank === null ? DASH : ordinal(p.rank)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollBoard>
    </Section>
  );
}
