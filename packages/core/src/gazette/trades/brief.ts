import { howMany, listed } from "../../format";
import type { StoryTransfer } from "./cargo";
import type { Trade, TradeMove } from "./trades";

// Here We Go's facts: who went where, what came back, and each man's season so far. The headline and the deck are the
// desk's, from the facts; the writer is handed both and writes only the item.

/** The desk's sign-off, printed after the writer's item: Romano's "Here we go!", in words, as the paper prints no emoji. */
export const HERE_WE_GO_SIGN_OFF = "Here we go!";

/** His season so far: Fantrax's points and the goals he has scored; null where we hold no reading. */
export interface TradeFigures {
  points: number | null;
  goals: number | null;
}

export interface TradeStoryInput {
  trade: Trade;
  /** A manager's side as the Team Sheet prints it: the league's short name. */
  teamName: (teamId: string) => string;
  figures: (fantraxId: string) => TradeFigures;
}

export interface TradeStory {
  headline: string;
  deck: string;
  brief: string;
  /** Every man, side and club the brief names, for the editor. */
  names: string[];
  /** The man the item is about: the one who has scored most. */
  lead: TradeMove;
  /** The side he joined, as the picture prints it. */
  transfer: StoryTransfer;
}

export function tradeStory({ trade, teamName, figures }: TradeStoryInput): TradeStory {
  const points = (move: TradeMove) => figures(move.fantraxId).points ?? -Infinity;
  const goals = (move: TradeMove) => figures(move.fantraxId).goals ?? -Infinity;
  // Stable: level men keep the feed's order.
  const lead = [...trade.moves].sort((a, b) => points(b) - points(a) || goals(b) - goals(a))[0];
  const sides = [...new Set(trade.moves.flatMap((move) => [move.toTeamId, move.fromTeamId]))];

  const line = (move: TradeMove) => {
    const about = [move.position, move.clubName].filter((part): part is string => part !== null && part !== "");
    const { points: scored, goals: netted } = figures(move.fantraxId);
    const season = [
      ...(scored === null ? [] : [howMany(scored, "point")]),
      ...(netted === null ? [] : [netted === 0 ? "no goals" : howMany(netted, "goal")]),
    ];
    return `- ${teamName(move.toTeamId)} get ${move.playerName}${about.length === 0 ? "" : ` (${about.join(", ")})`} from ${teamName(move.fromTeamId)}.${season.length === 0 ? "" : ` His season: ${season.join(", ")}.`}`;
  };

  const headline = `Here we go! ${lead.playerName} to ${teamName(lead.toTeamId)}`;
  const brief = [
    "A TRADE in the league, completed. It is the whole story: no fee, no medical, no contract and no agent, because a draft league has none.",
    "",
    "THE DEAL",
    ...trade.moves.map(line),
    "",
    `THE HEADLINE, which the desk prints: ${headline}`,
    `THE MANAGERS IN IT: ${listed(sides.map(teamName))}.`,
  ].join("\n");

  const names = [
    ...trade.moves.map((move) => move.playerName),
    ...sides.map(teamName),
    ...trade.moves.map((move) => move.clubName ?? ""),
  ];
  return { headline, deck: deckOf(trade, lead, sides, teamName), brief, names: [...new Set(names)].filter((name) => name !== ""), lead, transfer: { teamId: lead.toTeamId, team: teamName(lead.toTeamId) } };
}

/** The deal in plain words: one side's gain for the other's, or each man to his new side in a deal of three or more. */
function deckOf(trade: Trade, lead: TradeMove, sides: readonly string[], teamName: (teamId: string) => string): string {
  if (sides.length !== 2) return listed(trade.moves.map((move) => `${move.playerName} to ${teamName(move.toTeamId)}`));
  const to = (teamId: string) => trade.moves.filter((move) => move.toTeamId === teamId).map((move) => move.playerName);
  const gainer = lead.toTeamId;
  const other = lead.fromTeamId;
  const back = to(other);
  return `${teamName(gainer)} get ${listed(to(gainer))} from ${teamName(other)}${back.length === 0 ? "" : ` for ${listed(back)}`}`;
}
