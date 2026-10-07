import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type TradeBlock,
  type TradeProposal,
  fetchPositionRefs,
  fetchTradeBlocks,
  fetchTradeProposals,
  mapPositionNames,
  mapTradeBlocks,
  mapTransactions,
  openProposals,
  stampZone,
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

/** Every trade proposal still unanswered, league-wide, and the zone the session's log stamps them in: a page shows
 *  one only to the two managers in it. */
export const readProposals = leagueCache("trade-proposals",
  async (): Promise<{ proposals: TradeProposal[]; zone: string | null }> => {
    const cookie = session();
    if (cookie === null) return NONE;
    const raw = await orRefusal(fetchTradeProposals(FANTRAX_LEAGUE_ID, cookie));
    if (raw instanceof FantraxError) return NONE;
    return { proposals: openProposals(mapTransactions(raw, "TRADE")), zone: stampZone(raw) };
  },
  () => NONE,
);

const NONE = { proposals: [], zone: null };
