import type { AvailabilityNote } from "../gazette/types";
import type { InboxItem } from "./types";

// Who a manager loses, as CM's Injuries and Bans — his own men and the men he
// is about to play against.
//
// Its own file for the reason `messages.ts` is one: `items.ts` was at
// CODE_RULES §4's ceiling and this is a whole responsibility that comes off
// cleanly. It shares nothing with a round but the type they both return.
//
// **Two squads, not ten** (Craig, 17 Sep 2026: *"only show MY teams player news
// for injuries, and my next opponent (and make it clear its their team too)"*).
// The screen filed the whole league's from 11 Sep, on his instruction that day,
// and the reversal is not a reversal of the argument — it is a better answer to
// it. A hundred and fifty men across ten squads is a feed; his own is an inbox
// but a blind one, because the doubt that decides a tie is as likely to be in
// the other side's eleven as in his. The two squads in the tie are the list that
// is both short and complete.
//
// **And it says WHOSE**, which is the other half of his sentence and the half a
// filter alone would miss: a list of two squads' injuries that does not say
// which man is whose is a list you have to remember your opponent's name to
// read. It is said twice on purpose — in the `from` line, which is the letter's
// own answer, and in the prose, which is what a person writing to you would say.

/** What the headline says about him, after his name.
 *
 *  **`out` first, because it is the one a manager cannot read around.** It asked
 *  the chance first and so had three answers where FPL has two shapes: a stated
 *  nought, and a status with no number against it. A suspended man carries no
 *  chance at all, so "carries a note" was what the screen said about a ban.
 *
 *  Which KIND of absence is the box's job, not the sentence's — `Sus` beside
 *  "is out" says banned in four characters.
 *
 *  **The round rides in the clause rather than after it**, because the two
 *  branches want different prepositions: a man is out FOR a gameweek and he is a
 *  percentage to play IN one. Craig, 17 Sep 2026, on a blue block reading `GW4`:
 *  *"use the date/time still, and say 'player name is out gw4'"* — so the block
 *  went back to carrying a date like every other row on the screen (it has one
 *  now; see `AvailabilityNote.newsAt`) and the round moved into the sentence,
 *  where it reads as English rather than as a chip.
 *
 *  A man FPL has flagged with no number against him gets no round: "carries a
 *  note for GW5" claims the note is about that round, and it is not — it is a
 *  note about him.
 *
 *  **`GW5` here and "gameweek 5" in the body**, which is not an inconsistency —
 *  it is the difference between a subject line and a letter. A subject is read
 *  in a list one row deep: "Dean Henderson is out for gameweek 5" is 36
 *  characters and a 390 phone gives the headline column about 200px, so it
 *  truncated mid-word at `…is out for gam`. The short form fits and is the one
 *  Craig actually wrote (*"say 'player name is out gw4'"*). The body has the
 *  whole width of the letter and says it in words. */
function headlineState(note: AvailabilityNote, gameweek: number | null): string {
  const round = gameweek === null ? "" : ` GW${gameweek}`;
  if (note.out) return gameweek === null ? "is out" : `is out for${round}`;
  if (note.chance === null) return "carries a note";
  return gameweek === null ? `is ${note.chance}% to play` : `is ${note.chance}% to play,${round}`;
}

/** FPL's note with a full stop on the end of it, when it needs one.
 *
 *  Their wording is inconsistent about it — "Knock - 75% chance of playing." has
 *  one and "Has joined Birmingham on loan for the rest of the season" does not —
 *  and this body puts their sentence after ours either way. Not a rewrite of
 *  their words: a stop is punctuation, and the sentence is theirs. */
function stopped(news: string): string {
  const text = news.trim();
  return text.length === 0 || /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Whose man he is, in the words the reader thinks in. */
type Side = "mine" | "opponent";

/** What the letter says, above FPL's own words.
 *
 *  **A sentence, not a label** — the same argument `dealBody` won on 5 Sep, when
 *  a message read `In: … Out: …` and Craig said "not good". The old body was
 *  FPL's note alone, which is a medical string with no subject: *"Suspended
 *  until 10 Oct."* is a fragment, and the screen around it had to supply the man,
 *  the round and the squad. Craig, 17 Sep 2026: *"lets make this sound like a
 *  real email"*.
 *
 *  So ours is one sentence that names him in full, says what it costs and says
 *  whose it costs, and then FPL's sentence follows it untouched. We do not
 *  paraphrase a medical claim and we never have. */
function doubtBody(note: AvailabilityNote, gameweek: number | null, side: Side, who: string): string {
  const round = gameweek === null ? "" : ` for gameweek ${gameweek}`;
  const mine = side === "mine";
  const lead = note.out
    ? mine
      ? `You lose ${note.fullName}${round}.`
      : `${who} lose ${note.fullName}${round}.`
    : mine
      ? `${note.fullName} is a doubt${round}.`
      : `${who} have a doubt over ${note.fullName}${round}.`;
  const theirs = stopped(note.news);
  return theirs === "" ? lead : `${lead} ${theirs}`;
}

/** Who the letter is from — the desk at the club that would actually know.
 *
 *  **A physio writes about a knock and the FA writes about a ban** (Craig,
 *  17 Sep 2026: *"lets have more fun, so an injury news, could be from the
 *  physio"*). This was one flat string, `Your squad`, on a written rule in
 *  `InboxItem.from` that a sender must be "a real party, never a persona" — and
 *  that rule was too strict by one step. A physio is not a fiction the way a
 *  made-up pundit would be: an injury is reported by a medical desk, a
 *  suspension by the governing body, and a man leaving on loan by the people who
 *  did the paperwork. The line still says nothing that is not true; it just says
 *  who would have said it.
 *
 *  **Whose physio, though** — a doubt in the other squad comes from THEIR desk,
 *  which is a second way of saying whose man he is. The FA and the transfer desk
 *  take no possessive because neither belongs to a club; `about` carries the
 *  squad for those.
 *
 *  Craig's own open question was the third case — *"if a player is out the bin,
 *  not sure who from there"*. `unavailable` is FPL's `u`, and reading the notes
 *  it carries settles it: they are almost all transfers and loans ("Has joined
 *  Al Hilal permanently"), which is the transfer desk's letter and not the
 *  physio's. */
function doubtFrom(note: AvailabilityNote, side: Side, who: string): string {
  switch (note.state) {
    case "suspended":
      return "The FA";
    case "unavailable":
      return "The transfer desk";
    default:
      return side === "mine" ? "Your physio" : `${possessive(who)} physio`;
  }
}

/** A team's name, possessive — "test1's", and "Rovers'" for one already ending
 *  in an s. Team names are the commissioner's to type, so this cannot assume
 *  they are all short and consonant-final. */
function possessive(name: string): string {
  return name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`;
}

/** The squad the letter is about, when that is not already obvious.
 *
 *  **Only for the opponent's man**, and it is the half of "make it clear its
 *  their team too" that a sender cannot always carry: "The FA" and "The transfer
 *  desk" belong to nobody, so on those two the `from` line says nothing about
 *  whose squad is short. Null for the reader's own, where a fourth field reading
 *  "your squad" would be the screen telling him what it just told him. */
function doubtAbout(side: Side, who: string, gameweek: number | null): string | null {
  if (side === "mine") return null;
  return gameweek === null ? `${who}, your next opponent` : `${who}, your gameweek ${gameweek} opponent`;
}

/** The doubts worth a manager's attention: his, and his next opponent's.
 *
 *  **FPL's own words, untruncated.** `AvailabilityNote.news` is the note their
 *  site prints; Fantrax's equivalent arrives ellipsised and is not used.
 *
 *  **And FPL's own date.** This builder used to set `at: null` on every item,
 *  with a comment saying in as many words that a doubt "is a state that holds
 *  now" and that FPL "publishes no 'as of'". That was never probed and it is
 *  false: `news_added` is non-null on 198 of the 198 elements carrying a note,
 *  counted live on 17 Sep 2026. A doubt is an event with a stamp, it sorts on
 *  one calendar with the business, and the blue block prints it.
 *
 *  A note with no stamp still falls back to its round, which is what the block
 *  drew for every doubt until today. */
export function availabilityNews(
  notes: readonly AvailabilityNote[],
  /** The round these doubts bear on — the next one a manager can still pick for,
   *  not the one whose football has been played. */
  gameweek: number | null,
  squads: {
    /** The reader's own team, or null for a reader who has not signed in. */
    mine: string | null;
    /** Who he plays next, or null when the fixture is not known. */
    opponent: string | null;
    /** A team's name by id. Injected, because this module may not hold the
     *  league — the same seam `dealNews` sits on. */
    name: (teamId: string) => string | null;
  },
): InboxItem[] {
  return notes.flatMap((note) => {
    // **A signed-out reader keeps the whole league's**, and that is not an
    // oversight in the filter. "Only mine" is a sentence about a reader who has
    // one; a reader with no team filtered to his own men gets an empty tab, and
    // the league's injury list is public football news either way. All he loses
    // is the ink and the two words that say whose.
    const anonymous = squads.mine === null;
    const side: Side | null =
      note.teamId === null
        ? null
        : note.teamId === squads.mine
          ? "mine"
          : note.teamId === squads.opponent
            ? "opponent"
            : null;
    if (!anonymous && side === null) return [];
    // Still not a man nobody holds: a free agent's news belongs on the pool,
    // where somebody can act on it.
    if (note.teamId === null) return [];

    const who = squads.name(note.teamId) ?? "Another manager";
    // A signed-out reader's list has no side to take, so every row reads as the
    // league's — the owner's name and nothing about "you".
    const from = side === null ? who : doubtFrom(note, side, who);
    const about = side === null ? null : doubtAbout(side, who, gameweek);

    return [
      {
        // **The team is in the id** because `web_name` is not unique — 17 of the
        // 656 in the pool are shared, and `Wilson` is three men. Two items with
        // one id is a repeated React key and an `?item=` that can never select
        // the second.
        id: `doubt:${note.teamId}:${note.playerName}`,
        category: "injury" as const,
        // FPL's stamp for the line. Null falls back to the round, as before.
        at: note.newsAt === null ? null : { iso: note.newsAt },
        gameweek,
        // His full name, because this is the subject line of a letter about him
        // and not a row on a squad list.
        headline: `${note.fullName} ${headlineState(note, gameweek)}`,
        body: side === null ? stopped(note.news) : doubtBody(note, gameweek, side, who),
        from,
        about,
        teamId: note.teamId,
        // The football layer's own word and its own certainty.
        mark: { label: note.label, out: note.out },
        // **His own man, definitely not playing.** Red is the row he has to act
        // on before the deadline; the opponent losing a player is news and not
        // bad news, and a filled box already says OUT on both.
        urgent: note.out && side === "mine",
      },
    ];
  });
}
