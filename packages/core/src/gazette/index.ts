// The newspaper's facts. Pure builders, each returning what it can honestly say
// and nothing when it can say nothing — CODE_RULES §5 names gazette section
// builders as a place purity is not negotiable.
//
// A type nested inside these is exported only once something outside core names it.

export { availability } from "./availability";
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
  buildWireBrief,
} from "./briefs/columns";
export { buildNewsBrief } from "./briefs/news";
export { buildPresserBrief } from "./briefs/presser";
export type { PresserLine } from "./briefs/presser";
export { affectedBy } from "./newsTriage";
export type { NewsAngle } from "./briefs/news";
export type { Affected } from "./newsTriage";
export { dodgers } from "./dodgers";
export { powerRows } from "./powerRanking";
export { wireFacts } from "./wire";
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
export { newsdesk, roundSlot } from "./newsdesk";
export { predictedLineups } from "./predictedXi";
export type { StoryFixture, StoryLineupMan, StoryLineupSide } from "./extras";
export { bothSides, fixtureStakes } from "./relevance";
export { tieState } from "./tieState";
export type { Assignment, DeskState, DeskTie } from "./newsdesk";
export type { FixtureStake, TieStake } from "./relevance";
export type { TieState } from "./tieState";
export { normalizePaper, normalizeStory } from "./story";
export { decided, stories } from "./stories";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type { Ledger, StoryThread, ThreadUpdate } from "./ledger";
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

export { fullClubName, shortClubName } from "./clubNames";

// Team news at the lock: each side's sheet, what changed, the brief, the editor and the column.
export { sheetOf } from "./sheets/sheet";
export { sheetsFacts } from "./sheets/facts";
export { buildSheetsBrief } from "./briefs/sheets";
export { SHEETS_OPINION, checkSheets } from "./sheets/checks";
export { SHEETS_AMERICAN, SHEETS_LEXICON, SHEETS_STOCK } from "./sheets/words";
export { mergeSheets, readSheetsDraft } from "./sheets/draft";
export { assembleSheets } from "./sheets/column";
export type { Sheet } from "./sheets/sheet";
export type { TieFacts } from "./sheets/facts";
export type { SheetsDraft } from "./sheets/column";
export type { StorySheetMan, StorySheetSide } from "./sheets/cargo";

// Lawro's predictions: the calls, the record, his past, the brief, and the editor that reads him.
export { buildLawroBrief } from "./briefs/predictions";
export { callTie } from "./predictions/pick";
export { predictionSide } from "./predictions/sides";
export { squadMen } from "./predictions/squad";
export { predictionRecord } from "./predictions/record";
export { LAWRO_CORE, pastOffered } from "./predictions/past";
export { LAWRO_BANNED, LAWRO_CAPPED, NEVER_CATEGORIES } from "./predictions/words";
export { checkLawro, tieKey } from "./predictions/checks";
export { SHAPES, applySkit } from "./predictions/skit";
export { assembleLawro, mergeAttempts, readDraft } from "./predictions/column";
export type { PredictionsTie } from "./briefs/predictions";
export type { RecentGame, SideForm } from "./predictions/sides";
export type { Marked } from "./predictions/record";
export type { CheckContext, Fault, LawroDraft } from "./predictions/checks";
export { buildReportsBrief } from "./reports/brief";
export { deskDay } from "./reports/desk";
export type { MatchDesk } from "./reports/desk";
export { reportMen } from "./reports/men";
export type { LiveLine, MenExtras, SeasonLine } from "./reports/men";
export { sideFigures } from "./reports/figures";
export { surname } from "./reports/keyStats";
export type { ReportClub, ReportDayInput, ReportMan, ReportMatchInput, SideFigures } from "./reports/types";
export { checkReports } from "./reports/checks";
export type { ReportsCheck } from "./reports/checks";
export { correct, matchOf, mergeReports, readReportsDraft } from "./reports/draft";
export type { ReportPiece, ReportSection, ReportsDraft } from "./reports/draft";
export { FAN_TAGS, fanBrief, fanFaults } from "./reports/fan";
export { matchBlock } from "./reports/brief";
export { REPORT_NEVER } from "./reports/style";
export {
  REPORT_ADVICE, REPORT_AMERICAN, REPORT_CAPPED_DAY, REPORT_CAPPED_MATCH, REPORT_FANTASY, REPORT_FPL,
} from "./reports/words";
