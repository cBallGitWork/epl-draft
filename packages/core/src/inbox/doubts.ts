import type { AvailabilityNote } from "../gazette/types";
import { doubtBand } from "../football/playerState";
import { doubtFrom, doubtLetter } from "./doubtLetter";
import type { Side } from "./doubtLetter";
import type { InboxItem } from "./types";

// Who a manager loses, as CM's Injuries and Bans: his own men and his next opponent's (Craig,
// 17 Sep 2026: "only show MY teams player news for injuries, and my next opponent (and make it
// clear its their team too)"). Whose man he is is said by the sender, the `about` line and the
// letter itself (`doubtLetter.ts`).

/** The subject, as a back-page headline: "Palmer a doubt for GW6". Surname and `GW` keep it on one row at 390.
 *  No gameweek for a man who has left, or a doubt with no chance against it: neither is about one gameweek. */
function headline(note: AvailabilityNote, gameweek: number | null): string {
  if (note.state === "unavailable") return `${note.playerName} unavailable`;
  const state = !note.out ? "a doubt" : note.state === "suspended" ? "banned" : "out";
  const dated = gameweek !== null && (note.out || note.chance !== null);
  return dated ? `${note.playerName} ${state} for GW${gameweek}` : `${note.playerName} ${state}`;
}

/** The squad the letter is about, when that is not already obvious.
 *
 *  **Only for the opponent's man**, and it is the half of "make it clear its
 *  their team too" that a sender cannot always carry: "The FA" and "The transfer
 *  desk" belong to nobody, so on those two the `from` line says nothing about
 *  whose squad is short. Null for the reader's own, where a fourth field reading
 *  "your squad" would be the screen telling him what it just told him. */
function doubtAbout(side: Side, who: string, gameweek: number | null): string | null {
  if (side !== "opponent") return null;
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
            : anonymous
              ? "league"
              : null;
    if (side === null) return [];
    // Still not a man nobody holds: a free agent's news belongs on the pool,
    // where somebody can act on it.
    if (note.teamId === null) return [];

    const who = squads.name(note.teamId) ?? "Another manager";

    return [
      {
        // **The team is in the id** because `web_name` is not unique — 17 of the
        // 656 in the pool are shared, and `Wilson` is three men. Two items with
        // one id is a repeated React key and an `?item=` that can never select
        // the second.
        id: `doubt:${note.teamId}:${note.playerName}`,
        category: "injury" as const,
        // FPL's stamp for the line. Null falls back to the round, as before.
        at: note.newsAt,
        gameweek,
        headline: headline(note, gameweek),
        body: doubtLetter(note, gameweek, side, who),
        from: doubtFrom(note, side, who),
        about: doubtAbout(side, who, gameweek),
        teamId: note.teamId,
        // The football layer's own word and its own certainty.
        mark: { label: note.label, out: note.out, band: doubtBand(note) },
        // **His own man, definitely not playing.** Red is the row he has to act
        // on before the deadline; the opponent losing a player is news and not
        // bad news, and a filled box already says OUT on both.
        urgent: note.out && side === "mine",
      },
    ];
  });
}
