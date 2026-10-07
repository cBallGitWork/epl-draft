import { listed } from "../format";
import type { ProposedMove, TradeProposal } from "../league/proposals";
import type { InboxItem } from "./types";
import { fantraxInstant } from "./when";

// A trade on the table, as a letter to the managers in it and nobody else: Fantrax keeps a proposal between its
// parties. Worded to be true whichever of them made it, since the log does not say.

/** `Arsenal's Bukayo Saka`, for a letter. */
function spoken(move: ProposedMove): string {
  return move.clubName ? `${move.clubName}'s ${move.playerName}` : move.playerName;
}

export function offerNews(
  proposals: readonly TradeProposal[],
  {
    name,
    mine,
    zone,
  }: {
    name: (teamId: string) => string | null;
    /** The reader's team; signed out, he is party to nothing. */
    mine: string | null;
    /** The zone the log's stamps are in, which follows the session that read it; null leaves a letter undated. */
    zone: string | null;
  },
): InboxItem[] {
  if (mine === null) return [];
  return proposals
    .filter((proposal) => proposal.teamIds.includes(mine))
    .map((proposal) => {
      const other = proposal.teamIds.find((teamId) => teamId !== mine) ?? null;
      const them = (other === null ? null : name(other)) ?? "another manager";
      const get = proposal.moves.filter((move) => move.toTeamId === mine).map(spoken);
      const give = proposal.moves.filter((move) => move.fromTeamId === mine).map((move) => move.playerName);
      const terms = [
        get.length > 0 ? `get ${listed(get)}` : null,
        give.length > 0 ? `give up ${listed(give)}` : null,
      ].filter((term) => term !== null);
      return {
        id: `offer:${proposal.setId}`,
        category: "message" as const,
        at: proposal.proposedAt === null || zone === null ? null : fantraxInstant(proposal.proposedAt, zone),
        gameweek: null,
        headline: `A deal with ${them} is on the table`,
        body: `${terms.length > 0 ? `You'd ${terms.join(" and ")}. ` : ""}It's waiting for an answer on Fantrax.`,
        from: "Your assistant",
        about: null,
        teamId: other,
        mark: null,
        // An offer is not bad news; the banner is what makes it loud.
        urgent: false,
      };
    });
}
