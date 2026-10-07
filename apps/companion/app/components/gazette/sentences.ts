import type { Story } from "@epl/core";
import { plural } from "@epl/core";

// The paper's words for one story: core returns the fact, this writes the sentence, the same at both sizes.
// Every sentence must be true of every story of its kind, so it claims nothing the fact does not carry.

export function written(lead: Story, who: (teamId: string | null) => string) {
  switch (lead.kind) {
    case "squeaker":
      return {
        kicker: "Down to the wire",
        headline: `${lead.result.winner.name} edged ${lead.result.loser.name}`,
        standfirst: `Decided by ${points(lead.result.margin)}.`,
      };
    case "bench":
      return {
        kicker: "Left out",
        headline: `${lead.pick.ownerName} left ${lead.pick.playerName} out`,
        // The owner is named once, off the pick, so the headline and its line agree.
        standfirst:
          lead.lost === null
            ? "He is in the week's eleven, picked by everybody except his own manager."
            : `He is in the week's eleven. ${lead.pick.ownerName} lost ` +
              `${lead.lost.loser.points}–${lead.lost.winner.points} to ${lead.lost.winner.name}.`,
      };
    case "rout":
      return {
        kicker: "No contest",
        headline: `${lead.result.winner.name} took ${lead.result.loser.name} apart`,
        standfirst: `${points(lead.result.margin)} between them.`,
      };
    case "trade":
      return {
        kicker: "Business",
        headline: `${lead.sides.map(who).join(" and ")} have traded`,
        // Counted off the deal: `sides` is two or more, and `traded` is only the newest trade.
        standfirst: `${players(lead.deal.inbound.length)} changed hands.`,
      };
  }
}

function players(count: number): string {
  return `${count} ${plural(count, "player")}`;
}

function points(margin: number): string {
  return `${margin} ${plural(margin, "point")}`;
}
