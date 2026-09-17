import type { InboxItem } from "./types";
import { whenKey } from "./when";

// The round, and the merge that orders the whole inbox.
//
// The league's business is in `messages.ts` and the doubts are in `doubts.ts`;
// both came out when this file hit CODE_RULES §4's ceiling. All three return
// `InboxItem[]` and none of them knows about the others.
//
// Pure, and separately callable: each builder takes what its own source hands
// over and nothing else. The app edge assembles.
//
// **Every headline is a fact in the fewest words that carry it**, which is the
// game's own register (`Rushden appoint Mike Paul as manager`) and the Gazetta's
// house voice. No adjective, no advice, and no verb tense games: an event that
// happened is past, a state that holds is present.

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
  /** The NEXT lock, and **the round it belongs to rather than the round in
   *  view** — which are the same only on the two days between a round finishing
   *  and the next deadline passing.
   *
   *  It was an ISO string alone, and the item took its round number from
   *  `gameweek`: so from Friday teatime until the following Friday the row read
   *  "Gameweek 3 lineups lock" over a block dated the 12th, which is GW4's lock.
   *  A deadline is the one item on this screen that is about a round the reader
   *  is not looking at, so it carries its own. */
  deadline: { gameweek: number; locksAt: string } | null;
  /** The reader's own finished tie, or null while it is unplayed or he has none. */
  yours: { opponent: string; points: number | null; against: number | null } | null;
}): InboxItem[] {
  const items: InboxItem[] = [];

  if (deadline !== null) {
    items.push({
      id: `deadline:${deadline.gameweek}`,
      category: "competition",
      at: { iso: deadline.locksAt },
      gameweek: deadline.gameweek,
      headline: `Gameweek ${deadline.gameweek} lineups lock`,
      // The commissioner's, never FPL's — `locksAt` derives it in one place so
      // this and the paper's masthead cannot print different times.
      // **Said once, the way the commissioner would say it** (Craig, 17 Sep 2026,
      // on the version before this one: *"reads like a bot"*). It was two
      // sentences spelling out the same rule twice — what happens to a man on
      // the bench, and then what happens to a man not named — which is a terms
      // and conditions page, not a note from the bloke who runs the league.
      body: "Get your eleven in before then. Whatever is not in it does not score.",
      // The one item on the screen that genuinely comes from a person, and the
      // league's rules are his — see `nextDeadline` on why the lead is ours to
      // derive rather than FPL's to publish.
      from: "The commissioner",
      about: null,
      teamId: null,
      mark: null,
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
      // **The score, said rather than logged.** It was `12 to 9.`, which is a
      // cell out of a table; a letter reporting a result says who scored what.
      body: won
        ? `You won it ${yours.points} to ${yours.against}.`
        : drawn
          ? `${yours.points} apiece.`
          : `${yours.against} to ${yours.points}.`,
      from: "The league",
      about: null,
      teamId: null,
      mark: null,
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
 *  builders gave them.**
 *
 *  That second half used to carry most of the screen: every doubt was undated,
 *  on a belief about FPL that turned out to be false, so the injuries arrived as
 *  a block at the foot in whatever order the paper had sorted them. They carry
 *  `news_added` now (`doubts.ts`), so they sort into the same calendar as the
 *  business and the screen is one feed, newest first — which is what an inbox is.
 *
 *  What is left undated is the round's own result, which is a standing fact
 *  about a finished tie rather than something filed at a moment.
 *
 *  Stable within each half, so a builder's own ordering survives. */
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
