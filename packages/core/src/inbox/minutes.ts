import type { MinutesUpdate } from "../football/intel/minuteMoves";
import { listed } from "../format";
import { londonWeekdayLong } from "../time";
import { NAMES_IN_HEADLINE } from "./messages";
import type { InboxItem } from "./types";

// The scout's minutes: one letter per xMins export that moved a man on the reader's side or his next opponent's by
// more than the bar (`XMINS_MOVE`, held when the update was recorded), for the coming gameweek only. Each man's own
// figure and nothing else: football has no depth chart, so a fall is never paired with another man's rise.

/** One team's men the letter may name: FPL code and the name a headline calls him. */
export interface MinutesSide {
  teamId: string;
  men: readonly { code: number; name: string }[];
}

export function minutesNews(
  updates: readonly MinutesUpdate[],
  {
    gameweek,
    sides,
    name,
    mine,
  }: {
    /** The gameweek the next lock closes; an update for any other is the past, and not written. */
    gameweek: number | null;
    /** The reader's side first, then his next opponent's. */
    sides: readonly MinutesSide[];
    /** A team's name as a letter opens a sentence with it. */
    name: (teamId: string) => string | null;
    mine: string | null;
  },
): InboxItem[] {
  if (gameweek === null || mine === null) return [];
  return updates.filter((update) => update.gameweek === gameweek).flatMap((update) => letter(update, sides, name, mine));
}

function letter(
  update: MinutesUpdate,
  sides: readonly MinutesSide[],
  name: (teamId: string) => string | null,
  mine: string,
): InboxItem[] {
  const moved = sides.map((side) => {
    const names = new Map(side.men.map((man) => [man.code, man.name]));
    const moves = update.moves.flatMap((move) => {
      const who = names.get(move.code);
      return who === undefined ? [] : [{ ...move, name: who }];
    });
    return { side, moves };
  });
  const all = moved.flatMap(({ moves }) => moves);
  if (all.length === 0) return [];

  const way = (move: { before: number; after: number }) => (move.after > move.before ? "up" : "down");
  const shown = all.slice(0, NAMES_IN_HEADLINE).map((move) => `${move.name} ${way(move)}`);
  const more = all.length - shown.length;
  const lines = moved
    .filter(({ moves }) => moves.length > 0)
    .map(({ side, moves }, at) => {
      const whose = side.teamId === mine ? "Yours" : `${name(side.teamId) ?? "Your opponent"}'s`;
      // The baseline is said once, on the first line.
      const when = at === 0 ? ` since ${londonWeekdayLong(update.since)}` : "";
      const said = moves.map((move) => `${move.name} ${way(move)} to ${move.after} from ${move.before}`);
      return `${whose}${when}: ${listed(said)}.`;
    });

  return [
    {
      id: `xmins:${update.at}`,
      category: "message",
      at: update.at,
      gameweek: update.gameweek,
      headline: `Gameweek ${update.gameweek} expected minutes: ${more > 0 ? `${shown.join(", ")} and ${more} more` : listed(shown)}`,
      body: lines.join(" "),
      from: "Your scout",
      about: null,
      teamId: mine,
      mark: null,
      // A fall in one of his own men's minutes is bad news about him; a rival's is not.
      urgent: moved.some(({ side, moves }) => side.teamId === mine && moves.some((move) => move.after < move.before)),
    },
  ];
}
