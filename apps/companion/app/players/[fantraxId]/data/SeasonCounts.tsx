import { londonDayAndDate, type StatsRow } from "@epl/core";
import { BOARD, FIGURE_CELL, ROW_RULE } from "@/app/desk";
import BoardKey from "../../../components/league/BoardKey";
import ScrollBoard from "../../../components/league/ScrollBoard";
import { HeadRow, MUTE, PlateHead } from "../../../components/league/TableHeads";
import { IndexCell } from "../../../components/league/TableCells";
import Section from "../../../components/shell/Section";
import { seasonLine } from "../../seasonColumns";

// His shots, chances and crosses off the stats league: the pool board's seven, in a table apart from FPL's.

export default function SeasonCounts({
  row,
  at,
}: {
  /** His line in the stats league's file; undefined where it holds none. */
  row: StatsRow | undefined;
  /** When the file was written, for how far the season runs. */
  at: string;
}) {
  const line = seasonLine(row);
  return (
    <Section title="Attacking" aside={`Season to ${londonDayAndDate(at)}`}>
      <ScrollBoard>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <PlateHead>
                <span className={MUTE}>Competition</span>
              </PlateHead>
              {line.map((entry) => (
                <PlateHead key={entry.key} at="centre" title={entry.title}>
                  {entry.label}
                </PlateHead>
              ))}
            </HeadRow>
          </thead>
          <tbody>
            <tr className={ROW_RULE}>
              <IndexCell>League</IndexCell>
              {line.map((entry) => (
                <td key={entry.key} className={`${FIGURE_CELL} font-bold`}>
                  {entry.figure}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollBoard>
      <BoardKey entries={line} />
    </Section>
  );
}
