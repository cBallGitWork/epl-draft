import { MATCH } from "../../routes";

// One match's screens and the address of each — CM's `cm9900/22.jpg` strip, in Craig's order (23 Sep 2026).

export const MATCH_TABS = [
  { segment: "", label: "Overview", key: "overview" },
  { segment: "/players", label: "Line Ups", key: "players" },
  // Both sides, each club's men and the Fantasy Report, switched by the foot row.
  { segment: "/stats", label: "Stats", key: "stats" },
  // Shots and average positions, where CM keeps them.
  { segment: "/zones", label: "Action Zones", key: "zones" },
  { segment: "/highlights", label: "Highlights", key: "highlights" },
] as const;

export type MatchTab = (typeof MATCH_TABS)[number]["key"];

/** A tab of one match with its query; an undefined value is the view's default and stays out of the URL. */
export function matchHref(id: number, tab: MatchTab, query: Record<string, string | undefined> = {}): string {
  const segment = MATCH_TABS.find((entry) => entry.key === tab)?.segment ?? "";
  const set = Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined);
  const search = new URLSearchParams(set).toString();
  return `${MATCH}/${id}${segment}${search === "" ? "" : `?${search}`}`;
}
