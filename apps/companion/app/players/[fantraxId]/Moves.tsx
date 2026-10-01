import ScrollBoard from "../../components/league/ScrollBoard";
import { DASH, fantraxTime } from "@epl/core";
import Section from "../../components/shell/Section";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE, PlateHead } from "../../components/league/TableHeads";
import { BOARD, HEAD_CELL, ROW_RULE } from "@/app/desk";
import type { PlayerMove } from "./dossier";

// Every claim, drop and trade this league has made with him, newest first, on the house table:
// the date in CM's index block, then the move and the two sides of it.

/** Fantrax's own words for what happened, in ours. */
const KIND: Readonly<Record<string, string>> = { claim: "Claimed", drop: "Dropped", trade: "Traded" };

export default function Moves({ moves }: { moves: readonly PlayerMove[] }) {
  return (
    <Section title="Business">
      {moves.length === 0 ? (
        <p className="text-base text-muted lg:text-lg">No claim, drop or trade involving him.</p>
      ) : (
        <ScrollBoard>
          <table className={BOARD}>
            <thead>
              <tr className="text-2xs">
                <th scope="col" className={HEAD_CELL}>
                  <span className={MUTE}>Date</span>
                </th>
                {["Move", "From", "To"].map((head) => (
                  <PlateHead key={head}>{head}</PlateHead>
                ))}
              </tr>
            </thead>
            <tbody>
              {moves.map(({ transaction, fromName, toName }) => (
                <tr
                  key={`${transaction.setId}-${transaction.kind}-${transaction.processedAt ?? ""}`}
                  className={`${ROW_RULE} ${transaction.executed ? "" : "text-faint"}`}
                >
                  <IndexCell className="whitespace-nowrap text-base lg:text-lg">
                    {fantraxTime(transaction.processedAt ?? "")?.replace(/ \S+$/, "") ?? DASH}
                  </IndexCell>
                  <td className="cm-row px-1.5 font-chrome text-base font-bold lg:text-lg">
                    {KIND[transaction.kind] ?? transaction.kind}
                    {transaction.executed ? null : <span className="pl-2 text-2xs uppercase text-faint">Pending</span>}
                  </td>
                  <td className="px-1.5 text-base text-muted lg:text-lg">{side(transaction.fromTeamId, fromName)}</td>
                  <td className="px-1.5 text-base text-ink lg:text-lg">{side(transaction.toTeamId, toName)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollBoard>
      )}
    </Section>
  );
}

/** One side of a move: the pool where there is no team, a dash for a team we cannot name. */
function side(teamId: string | null, name: string | null): string {
  return teamId === null ? "The pool" : (name ?? DASH);
}
