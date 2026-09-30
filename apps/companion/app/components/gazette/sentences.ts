import type { Story } from "@epl/core";
import { plural } from "@epl/core";

// The paper's words for one story.
//
// Core returns the fact and this writes the sentence — the same split the rest
// of the paper keeps. Nothing here decides which story is the biggest; it
// decides how to say the one that is, and it says it identically at both sizes,
// so the lead and a headline can never disagree about what happened.
//
// Every sentence below is true of every story of its kind, which is the whole
// constraint: a standfirst is written once and printed over thirty-eight weeks
// of facts nobody has seen yet, so it may not claim anything the fact does not
// carry. The scoreline is not repeated here — the picture above it IS the
// scoreline, and a standfirst that says it again is a caption, not a line.

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
        // The owner is named once, off the pick, so the headline and the line
        // under it cannot end up calling one manager two things: his name
        // reaches `lost.loser` through `getLeagueInfo` and reaches the pick
        // through the roster, and those are two reads of one team.
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
        // Counted off the deal, and it has to be. This used to read "Two
        // managers did business this week. Nobody else did any." — two claims
        // the fact does not carry: `sides` is only guaranteed to be two OR MORE,
        // so a three-way trade ran that line under a headline naming three; and
        // `traded` takes the newest of however many, so a second trade in the
        // same week made the second sentence false with the first one printed
        // right underneath it in the business column.
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
