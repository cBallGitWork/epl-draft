import type { AvailabilityNote, Deal, DealSide } from "../gazette/types";
import type { InboxItem } from "./types";

// The three builders that fill the inbox, and the merge that orders it.
//
// Pure, and separately callable: each takes what its own source hands over and
// nothing else, so a Fantrax outage that costs the transaction feed costs the
// Messages tab and no other. The app edge assembles.
//
// **Every headline is a fact in the fewest words that carry it**, which is the
// game's own register (`Rushden appoint Mike Paul as manager`) and the Gazetta's
// house voice. No adjective, no advice, and no verb tense games: an event that
// happened is past, a state that holds is present.

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

    const body = [
      gained.length > 0 ? `In: ${listed(gained)}.` : null,
      lost.length > 0 ? `Out: ${listed(lost)}.` : null,
    ]
      .filter((line) => line !== null)
      .join(" ");

    return [
      {
        id: `deal:${deal.setId}`,
        category: "message" as const,
        at: deal.processedAt,
        gameweek: null,
        headline,
        body,
        teamId,
        // Business is never red. A manager who made a deal already knows he made
        // it, and a rival's is not bad news — it is news.
        urgent: false,
      },
    ];
  });
}

/** Both managers, when a trade has two. Reads as the game would say it. */
function tradeHeadline(deal: Deal, teamName: (teamId: string) => string | null): string {
  const ids = [...new Set([...deal.inbound, ...deal.outbound].map((side) => side.teamId))].filter(
    (id) => id !== null,
  );
  const names = ids.map((id) => teamName(id) ?? "a manager");
  return names.length >= 2 ? `${names[0]} and ${names[1]} agree a trade` : "A trade is agreed";
}

/** FPL's note with a full stop on the end of it, when it needs one.
 *
 *  Their wording is inconsistent about it — "Knock - 75% chance of playing." has
 *  one and "Has joined Birmingham on loan for the rest of the season" does not —
 *  and this body puts a second sentence after it either way, so without this the
 *  screen prints "…rest of the season test2 holds him." Not a rewrite of their
 *  words: a stop is punctuation, and the sentence is theirs. */
function stopped(news: string): string {
  const text = news.trim();
  return text.length === 0 || /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Below this, a man is a doubt worth putting on a red ground for his own
 *  manager. FPL's own scale, and 50 is where its wording turns from "should be
 *  fit" to "may not be" — a quarter chance is the point at which a manager has
 *  to plan around him rather than watch him. */
const DOUBT = 50;

/** The doubts, as CM's Injuries and Bans.
 *
 *  **FPL's own words, untruncated.** `AvailabilityNote.news` is the note their
 *  site prints; Fantrax's equivalent arrives ellipsised and is not used. We do
 *  not paraphrase a medical claim.
 *
 *  **No date, and that is a property of the source rather than a gap.** A doubt
 *  is a state that holds now; FPL publishes no "as of", so inventing one would
 *  date a fact to the moment we happened to read it. The round carries the when
 *  instead. */
export function availabilityNews(
  notes: readonly AvailabilityNote[],
  teamName: (teamId: string) => string | null,
  /** The round the doubt is about, which is the only "when" this source has. */
  gameweek: number | null,
  /** The reader's own team, so his own men can go red. Null when nobody is
   *  signed in, and then nothing does. */
  mine: string | null,
): InboxItem[] {
  return notes.map((note) => {
    const who = note.teamId === null ? null : teamName(note.teamId);
    return {
      id: `doubt:${note.playerName}`,
      category: "injury" as const,
      at: null,
      gameweek,
      headline:
        note.chance === null
          ? `${note.playerName} carries a note`
          : `${note.playerName} ${note.chance === 0 ? "is out" : `is ${note.chance}% to play`}`,
      // Whose problem it is comes second, because the man is the news and the
      // owner is what makes it yours. A man nobody holds still gets an item: he
      // is on the wire, and that is a fact about the wire.
      body: [
        stopped(note.news),
        who === null ? "Nobody in the league holds him." : `${who} holds him.`,
      ]
        .filter((line) => line.length > 0)
        .join(" "),
      teamId: note.teamId,
      urgent: mine !== null && note.teamId === mine && (note.chance ?? 100) < DOUBT,
    };
  });
}

/** One round of our own competition, as CM's Competitions tab.
 *
 *  Two kinds of item and no more: when the round locks, and how the reader's own
 *  tie finished. **Not every tie** — the game files what the club was told, and
 *  a manager was not told the score of a match he was not in. Those are on
 *  Results, which is a table and reads better as one. */
export function roundNews({
  gameweek,
  deadline,
  yours,
}: {
  gameweek: number | null;
  /** When lineups lock, ISO. Null when the league described no roster period. */
  deadline: string | null;
  /** The reader's own finished tie, or null while it is unplayed or he has none. */
  yours: { opponent: string; points: number | null; against: number | null } | null;
}): InboxItem[] {
  const items: InboxItem[] = [];

  if (gameweek !== null && deadline !== null) {
    items.push({
      id: `deadline:${gameweek}`,
      category: "competition",
      at: deadline,
      gameweek,
      headline: `Gameweek ${gameweek} lineups lock`,
      // The commissioner's, never FPL's — `locksAt` derives it in one place so
      // this and the paper's masthead cannot print different times.
      body: "The commissioner's deadline. Anything not in your eleven by then does not count.",
      teamId: null,
      urgent: false,
    });
  }

  if (gameweek !== null && yours !== null && yours.points !== null && yours.against !== null) {
    const won = yours.points > yours.against;
    const drawn = yours.points === yours.against;
    items.push({
      id: `result:${gameweek}`,
      category: "competition",
      at: null,
      gameweek,
      headline: `Gameweek ${gameweek}: ${won ? "won" : drawn ? "drawn" : "lost"} against ${yours.opponent}`,
      body: `${yours.points} to ${yours.against}.`,
      teamId: null,
      // A defeat is bad news about you, which is exactly what CM's red ground
      // is for — and a win is not, however much it is yours.
      urgent: !won && !drawn,
    });
  }

  return items;
}

/** The inbox, newest first.
 *
 *  **Dated items lead, in date order; undated ones follow in the order their
 *  builders gave them.** A doubt has no date (see `availabilityNews`) and
 *  sorting it against one would put it at an arbitrary end of the list; keeping
 *  it after the dated business is the honest order, and the categories are what
 *  a reader filters by anyway.
 *
 *  Stable within each half, so a builder's own ordering survives — the paper
 *  already sorts availability with the reader's own men first, and that is a
 *  reading aid this must not undo. */
export function inboxItems(...groups: readonly InboxItem[][]): InboxItem[] {
  const all = groups.flat();
  const dated = all.filter((item) => item.at !== null);
  const undated = all.filter((item) => item.at === null);
  // Newest first. `at` is compared as a STRING and that is deliberate: Fantrax's
  // own label carries no offset (`Deal.processedAt`), so parsing it would be
  // guessing a timezone, and an ISO deadline sorts correctly as text anyway.
  // Where the two shapes meet the order is arbitrary and says nothing false.
  dated.sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "") * -1);
  return [...dated, ...undated];
}
