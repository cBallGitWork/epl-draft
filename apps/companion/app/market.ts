import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type TradeBlock,
  type TradeProposal,
  fetchPendingTrades,
  fetchPositionRefs,
  fetchTradeBlocks,
  mapPendingTrades,
  mapPositionNames,
  mapTradeBlocks,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The trade market, read as the commissioner (Fantrax shows it to members only) and cached for everybody.
// No session in this environment, or a refusal, is no market news rather than a broken inbox.

/** The commissioner's Fantrax cookie, or null where this environment has none. Two: `saving.ts` reads its own. */
const session = () => process.env.FANTRAX_COOKIE || null;

export const readTradeBlocks = leagueCache("trade-blocks",
  async (): Promise<TradeBlock[]> => {
    const cookie = session();
    if (cookie === null) return [];
    const [blocks, positions] = await Promise.all([
      orRefusal(fetchTradeBlocks(FANTRAX_LEAGUE_ID, cookie)),
      orRefusal(fetchPositionRefs(FANTRAX_LEAGUE_ID)),
    ]);
    if (blocks instanceof FantraxError) return [];
    // Unnamed positions drop out of a letter; the men on the block still print.
    return mapTradeBlocks(blocks, positions instanceof FantraxError ? new Map() : mapPositionNames(positions));
  },
  () => [],
);

/** Every trade waiting on an answer that the commissioner's own teams are in. Fantrax shows a proposal only to the
 *  teams in it and answers for one of the session's teams at a time, so each is asked; nobody else's can be read. */
export const readProposals = leagueCache("trade-proposals",
  async (): Promise<TradeProposal[]> => {
    const cookie = session();
    if (cookie === null) return [];
    const first = await orRefusal(fetchPendingTrades(FANTRAX_LEAGUE_ID, cookie));
    if (first instanceof FantraxError) return [];
    const others = (first.myTeamIds ?? []).filter((teamId) => teamId !== first.teamId);
    const rest = await Promise.all(others.map((teamId) => orRefusal(fetchPendingTrades(FANTRAX_LEAGUE_ID, cookie, teamId))));
    // A trade between two of his teams is in both answers: one letter, not two.
    const bySet = new Map<string, TradeProposal>();
    for (const raw of [first, ...rest]) {
      if (raw instanceof FantraxError) continue;
      for (const proposal of mapPendingTrades(raw)) bySet.set(proposal.setId, proposal);
    }
    return [...bySet.values()];
  },
  () => [],
);
