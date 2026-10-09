import { instantOf, londonDate, londonTime } from "../time";
import type { InboxItem } from "./types";

// The round, and the merge that orders the whole inbox. Each builder takes only its own source; the app edge assembles.

/** One round of our competition, as CM's Competitions tab: when it locks, and how the reader's own tie finished. */
export function roundNews({
  gameweek,
  deadline,
  yours,
}: {
  gameweek: number | null;
  /** The NEXT lock with the round it belongs to, which is often not the round in view. */
  deadline: { gameweek: number; locksAt: string } | null;
  /** The reader's own finished ties: none while unplayed or for a bye, two in a double header. */
  yours: readonly { opponent: string; points: number | null; against: number | null }[];
}): InboxItem[] {
  const items: InboxItem[] = [];

  if (deadline !== null) {
    items.push({
      id: `deadline:${deadline.gameweek}`,
      category: "competition",
      at: deadline.locksAt,
      gameweek: deadline.gameweek,
      headline: `Gameweek ${deadline.gameweek} lineups lock`,
      // The commissioner texting the group; the time is `locksAt`'s, in London, as the masthead prints it.
      body: `Lineups lock at ${londonTime(deadline.locksAt)} on ${londonDate(deadline.locksAt)}. Anyone left on your bench won't score, so get your team sorted before then.`,
      // The one item that comes from a person: the league's rules are his.
      from: "The commissioner",
      about: null,
      teamId: null,
      mark: null,
      urgent: false,
    });
  }

  for (const [at, tie] of yours.entries()) {
    if (gameweek === null || tie.points === null || tie.against === null) continue;
    const won = tie.points > tie.against;
    const drawn = tie.points === tie.against;
    items.push({
      // The first keeps the id a single tie always had, so a read result stays read.
      id: at === 0 ? `result:${gameweek}` : `result:${gameweek}:${tie.opponent}`,
      category: "competition",
      at: null,
      gameweek,
      // A sentence, never a results-table row.
      headline: won
        ? `You beat ${tie.opponent} in gameweek ${gameweek}`
        : drawn
          ? `You drew with ${tie.opponent} in gameweek ${gameweek}`
          : `${tie.opponent} beat you in gameweek ${gameweek}`,
      // The score as a letter says it.
      body: won
        ? `You won it ${tie.points} to ${tie.against}.`
        : drawn
          ? `${tie.points} apiece.`
          : `${tie.against} to ${tie.points}.`,
      from: "The league",
      about: null,
      teamId: null,
      mark: null,
      // A defeat is bad news about you, which is what CM's red ground is for.
      urgent: !won && !drawn,
    });
  }

  return items;
}

/** The inbox: dated items newest first, then undated ones (the round's result) in their builders' order. */
export function inboxItems(...groups: readonly InboxItem[][]): InboxItem[] {
  const keyed = groups.flat().map((item) => ({ item, key: item.at === null ? null : instantOf(item.at) }));
  const dated = keyed.filter((row) => row.key !== null);
  const undated = keyed.filter((row) => row.key === null);
  dated.sort((a, b) => (b.key ?? 0) - (a.key ?? 0));
  return [...dated, ...undated].map((row) => row.item);
}
