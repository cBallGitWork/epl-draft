import type { Deal } from "@epl/core";
import Column from "./Column";
import { DEALS_SHOWN } from "../../config";

// The week's business: trades and claims, grouped so both halves of a trade read
// as one deal rather than as two unrelated signings that share a timestamp.

export default function Deals({
  deals,
  at,
  who,
}: {
  deals: Deal[];
  /** Fantrax's own heading for the transaction date column — "Date (EDT)". The
   *  zone belongs in the heading, where a table would put it: the timestamps
   *  below are their strings and carry no offset, so without the label a British
   *  reader takes a New York morning for a British one. Their words, not our
   *  conversion. */
  at: string | null;
  who: (teamId: string | null) => string;
}) {
  return (
    <Column title="The week's business" aside={at ? `${deals.length} · ${at}` : `${deals.length}`}>
      <ul>
        {deals.slice(0, DEALS_SHOWN).map((deal) => (
          <li
            key={deal.setId + deal.inbound.map((p) => p.playerName).join()}
            className="py-2"
          >
            <p className="text-sm">
              {/* A trade is two players moving in opposite directions, and
                  without this label its two halves read as two unrelated
                  signings — the very thing grouping them by `setId` was for. A
                  claim needs no label: its second half already says "out". */}
              {deal.kind === "trade" ? (
                <span className="font-sans text-2xs font-bold uppercase tracking-wide text-faint">
                  Trade{" "}
                </span>
              ) : null}
              {deal.inbound.map((player, index) => (
                <span key={player.playerName} className="font-semibold">
                  {index > 0 ? <span className="font-normal text-muted">· </span> : null}
                  {player.playerName}{" "}
                  <span className="font-normal text-muted">to {who(player.teamId)}</span>{" "}
                </span>
              ))}
              {deal.outbound.length > 0 ? (
                <span className="text-muted">
                  · {deal.outbound.map((player) => player.playerName).join(", ")} out
                </span>
              ) : null}
            </p>
            {deal.processedAt ? (
              <p className="pt-0.5 text-2xs text-faint">{deal.processedAt}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Column>
  );
}
