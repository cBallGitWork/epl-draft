import type { AvailabilityNote, Deal, DealSide } from "../gazette/types";
import type { InboxItem } from "./types";
import { whenKey } from "./when";

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
        teamId,
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
  /** The round the doubt is about, which is the only "when" this source has. */
  gameweek: number | null,
  /** The reader's own team. **His own men and nobody else's** (Craig, 5 Sep
   *  2026: "should just be your team only for player news"), which is the
   *  filter as well as the red ground.
   *
   *  A rival's doubt is real news and it is not HIS news: this screen is the
   *  manager's inbox, and 150 men across ten squads is a feed rather than an
   *  inbox — a hundred rows he cannot act on, burying the two he can. The
   *  league's whole injury list is still a thing the Gazetta prints, off the
   *  same `availability` builder.
   *
   *  Null — nobody signed in — files none of them rather than all of them. A
   *  reader with no team has no doubts to be told about, and showing him the
   *  league's would be the feed this filter exists to stop. */
  mine: string | null,
): InboxItem[] {
  return notes
    .filter((note) => mine !== null && note.teamId === mine)
    .map((note) => ({
      id: `doubt:${note.playerName}`,
      category: "injury" as const,
      at: null,
      gameweek,
      headline:
        note.chance === null
          ? `${note.playerName} carries a note`
          : `${note.playerName} ${note.chance === 0 ? "is out" : `is ${note.chance}% to play`}`,
      // Just his words. The owner's name was a second sentence here, saying
      // whose problem it was — and on a screen that now files only the reader's
      // own men it said "yours" in a longer way on every row.
      body: stopped(note.news),
      teamId: note.teamId,
      // Every item here is his, so the red ground is the one thing it still
      // distinguishes: a man who is a real doubt from one who carries a note.
      urgent: (note.chance ?? 100) < DOUBT,
    }));
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
      at: deadline === null ? null : { iso: deadline },
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
      // **A sentence rather than a log line.** It read `Gameweek 3: lost against
      // testf`, which is a row out of a results table with a colon in it, and
      // the body under it was the bare score. A message says what happened.
      headline: won
        ? `You beat ${yours.opponent} in gameweek ${gameweek}`
        : drawn
          ? `You drew with ${yours.opponent} in gameweek ${gameweek}`
          : `${yours.opponent} beat you in gameweek ${gameweek}`,
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
  const keyed = groups.flat().map((item) => ({ item, key: whenKey(item.at) }));
  const dated = keyed.filter((row) => row.key !== null);
  const undated = keyed.filter((row) => row.key === null);
  // Newest first, on one calendar. This compared the two shapes as TEXT and said
  // in as many words that the order where they met "says nothing false" — which
  // was wrong twice over: `"2026-09-12T…"` sorts under `"Wed Sep 2…"` by first
  // character, so the round's deadline appeared beneath ten days of older deals,
  // and the two shapes met on every list this app has ever drawn. `whenKey` puts
  // both into Fantrax's own calendar, which is the one comparison that converts
  // neither of them.
  dated.sort((a, b) => (b.key ?? 0) - (a.key ?? 0));
  return [...dated, ...undated].map((row) => row.item);
}
