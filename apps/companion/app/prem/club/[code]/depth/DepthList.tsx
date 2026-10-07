import type { DepthSpot, FootballPlayer } from "@epl/core";
import { DASH } from "@epl/core";
import StateBox from "../../../../components/football/StateBox";
import { doubtRow } from "../../../../components/football/doubtRow";
import { BOARD, ROW_NAME, ROW_RULE } from "@/app/desk";
import NameLink from "../NameLink";

// The same chart as a list, for a phone (Craig, 25 Sep 2026): a row per place, its shirt in the
// index block and the men in line across it, each washed by his doubt and boxed by why.

export default function DepthList({
  lines,
  playerOf,
  hrefOf,
}: {
  lines: readonly (readonly DepthSpot[])[];
  playerOf: (code: number) => FootballPlayer | null;
  hrefOf: (code: number) => string | null;
}) {
  const spots = lines.flat();
  const depth = Math.max(1, ...spots.map((spot) => spot.holders.length));
  return (
    <section>
      <table className={`${BOARD} table-fixed`}>
        <caption className="sr-only">Who is in line for each place, first choice first</caption>
        <colgroup>
          <col className="w-11 lg:w-14" />
        </colgroup>
        <tbody>
          {spots.map((spot, at) => (
            <tr key={`${spot.slot}-${at}`} className={ROW_RULE}>
              <th scope="row" className="cm-index text-2xs" title={spot.label}>
                {spot.slot}
              </th>
              {Array.from({ length: depth }, (_, rank) => {
                const holder = spot.holders[rank];
                const player = holder === undefined ? null : playerOf(holder.code);
                return (
                  <td key={rank} className={`px-1.5 ${player === null ? "" : doubtRow(player)}`}>
                    {player === null ? (
                      <span className="text-faint">{holder === undefined ? "" : DASH}</span>
                    ) : (
                      <NameLink
                        href={hrefOf(player.code)}
                        className={`cm-row flex min-h-11 items-center gap-1 ${ROW_NAME} ${
                          rank === 0 ? "text-ink" : "font-normal text-muted"
                        }`}
                      >
                        <span className="truncate">{player.name}</span>
                        <StateBox player={player} />
                      </NameLink>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
