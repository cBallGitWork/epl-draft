import { DRAFT_WRITING, FANTRAX_LEAGUE_ID, type AngleRecord, type Cutoff, type StoryDraftReport } from "@epl/core";
import { readArchive } from "./persist";

// The draft reports filed before this one, newest first: the last few, and at the end of a gameweek its own Saturday's,
// so a side's story, a phrase or a headline is not told the same way twice (Craig, 29 Sep 2026: no repeated narratives).

export interface PastDraft {
  headline: string;
  draft: StoryDraftReport;
}

export function draftPast(gameweek: number, cutoff: Cutoff): PastDraft[] {
  const before = (d: StoryDraftReport) => d.gameweek < gameweek || (cutoff === "gameweek" && d.gameweek === gameweek && d.cutoff === "saturday");
  return readArchive(FANTRAX_LEAGUE_ID, "draft-report")
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .flatMap((s) => (s.extras?.draft !== undefined && before(s.extras.draft) ? [{ headline: s.headline, draft: s.extras.draft }] : []))
    .slice(0, DRAFT_WRITING.pastReports);
}

/** Every side's stories in those reports, newest first: the first that names a side is its last. */
export const pastAngles = (past: readonly PastDraft[]): AngleRecord[] => past.flatMap((p) => p.draft.matchups.flatMap((m) => (m.story === null ? [] : [m.story])));
