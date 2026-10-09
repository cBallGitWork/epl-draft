import { TEAM_STATS } from "../SectionNav";
import type { View } from "./Measures";

/** Where a head, a measure plate or a group plate leads: a group plate names no category, so the group's first
 *  heads it; the default measure is spelled as no parameter, one URL rather than two. */
export function boardHref(by: View, group: string, category?: string): string {
  const query = new URLSearchParams({ group });
  if (category !== undefined) query.set("cat", category);
  if (by !== "points") query.set("by", by);
  return `${TEAM_STATS}?${query.toString()}`;
}
