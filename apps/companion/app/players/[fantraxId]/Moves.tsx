import { DASH, fantraxTime } from "@epl/core";
import Section from "../../components/shell/Section";
import { IndexCell } from "../../components/league/TableCells";
import { MUTE, PlateHead } from "../../components/league/TableHeads";
import { BOARD, HEAD_CELL, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";
import type { PlayerMove } from "./dossier";

// Every claim, drop and trade this league has made with him, newest first, on the house table:
// the date in CM's index block, then the move and the two sides of it.

/** Fantrax's own words for what happened, in ours. */
const KIND: Readonly<Record<string, string>> = { claim: "Claimed", drop: "Dropped", trade: "Traded" };

export default function Moves({ moves }: { moves: readonly PlayerMove[] }) {
  return (
    <Section title="Business" aside="This league">
      {moves.length === 0 ? (
        <p className="text-sm text-muted">No claim, drop or trade involving him.</p>
      ) : (
        <div className={SCROLL}>
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
                  <IndexCell className="whitespace-nowrap">
                    {fantraxTime(transaction.processedAt ?? "")?.replace(/ \S+$/, "") ?? DASH}
                  </IndexCell>
                  <td className={`cm-row px-1.5 ${ROW_NAME}`}>
                    {KIND[transaction.kind] ?? transaction.kind}
                    {transaction.executed ? null : <span className="pl-2 text-2xs uppercase text-faint">Pending</span>}
                  </td>
                  <td className="px-1.5 text-sm text-muted">{side(transaction.fromTeamId, fromName)}</td>
                  <td className="px-1.5 text-sm text-ink">{side(transaction.toTeamId, toName)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/** One side of a move: the pool where there is no team, a dash for a team we cannot name. */
function side(teamId: string | null, name: string | null): string {
  return teamId === null ? "The pool" : (name ?? DASH);
}
