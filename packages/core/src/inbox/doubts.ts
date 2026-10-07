import type { AvailabilityNote } from "../gazette/types";
import { doubtBand } from "../football/playerState";
import { doubtFrom, doubtLetter } from "./doubtLetter";
import type { Side } from "./doubtLetter";
import type { InboxItem } from "./types";

// Who a manager loses, as CM's Injuries and Bans: his own men and his next opponent's, each said as whose.

/** The subject, as a back-page headline: "Palmer a doubt for GW6". Surname and `GW` keep it on one row at 390.
 *  No gameweek for a man who has left, or a doubt with no chance against it: neither is about one gameweek. */
function headline(note: AvailabilityNote, gameweek: number | null): string {
  if (note.state === "unavailable") return `${note.playerName} unavailable`;
  const state = !note.out ? "a doubt" : note.state === "suspended" ? "banned" : "out";
  const dated = gameweek !== null && (note.out || note.chance !== null);
  return dated ? `${note.playerName} ${state} for GW${gameweek}` : `${note.playerName} ${state}`;
}

/** The squad the letter is about, only for the opponent's man, since "The FA" belongs to nobody; null for his own. */
function doubtAbout(side: Side, who: string, gameweek: number | null): string | null {
  if (side !== "opponent") return null;
  return gameweek === null ? `${who}, your next opponent` : `${who}, your gameweek ${gameweek} opponent`;
}

/** The doubts worth a manager's attention, his and his next opponent's, in FPL's own untruncated words and dated
 *  by FPL's own stamp; a note with no stamp falls back to its round. */
export function availabilityNews(
  notes: readonly AvailabilityNote[],
  /** The round these doubts bear on: the next one a manager can still pick for. */
  gameweek: number | null,
  squads: {
    /** The reader's own team, or null for a reader who has not signed in. */
    mine: string | null;
    /** Who he plays next, or null when the fixture is not known. */
    opponent: string | null;
    /** A team's name by id, injected because this module may not hold the league. */
    name: (teamId: string) => string | null;
  },
): InboxItem[] {
  return notes.flatMap((note) => {
    // A signed-out reader keeps the whole league's: he has no team to filter to, and the list is public news.
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
    // Never a man nobody holds: a free agent's news belongs on the pool.
    if (note.teamId === null) return [];

    const who = squads.name(note.teamId) ?? "Another manager";

    return [
      {
        // The team is in the id because `web_name` is not unique: one id for two men repeats a React key.
        id: `doubt:${note.teamId}:${note.playerName}`,
        category: "injury" as const,
        // FPL's stamp for the line; null falls back to the round.
        at: note.newsAt,
        gameweek,
        headline: headline(note, gameweek),
        body: doubtLetter(note, gameweek, side, who),
        from: doubtFrom(note, side, who),
        about: doubtAbout(side, who, gameweek),
        teamId: note.teamId,
        // The football layer's own word and its own certainty.
        mark: { label: note.label, out: note.out, band: doubtBand(note) },
        // His own man, certainly out: the row he must act on. An opponent's loss is news, not bad news.
        urgent: note.out && side === "mine",
      },
    ];
  });
}
