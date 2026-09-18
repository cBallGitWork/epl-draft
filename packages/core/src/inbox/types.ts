import type { InboxWhen } from "./when";

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
// it takes YOUR side: your round, your signings, and the doubts in the two
// squads that decide your next tie — yours, in red, and your opponent's, said as
// his (`doubts.ts` carries the argument for the pair).
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
  /** When it happened, and WHICH KIND of "when" it is — `when.ts` carries the
   *  argument. Fantrax's own string is kept verbatim where it has one, because it
   *  carries no offset and reinterpreting it into a timezone we guessed is how a
   *  transaction moves a day; ours is a real instant. One field carrying both
   *  vocabularies untagged is what sorted a 12 Sep deadline under 2 Sep deals and
   *  printed a US stamp beside a British date.
   *
   *  Null for an item whose source is a standing state rather than an event —
   *  the round's own result, which is a fact about a finished tie rather than
   *  something filed at a moment. **A doubt used to be in that sentence and is
   *  not any more**: FPL stamps every note it publishes (`news_added`, 198/198
   *  counted 17 Sep 2026), so an injury is an event with a date like the rest. */
  at: InboxWhen | null;
  /** The round it belongs to, for an item with no date of its own. Between them
   *  the two answer "when", which is what CM's blue block carries. */
  gameweek: number | null;
  /** A fact, in the fewest words that carry it. No verb tense games and no
   *  adjective — see the note above. */
  headline: string;
  /** One or two sentences. CM's is one. */
  body: string;
  /** Who it is from — the line a letter opens with, and the reason this screen
   *  reads as post rather than as a feed (Craig, 17 Sep 2026: *"lets make this
   *  sound like a real email"*).
   *
   *  **The desk that would actually know**, which is one step looser than the
   *  rule this carried for an hour. That rule said "always a real party, never a
   *  persona", and refused a club doctor on the grounds that the house voice
   *  forbids anything made up. Craig widened it the same day (*"lets have more
   *  fun, so an injury news, could be from the physio, another manager for a
   *  trade offer"*), and he is right that it was too strict: a physio reporting
   *  a knock invents nothing. An injury IS reported by a medical desk and a ban
   *  BY the governing body, so naming them is a fact about the letter rather
   *  than a character we wrote.
   *
   *  What is still forbidden is a sender with an opinion. The desk signs the
   *  letter; it does not tell you what to do about it. */
  from: string;
  /** What it is about, when the `from` line does not already say — the squad a
   *  doubt belongs to, for a letter from a desk that belongs to nobody.
   *
   *  Null far more often than not, and it renders as nothing: a letter about the
   *  reader's own man does not need a field saying so. */
  about: string | null;
  /** Whose it is, or null for something the whole league was told. The row
   *  prints it; `from` is what says it in words. */
  teamId: string | null;
  /** CM's availability box, for an item about a footballer: the word that goes
   *  in it and whether he is definitely not playing. Null for business and for a
   *  round, neither of which has one.
   *
   *  **The box is what makes a league-wide list readable**, and it is the game's
   *  own object rather than a new one — `StateBox` draws the same two states on a
   *  squad list, filled for an absence and outlined for a doubt, which is
   *  DESIGN §2's rule that certain and uncertain are said in FILL rather than in
   *  a second hue, so the distinction survives a reader who cannot tell two reds
   *  apart. `label` is the football layer's word (`Inj`, `Sus`, `Unav`,
   *  `Dbt`), so a reader learns WHY at a glance and not merely that something is
   *  wrong. */
  mark: { label: string; out: boolean } | null;
  /** Drawn on the red ground CM gives the item that matters — and it means
   *  "this one is about you AND it is bad news", never merely "this one is
   *  yours". The game reserves it: in the shot, `Board expecting difficult
   *  season` is red and `Rushden appoint Mike Paul as manager` is not, on the
   *  same day, about the same manager. */
  urgent: boolean;
}
