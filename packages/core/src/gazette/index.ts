// The newspaper's facts. Pure builders, each returning what it can honestly say
// and nothing when it can say nothing — CODE_RULES §5 names gazette section
// builders as a place purity is not negotiable.
//
// The types NESTED inside these — a story's two sides, a column's sections and
// ties, an eleven's lines, the brief's shape, a marked scorecard — are
// deliberately not here. Nothing outside core names them: a caller reaches them
// through the type that holds them, and exporting each one for the day somebody
// might is the speculation §1 forbids. Later can add them.

export { availability } from "./availability";
export { buildBrief } from "./brief";
export { nextDeadline } from "./deadline";
export { deals } from "./deals";
export { kindOf, movement } from "./dealSides";
export { strangers } from "./strangers";
export { hasRoom } from "./running";
export { buildFixturePreviewBrief } from "./briefs/fixturePreview";
export {
  buildDodgersBrief,
  buildElevenBrief,
  buildPowerBrief,
  buildPredictionsBrief,
  buildWireBrief,
} from "./briefs/columns";
export { buildNewsBrief } from "./briefs/news";
export { buildPresserBrief } from "./briefs/presser";
export type { PresserLine } from "./briefs/presser";
export { affectedBy } from "./newsTriage";
export type { NewsAngle } from "./briefs/news";
export type { Affected } from "./newsTriage";
export { dodgers } from "./dodgers";
export { markCalls, predictionTies } from "./predictions";
export { powerRows } from "./powerRanking";
export { wireFacts } from "./wire";
export type { Marked, PredictionTie } from "./predictions";
export type { PowerRow } from "./powerRanking";
export type { WireFacts } from "./wire";
export { buildMatchReportBrief } from "./briefs/matchReport";
// The two halves the report was missing: what happened and when, and the two or
// three figures a report can carry. Exported because the edition script builds
// them from the Premier League's own feed — the join is the script's, the shape
// is the brief's.
export type { MatchReportEvent, MatchReportSide } from "./briefs/matchReport";
export { buildTieCallBrief } from "./briefs/tieCall";
export { buildTieReportBrief } from "./briefs/tieReport";
export { standingHeadlines } from "./briefs/standing";
export { BANNED, banned } from "./banned";
export { MAX_PAPER_STORIES, composePaper } from "./frontPage";
export { isCovered, normalizeLedger, recordCoverage } from "./ledger";
export { newsdesk } from "./newsdesk";
export { bothSides, fixtureStakes } from "./relevance";
export { tieState } from "./tieState";
export type { Assignment, DeskState, DeskTie } from "./newsdesk";
export type { FixtureStake, TieStake } from "./relevance";
export type { TieState } from "./tieState";
export { markPreview, normalizePublished } from "./published";
export { normalizePaper, normalizeStory } from "./story";
export { decided, stories } from "./stories";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type { Ledger, StoryThread, ThreadUpdate } from "./ledger";
export type { EditionKind, PublishedEdition } from "./published";
export { STORY_KINDS } from "./story";
export type { PublishedPaper, PublishedStory, StoryFace, StoryKind } from "./story";
export type {
  AvailabilityNote,
  Deadline,
  Deal,
  DealSide,
  Pick,
  Story,
  StoryResult,
  TeamOfTheWeek,
} from "./types";
