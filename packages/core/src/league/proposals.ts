// A trade proposed and not yet answered, as the domain holds it: who is in it, who made it, and every man in it.

/** One man in a proposal and which way he would go. */
export interface ProposedMove {
  fantraxId: string;
  playerName: string;
  club: string | null;
  clubName: string | null;
  fromTeamId: string | null;
  toTeamId: string | null;
}

export interface TradeProposal {
  setId: string;
  /** Who proposed it; null where Fantrax did not say. */
  creatorTeamId: string | null;
  /** Fantrax's stamp, verbatim and in the session's zone, which it names: "Oct 8, 11:53 AM BST". */
  proposedAt: string | null;
  /** Every team in it, in the order its moves first name them. */
  teamIds: string[];
  moves: ProposedMove[];
}
