import type { Deal, DealSide } from "../gazette/types";
import type { InboxItem } from "./types";

// The league's business, as CM's Messages: who signed, who released, who traded.
//
// Its own file because `items.ts` reached CODE_RULES §4's hard ceiling and this
// is the responsibility that comes off cleanly — a transaction feed turned into
// prose, sharing nothing with a doubt or a round but the type they all return.
//
// Pure, and separately callable: a Fantrax outage that costs the transaction
// feed costs this tab and no other. The app edge assembles.
//
// **Every headline is a fact in the fewest words that carry it**, which is the
// game's own register (`Rushden appoint Mike Paul as manager`) and the Gazetta's
// house voice. No adjective, no advice, and no verb tense games.

/** How many names a headline will carry before it counts instead.
 *
 *  Two, and the reason is the width rather than the taste: a headline is one
 *  line on a 390 phone at 14px, which is about forty characters, and two
 *  footballers' names spend thirty of them. The third goes in the body, where
 *  there is room for all of them. */
const NAMES_IN_HEADLINE = 2;

/** A list of people, said the way a person would say it. */
function listed(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** A side's names, with his club where the feed gave one — the transaction feed
 *  is the only source that carries it, so most callers print nothing. */
function named(side: DealSide): string {
  return side.club ? `${side.playerName} (${side.club})` : side.playerName;
}

/** The league's business, as messages.
 *
 *  **A trade is one item and a claim is one item**, which is `Deal`'s own
 *  argument: Fantrax files both halves as separate rows sharing a `setId`, and
 *  reading them apart produces a feed saying a manager signed a player and,
 *  separately and mysteriously, lost one.
 *
 *  Three shapes, because three things happen: somebody signed and somebody
 *  released (a trade), somebody signed off the wire (a claim, often paid for by
 *  a drop), or somebody released and nobody signed. The headline names whichever
 *  of the two is the news. */
export function dealNews(
  deals: readonly Deal[],
  /** A team's name, or null for an id the league no longer describes. Injected
   *  rather than looked up, because the deal carries an id and this module may
   *  not hold the league. */
  teamName: (teamId: string) => string | null,
): InboxItem[] {
  return deals.flatMap((deal) => {
    const gained = deal.inbound.map(named);
    const lost = deal.outbound.map(named);
    if (gained.length === 0 && lost.length === 0) return [];

    // Whose item it is. A trade has two sides and belongs to neither more than
    // the other, so it is the league's — which is also what stops it going red
    // for one of the two managers in it.
    const sides = new Set(
      [...deal.inbound, ...deal.outbound].map((side) => side.teamId).filter((id) => id !== null),
    );
    const teamId = sides.size === 1 ? [...sides][0] : null;
    const who = teamId === null ? null : teamName(teamId);

    const headline =
      deal.kind === "trade"
        ? tradeHeadline(deal, teamName)
        : gained.length > 0
          ? `${who ?? "A manager"} sign ${listed(gained.slice(0, NAMES_IN_HEADLINE))}`
          : `${who ?? "A manager"} release ${listed(lost.slice(0, NAMES_IN_HEADLINE))}`;

    const body = dealBody(deal, gained, lost, who, teamName);

    return [
      {
        id: `deal:${deal.setId}`,
        category: "message" as const,
        // Their stamp, tagged as theirs. `Deal.processedAt` is
        // `"Wed Sep 2, 2026, 6:11AM"` — offsetless, in their zone.
        at: deal.processedAt === null ? null : { fantrax: deal.processedAt },
        gameweek: null,
        headline,
        body,
        // **The manager who did it**, and "The league" for a trade — which has
        // two and belongs to neither, the same argument that decides `teamId`
        // just above and keeps a trade off both managers' red ground.
        from: who ?? "The league",
        about: null,
        teamId,
        // No box: business is about a transaction, not about whether a man is
        // fit. The one a deal WOULD carry is on his own player page.
        mark: null,
        // Business is never red. A manager who made a deal already knows he made
        // it, and a rival's is not bad news — it is news.
        urgent: false,
      },
    ];
  });
}

/** What the message says under the headline.
 *
 *  **A sentence, not a ledger** (Craig, 5 Sep 2026, quoting the worst of it back:
 *  *"test4 sign Zion Suzuki (AVL) / In: Zion Suzuki (AVL). Out: David Raya
 *  (ARS)."* — "not good"). It was `In: …` and `Out: …`, which is the shape of the
 *  transaction row it was built from and reads as a receipt. Worse, it restated
 *  the headline's own nouns: a reader who has just read "test4 sign Zion Suzuki"
 *  is told again, in a colon list, that Zion Suzuki is in.
 *
 *  What a message adds to a subject line is the OTHER half — a claim's cost, a
 *  release's destination, a trade's return. So the body says what the headline
 *  did not, in the fewest words that carry it, and says nothing at all when
 *  there is nothing to add.
 *
 *  Still no adjective and no advice: this is the same house voice as the paper. */
function dealBody(
  deal: Deal,
  gained: readonly string[],
  lost: readonly string[],
  who: string | null,
  teamName: (teamId: string) => string | null,
): string {
  const manager = who ?? "A manager";

  if (deal.kind === "trade") {
    // **Each man with the manager he joins**, which is the one thing a trade's
    // headline cannot carry: it names the two managers and not who went where.
    // Reading the direction off each side's own `teamId` also survives however
    // Fantrax happens to split the rows — a 1-for-1 came through as two INBOUND
    // sides and no outbound, so a body built from `gained` and `lost` said
    // "A and B changes hands" and named neither destination.
    const moves = deal.inbound.map((side) => {
      // A side Fantrax filed against no team — rare, and the name still moved.
      const to = side.teamId === null ? null : teamName(side.teamId);
      return `${named(side)} joins ${to ?? "a manager"}`;
    });
    return moves.length > 0 ? `${listed(moves)}.` : "";
  }

  if (gained.length > 0) {
    const cost =
      lost.length > 0
        ? ` ${listed(lost)} ${lost.length === 1 ? "makes" : "make"} way.`
        : "";
    return `${listed(gained)} ${gained.length === 1 ? "joins" : "join"} ${manager} off the waiver wire.${cost}`;
  }

  return lost.length > 0
    ? `${listed(lost)} ${lost.length === 1 ? "leaves" : "leave"} ${manager} and ${lost.length === 1 ? "is" : "are"} back in the pool.`
    : "";
}

/** Both managers, when a trade has two. Reads as the game would say it. */
function tradeHeadline(deal: Deal, teamName: (teamId: string) => string | null): string {
  const ids = [...new Set([...deal.inbound, ...deal.outbound].map((side) => side.teamId))].filter(
    (id) => id !== null,
  );
  const names = ids.map((id) => teamName(id) ?? "a manager");
  return names.length >= 2 ? `${names[0]} and ${names[1]} agree a trade` : "A trade is agreed";
}
