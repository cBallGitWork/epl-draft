import { DRAFT_WRITING, type AngleRecord, type Cutoff, type PastProse, type StoryDraftReport } from "@epl/core";
import { readArchive } from "./persist";

// The draft reports filed before this one, newest first: the last few, and at the end of a gameweek its own Saturday's,
// so a side's story, a phrase or a headline is not told the same way twice (Craig, 29 Sep 2026: no repeated narratives).

interface PastDraft {
  headline: string;
  draft: StoryDraftReport;
}

export function draftPast(gameweek: number, cutoff: Cutoff): PastDraft[] {
  const before = (d: StoryDraftReport) => d.gameweek < gameweek || (cutoff === "gameweek" && d.gameweek === gameweek && d.cutoff === "saturday");
  return readArchive("draft-report")
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .flatMap((s) => (s.extras?.draft !== undefined && before(s.extras.draft) ? [{ headline: s.headline, draft: s.extras.draft }] : []))
    .slice(0, DRAFT_WRITING.pastReports);
}

/** Each filed match-up's words, which a new report about either side may not echo. */
export const pastProse = (past: readonly PastDraft[]): PastProse[] =>
  past.flatMap((p) => p.draft.matchups.map((m) => ({ teamIds: [m.home.teamId, m.away.teamId], prose: [m.standfirst, ...m.paragraphs].join("\n") })));

/** Every side's stories in those reports, newest first: the first that names a side is its last. */
export const pastAngles = (past: readonly PastDraft[]): AngleRecord[] => past.flatMap((p) => p.draft.matchups.flatMap((m) => (m.story === null ? [] : [m.story])));
