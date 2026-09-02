import type { RosteredTeam } from "../join/roster";
import { isResolved } from "../join/roster";
import type { NewsItem } from "../news/map";

// Which wire items are OUR story: the ones naming a man somebody in the league
// holds.
//
// **This is the one place a name is matched at runtime, and the boundary is
// the whole point.** `fantrax-adapter.md` forbids runtime name-matching
// because identity must come through the audited bridge — and it still does:
// every player here arrives already resolved, and nothing this function
// decides is ever persisted. A match only chooses whether to spend a model
// call on an item whose key is the ARTICLE's URL. Get it wrong and the paper
// covers a story nobody cares about, or misses one; get identity wrong through
// the bridge and the paper tells the league the wrong man is injured.
//
// Recorded as an exception in PLATFORM_NOTES, with this boundary named.

/** Surnames below this length are not matched: "Son" would hit "season", and
 *  a wire is mostly prose about seasons. */
const SHORTEST_SURNAME = 4;

export interface Affected {
  playerName: string;
  ownerName: string;
}

/** Everyone in the league this item appears to be about. Empty is the ordinary
 *  answer — most football news is about nobody we hold, and an item with no
 *  stake in it is not filed. */
export function affectedBy(item: NewsItem, teams: readonly RosteredTeam[]): Affected[] {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const found: Affected[] = [];

  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered)) continue;
      const surname = lastWord(rostered.player.name);
      if (surname.length < SHORTEST_SURNAME) continue;
      // Word-bounded: "Munoz" must not match inside another word, and a
      // headline's punctuation is not a letter.
      if (!new RegExp(`\\b${escape(surname)}\\b`).test(text)) continue;
      found.push({ playerName: rostered.player.name, ownerName: team.teamName });
    }
  }

  return found;
}

function lastWord(name: string): string {
  const parts = name.toLowerCase().split(/\s+/).filter((part) => part !== "");
  return parts[parts.length - 1] ?? "";
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
