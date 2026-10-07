import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type TradeBlock,
  fetchPositionRefs,
  fetchTradeBlocks,
  mapPositionNames,
  mapTradeBlocks,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// Every team's trade block, read as the commissioner (Fantrax shows it to members only) and cached for everybody.
// No session in this environment, or a refusal, is no market news rather than a broken inbox.

export const readTradeBlocks = leagueCache("trade-blocks",
  async (): Promise<TradeBlock[]> => {
    const session = process.env.FANTRAX_COOKIE;
    if (!session) return [];
    const [blocks, positions] = await Promise.all([
      orRefusal(fetchTradeBlocks(FANTRAX_LEAGUE_ID, session)),
      orRefusal(fetchPositionRefs(FANTRAX_LEAGUE_ID)),
    ]);
    if (blocks instanceof FantraxError) return [];
    // Unnamed positions drop out of a letter; the men on the block still print.
    return mapTradeBlocks(blocks, positions instanceof FantraxError ? new Map() : mapPositionNames(positions));
  },
  () => [],
);
