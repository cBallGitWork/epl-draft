import type { RosteredTeam } from "../join/roster";
import { isResolved } from "../join/roster";
import type { NewsItem } from "../news/map";
import { escapeRegExp } from "../regExp";

// Which news items name a man somebody holds. The one runtime name-match, a recorded exception: players arrive
// resolved through the bridge, nothing is persisted, and a match only decides whether to spend a model call.

/** Surnames shorter than this are not matched: "Son" would hit "season". */
const SHORTEST_SURNAME = 4;

export interface Affected {
  playerName: string;
  ownerName: string;
}

/** Every rostered man this item appears to be about, with his owner; usually empty. */
export function affectedBy(item: NewsItem, teams: readonly RosteredTeam[]): Affected[] {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const found: Affected[] = [];

  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered)) continue;
      const surname = lastWord(rostered.player.name);
      if (surname.length < SHORTEST_SURNAME) continue;
      // Whole words only.
      if (!new RegExp(`\\b${escapeRegExp(surname)}\\b`).test(text)) continue;
      found.push({ playerName: rostered.player.name, ownerName: team.teamName });
    }
  }

  return found;
}

function lastWord(name: string): string {
  const parts = name.toLowerCase().split(/\s+/).filter((part) => part !== "");
  return parts[parts.length - 1] ?? "";
}
