import { listed } from "../format";
import type { Deal, DealSide } from "../gazette/types";
import type { InboxItem } from "./types";
import { fantraxInstant } from "./when";

// The league's business, as CM's Messages: who signed, who released, who traded. A headline is a bare fact; the
// body a letter from your assistant about your business, the commissioner about anyone else's. Never advice.

/** How many names a headline carries: two fill one line on a 390 phone; the rest go in the body. */
const NAMES_IN_HEADLINE = 2;


/** A side's name for a headline: `Brian Brobbey (SUN)`, where the feed gave a club. */
function named(side: DealSide): string {
  return side.club ? `${side.playerName} (${side.club})` : side.playerName;
}

/** The same man in a letter: `Sunderland's Brian Brobbey`. */
function spoken(side: DealSide): string {
  return side.clubName ? `${side.clubName}'s ${side.playerName}` : named(side);
}

/** The league's business, as messages: one item per trade or claim, whose halves Fantrax files as rows sharing a
 *  `setId`. A trade, a signing (often paid for by a drop) or a bare release. */
export function dealNews(
  deals: readonly Deal[],
  /** A team's name, or null for an id the league no longer describes; injected, as this module may not hold the league. */
  teamName: (teamId: string) => string | null,
  /** The reader's own team, whose business is written to him as his; null when signed out. */
  mine: string | null,
): InboxItem[] {
  return deals.flatMap((deal) => {
    const gained = deal.inbound.map(named);
    const lost = deal.outbound.map(named);
    if (gained.length === 0 && lost.length === 0) return [];

    // Whose item it is: a trade has two sides, so it is the league's.
    const sides = new Set(
      [...deal.inbound, ...deal.outbound].map((side) => side.teamId).filter((id) => id !== null),
    );
    const teamId = sides.size === 1 ? [...sides][0] : null;
    const yours = teamId !== null && teamId === mine;
    const who = yours ? "You" : teamId === null ? null : teamName(teamId);

    const headline =
      deal.kind === "trade"
        ? tradeHeadline(deal, teamName)
        : gained.length > 0
          ? `${who ?? "A manager"} sign ${listed(gained.slice(0, NAMES_IN_HEADLINE))}`
          : `${who ?? "A manager"} release ${listed(lost.slice(0, NAMES_IN_HEADLINE))}`;

    const party = deal.kind === "trade" && [...deal.inbound, ...deal.outbound].some((side) => side.teamId === mine);
    const body = dealBody(deal, yours ? null : (who ?? "A manager"), teamName, mine);

    return [
      {
        id: `deal:${deal.setId}`,
        category: "message" as const,
        at: deal.processedAt === null ? null : fantraxInstant(deal.processedAt),
        gameweek: null,
        headline,
        body,
        from: yours || party ? "Your assistant" : "The commissioner",
        about: null,
        teamId,
        // No box: business is about a transaction, not a man's fitness.
        mark: null,
        // Business is never red: your own deal you know of, and a rival's is news, not bad news.
        urgent: false,
      },
    ];
  });
}

/** The letter under the headline: what the headline did not say, as a person would say it.
 *  `who` is the rival who did it, or null when the business is the reader's own. */
function dealBody(
  deal: Deal,
  who: string | null,
  teamName: (teamId: string) => string | null,
  mine: string | null,
): string {
  const gained = deal.inbound.map(spoken);
  const lost = deal.outbound.map(spoken);
  const one = (names: readonly string[], single: string, plural: string) => (names.length === 1 ? single : plural);

  if (deal.kind === "trade") {
    const moves = deal.inbound.map((side) => {
      const to = side.teamId === mine ? "you" : side.teamId === null ? null : teamName(side.teamId);
      return `${spoken(side)} joins ${to ?? "a manager"}`;
    });
    if (moves.length === 0) return "";
    const party = [...deal.inbound, ...deal.outbound].some((side) => side.teamId === mine);
    return `${party ? "Your trade has gone through" : "The trade has gone through"}: ${listed(moves)}.`;
  }

  if (gained.length === 0) {
    if (lost.length === 0) return "";
    return who === null
      ? `${listed(lost)} ${one(lost, "has", "have")} been released and ${one(lost, "goes", "go")} back into the pool.`
      : `${who} have released ${listed(lost)}. ${one(lost, "He's", "They're")} back in the pool.`;
  }

  if (who === null) {
    const room = lost.length === 0 ? "" : `, and ${listed(lost)} ${one(lost, "goes", "go")} back into the pool to make room`;
    if (deal.via === "waivers") return `Your waiver claim for ${listed(gained)} went through${room}.`;
    if (deal.via === "free agency") return `We've signed ${listed(gained)} as a free agent${room}.`;
    return `${listed(gained)} ${one(gained, "has", "have")} joined the squad${room}.`;
  }
  const room = lost.length === 0 ? "" : `, releasing ${listed(lost)} to make room`;
  if (deal.via === "waivers") return `${who} have claimed ${listed(gained)} off waivers${room}.`;
  if (deal.via === "free agency") return `${who} have signed ${listed(gained)} as a free agent${room}.`;
  return `${who} have signed ${listed(gained)}${room}.`;
}

/** Both managers, when a trade has two. Reads as the game would say it. */
function tradeHeadline(deal: Deal, teamName: (teamId: string) => string | null): string {
  const ids = [...new Set([...deal.inbound, ...deal.outbound].map((side) => side.teamId))].filter(
    (id) => id !== null,
  );
  const names = ids.map((id) => teamName(id) ?? "a manager");
  return names.length >= 2 ? `${names[0]} and ${names[1]} agree a trade` : "A trade is agreed";
}
