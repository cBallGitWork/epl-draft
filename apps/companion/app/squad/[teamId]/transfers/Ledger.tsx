import type { Deal } from "@epl/core";

// One manager's business, drawn as Championship Manager's Transfers screen.
//
// `cm9900/23.jpg` is the reference and its column grammar is the whole design:
// a blue index cell carrying the DATE down the left, the player in white, the
// club he came from in yellow, and where he went in orange behind the word
// "to". Ours drops the fee column — a draft league has no money — and spends the
// space on the period, which is the thing a fantasy manager actually needs to
// know a move by.
//
// **Orange for the destination is the reference's own distinction**, and it is
// one the library had to correct in prose once already: yellow is a FIGURE,
// orange is an EVENT or a CHANGE (`docs/ui/reference/README.md`, the three
// corrections). A transfer is a change, and `to Lazio` is drawn in the colour
// that says so. In our palette that is `--color-mid`, whose slot is a figure —
// so the arrow and the destination take `--color-info`, which is "a person",
// because in a draft league what moves is only ever a person and never a fee.

/** Which way a deal ran for the manager whose screen this is.
 *
 *  The same row means opposite things to the two sides of a trade, and a ledger
 *  that says "in" on both is a ledger nobody can read. Every row here is scoped
 *  to one team on purpose. */
function movement(deal: Deal, teamId: string) {
  return {
    in: deal.inbound.filter((side) => side.teamId === teamId),
    out: deal.outbound.filter((side) => side.teamId === teamId),
  };
}

const KIND: Record<Deal["kind"], string> = {
  claim: "Claim",
  trade: "Trade",
  lineup: "Lineup",
  unknown: "Move",
};

export default function Ledger({
  deals,
  teamId,
}: {
  deals: readonly Deal[];
  teamId: string;
}) {
  return (
    <section className="cm-panel flex flex-col p-2">
      <div className="overflow-x-auto">
        <ul className="cm-rows flex min-w-max flex-col">
          {deals.map((deal) => {
            const { in: arrived, out: left } = movement(deal, teamId);
            return (
              <li
                key={deal.setId || `${deal.processedAt}-${deal.period}`}
                className="cm-row flex min-h-11 items-center gap-2 px-1 py-1"
              >
                {/* CM's leading index cell, carrying the date rather than a row
                    number — `23.jpg` runs "Mon 23rd Aug" down the left in the
                    blue block. Fantrax's string verbatim: it has no offset in
                    it, so it is printed as they wrote it and the zone is named
                    once in the header rather than guessed at per row. */}
                <span className="cm-index numeric shrink-0 px-1.5 py-0.5 text-3xs font-bold">
                  {deal.processedAt ?? "—"}
                </span>

                <span className="numeric w-10 shrink-0 text-2xs text-faint">
                  {deal.period === null ? "—" : `P${deal.period}`}
                </span>

                <span className="w-12 shrink-0 text-3xs font-bold uppercase text-muted">
                  {KIND[deal.kind]}
                </span>

                {/* Who arrived and who left. Both halves are printed even when
                    one is empty — a claim that cost nobody, a straight drop —
                    because the shape of the row is what makes a ledger scannable
                    and a row that reflows when a side is missing is not one.
                    Absence is an em dash and never a nought (DESIGN §7). */}
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-info">
                    {arrived.length > 0
                      ? arrived.map((side) => side.playerName).join(", ")
                      : "—"}
                  </span>
                  <span className="shrink-0 text-2xs text-faint" aria-hidden>
                    ←
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {left.length > 0 ? left.map((side) => side.playerName).join(", ") : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
