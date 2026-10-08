import { listed } from "../format";
import type { ProposedMove, TradeProposal } from "../league/proposals";
import type { InboxItem } from "./types";
import { proposedInstant } from "./when";

// A trade on the table, as a letter to the managers in it and nobody else: Fantrax keeps a proposal between its
// parties. The one it waits on reads it as an offer, urgently; the one who made it, as his offer.

/** `Arsenal's Bukayo Saka`, for a letter. */
function spoken(move: ProposedMove): string {
  return move.clubName ? `${move.clubName}'s ${move.playerName}` : move.playerName;
}

export function offerNews(
  proposals: readonly TradeProposal[],
  {
    name,
    mine,
    now,
  }: {
    name: (teamId: string) => string | null;
    /** The reader's team; signed out, he is party to nothing. */
    mine: string | null;
    /** The pending page prints no year; the stamp is the latest such day not after this. */
    now: string;
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
      // Who made it decides whose answer it waits on; with no maker named, the letter stays true for either side.
      const side =
        proposal.creatorTeamId === null
          ? { headline: `A deal with ${them} is on the table`, whose: "an", urgent: false }
          : proposal.creatorTeamId === mine
            ? { headline: `Your offer to ${them}`, whose: "their", urgent: false }
            : { headline: `An offer from ${them}`, whose: "your", urgent: true };
      return {
        id: `offer:${proposal.setId}`,
        category: "message" as const,
        at: proposal.proposedAt === null ? null : proposedInstant(proposal.proposedAt, now),
        gameweek: null,
        headline: side.headline,
        // A comma keeps the lists apart when the first already has its own "and".
        body: `${terms.length > 0 ? `You'd ${terms.join(get.length > 1 ? ", and " : " and ")}. ` : ""}It's waiting for ${side.whose} answer on Fantrax.`,
        from: "Your assistant",
        about: null,
        teamId: other,
        mark: null,
        urgent: side.urgent,
      };
    });
}
