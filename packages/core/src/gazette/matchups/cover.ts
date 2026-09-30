import type { StoryFace } from "../face";
import type { MatchupContext } from "./brief";
import type { DraftMan } from "./types";

// The draft report's cover: one photograph for the article, of the lead match-up's key man, printed through the ink by
// the page (Craig, 30 Sep 2026: "remove those thumbnails, i mean as a cover photo for an article"). The desk's choice.

/** The men who counted for a side: its eleven less any man a reserve came on for, and the reserves certain to. */
function counted(side: MatchupContext["state"]["home"]): DraftMan[] {
  const certain = side.subs.filter((s) => !s.provisional);
  return [...side.side.eleven.filter((m) => !certain.some((s) => s.out === m)), ...certain.map((s) => s.in)];
}

/** The lead match-up's key man: the winner's top scorer, both sides' when level; null when nobody has points. */
export function draftFace(contexts: readonly MatchupContext[]): StoryFace | null {
  const lead = contexts[0];
  if (lead === undefined) return null;
  const { home, away, margin } = lead.state;
  const men = margin > 0 ? counted(home) : margin < 0 ? counted(away) : [...counted(home), ...counted(away)];
  const best = men
    .filter((m) => m.points !== null && m.points > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || a.name.localeCompare(b.name))[0];
  return best === undefined ? null : { code: best.code, name: best.name, clubId: best.clubId, position: best.slot };
}
