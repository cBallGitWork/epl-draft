import type { StoryFace } from "../face";
import type { MatchupContext } from "./brief";
import { counted } from "./state";

// The draft report's cover: one photograph for the article, of the lead match-up's key man, printed through the ink by
// the page (Craig, 30 Sep 2026: "remove those thumbnails, i mean as a cover photo for an article"). The desk's choice.

/** The lead match-up's key man: the first man of its story's cast; without one, the winner's top scorer, both sides'
 *  when level; null when nobody has points. */
export function draftFace(contexts: readonly MatchupContext[]): StoryFace | null {
  const lead = contexts[0];
  if (lead === undefined) return null;
  const { home, away, margin } = lead.state;
  const men = margin > 0 ? counted(home) : margin < 0 ? counted(away) : [...counted(home), ...counted(away)];
  const best =
    lead.angle?.cast[0] ??
    men.filter((m) => m.points !== null && m.points > 0).sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || a.name.localeCompare(b.name))[0];
  return best === undefined ? null : { code: best.code, name: best.name, clubId: best.clubId, position: best.slot };
}
