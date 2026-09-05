// The manager's inbox: what the club has been told, newest first.
//
// **`inbox/` and not `news/`, and the collision is the reason.** `src/news/` is
// already the BBC RSS reader the Gazetta triages, and it exports its own
// `NewsItem` — an article off a wire, with a link and a guid. This is a screen's
// worth of things that happened in OUR league. Two types with one name in one
// package is the confusion CODE_RULES §4 is about, and the word CM itself uses
// for this screen is the inbox. So the module is `inbox/` and the type is
// `InboxItem`: the root barrel exports both modules' vocabularies and neither
// name has to be qualified at a call site.
//
// Championship Manager opens on this screen and the app never had one. Craig,
// 5 Sep 2026, with the shot: *"Need to build league/team news for manager like
// CM."* `docs/ui/reference/craig/02-news.jpg` is the object — a dated list with
// a blue date block down the left, one item selected and drawn on a red ground,
// its headline in yellow under the list and its body beneath that, and a tab
// strip reading `All · Messages · Competitions · Injuries and Bans`.
//
// **It reports, it does not advise.** Same house voice as the Gazetta: "Rushden
// appoint Mike Paul as manager" is what the game writes, and every headline here
// is that shape — a fact, in the fewest words that carry it, with no adjective
// and no opinion. The one thing this screen has that the paper does not is that
// it is about YOU: your signings, your doubts, your round.
//
// **Nothing here is a new read.** Every item is built from something the edition
// already fetches — the transaction feed, the availability notes, the round —
// which is what keeps a sixth screen off the Saturday request budget entirely.

/** CM's own four tabs, less the one that is a union of the others.
 *
 *  The names are the game's (`02-news.jpg`) rather than ours, because a manager
 *  who has played it knows where to look and the words are already right:
 *  business is a MESSAGE, a round is a COMPETITION, and a doubtful player is an
 *  injury or a ban. "All" is not a category — it is the absence of a filter. */
export type InboxCategory = "message" | "competition" | "injury";

/** One item in the inbox. */
export interface InboxItem {
  /** Stable across polls, so a refresh does not move the selection. Built from
   *  the source's own key — a deal's `setId`, a player's name, a period — and
   *  never from an index, which changes the moment anything is filed above it. */
  id: string;
  category: InboxCategory;
  /** When it happened. **Fantrax's own string, verbatim, where it has one** — it
   *  carries no offset and reinterpreting it into a timezone we guessed is how a
   *  transaction moves a day. Null for an item whose source is a standing state
   *  rather than an event: a doubt is true now and was not "filed" at a moment. */
  at: string | null;
  /** The round it belongs to, for an item with no date of its own. Between them
   *  the two answer "when", which is what CM's blue block carries. */
  gameweek: number | null;
  /** A fact, in the fewest words that carry it. No verb tense games and no
   *  adjective — see the note above. */
  headline: string;
  /** One or two sentences. CM's is one. */
  body: string;
  /** Whose it is, or null for something the whole league was told. */
  teamId: string | null;
  /** Drawn on the red ground CM gives the item that matters — and it means
   *  "this one is about you AND it is bad news", never merely "this one is
   *  yours". The game reserves it: in the shot, `Board expecting difficult
   *  season` is red and `Rushden appoint Mike Paul as manager` is not, on the
   *  same day, about the same manager. */
  urgent: boolean;
}
