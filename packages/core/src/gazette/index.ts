// The newspaper's facts: pure builders that return nothing when there is nothing to say.
// A nested type is exported only once something outside core names it.

export { availability } from "./availability";
export { nextDeadline } from "./deadline";
export { deals } from "./deals";
export { kindOf, moverOf, movement } from "./dealSides";
export { strangers } from "./strangers";
export { hasRoom } from "./running";
export { buildPresserBrief, stillOut } from "./briefs/presser";
export { presserClubs, teamSheetExpect } from "./briefs/presserClubs";
export type { TeamSheetExpect } from "./briefs/presserClubs";
export type { PresserLine } from "./briefs/presser";
export { standingHeadlines } from "./briefs/standing";
export { AMERICAN, BANNED, banned } from "./banned";
export { NEWS_GAPS, teamSheetGaps, unbackedFit } from "./teamSheetChecks";
export { MAX_PAPER_STORIES, composePaper } from "./frontPage";
export { isCovered, normalizeLedger, recordCoverage } from "./ledger";
export { newsdesk, roundSlot } from "./newsdesk";
export { predictedLineups } from "./predictedXi";
export type { LineupStatus, StoryFixture, StoryLineupMan, StoryLineupSide } from "./extras";
export type { Assignment, DeskState } from "./newsdesk";
export { normalizePaper, normalizeStory } from "./story";
export { stories } from "./stories";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type { Ledger, StoryThread, ThreadUpdate } from "./ledger";
export { STORY_KINDS } from "./story";
export { STAFF_WRITERS, writerOf } from "./staff";
export type { PublishedStory, StoryKind } from "./story";
export type { StoryFace } from "./face";
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

export { fullClubName, shortClubNames } from "./clubNames";

// Team news at the lock: each side's sheet, what changed, the brief, the editor and the column.
export { fullPrintName, sheetOf, ukSpelling } from "./sheets/sheet";
export { debuts } from "./sheets/changes";
// The draft desk's surface is what its script reads; its other parts are inferred at the call sites.
export { everyMan, matchupState } from "./matchups/state";
export type { MatchupState } from "./matchups/state";
export { goingIn, gameweekForm } from "./matchups/form";
export type { SeasonFact } from "./matchups/form";
export { tableAfter, tableBefore, tableMoves, tablePoints } from "./matchups/table";
export { meetingsWon, oldBoys } from "./matchups/meetings";
export type { FormerSide } from "./matchups/meetings";
export type { DayPoints, DraftMan, DraftSide, GoalTime, SlotWorth } from "./matchups/types";
export { buildDraftBrief, draftBlocks } from "./matchups/brief";
export { judgePage, type AngleRecord } from "./matchups/angle";
export { threadsOf } from "./matchups/threads";
export { headlineEcho } from "./matchups/echo";
export { unbriefedNames, type PastProse } from "./matchups/listChecks";
export { applyFactFixes, knownFixes, readFactFixes } from "./matchups/factCheck";
export type { Thread } from "./matchups/thread";
export { checkDraft } from "./matchups/checks";
export { draftCargo } from "./matchups/cargo";
export { draftFace } from "./matchups/cover";
export type { StoryDraftMatchup, StoryDraftReport, StoryDraftSide } from "./matchups/cargo";
export { stepLabel, type StoryDraftStep } from "./matchups/days";
export { benchText, lineupText, returnText, rowNote, type StoryDraftReturn, type StoryDraftRow } from "./matchups/elevens";
export { mergeDraft, matchupOf, readDraftWriting } from "./matchups/writing";
export { DRAFT_FORECAST, DRAFT_FRAMES, DRAFT_LABELS, DRAFT_NEVER } from "./matchups/words";
export { applyFixes as applyDraftFixes, faultySentences as faultyDraftSentences } from "./matchups/lineEdit";
export type { Cutoff, MatchupContext, NextOpponent, TablePlace } from "./matchups/brief";
export { draftReportsDue, isSaturday } from "./matchups/due";
export { priceOf } from "./matchups/worth";
export { sheetsFacts } from "./sheets/facts";
export { buildSheetsBrief } from "./briefs/sheets";
export { SHEETS_OPINION, checkSheets } from "./sheets/checks";
export { SHEETS_AMERICAN, SHEETS_LEXICON, SHEETS_STOCK } from "./sheets/words";
export { mergeSheets, readSheetsDraft } from "./sheets/draft";
export { assembleSheets } from "./sheets/column";
export type { Sheet, SheetMan } from "./sheets/sheet";
export type { TieFacts } from "./sheets/facts";
export type { SheetsDraft } from "./sheets/column";
export type { StorySheetSide } from "./sheets/cargo";

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
export type { SeasonLine } from "./reports/men";
export { sideFigures } from "./reports/figures";
export { surname } from "./reports/keyStats";
export type { HeadToHeadStake, ReportDayInput, ReportMan, ReportMatchInput } from "./reports/types";
export { checkReports } from "./reports/checks";
export { correct, matchOf, mergeReports, plainHead, readReportsDraft } from "./reports/draft";
export type { ReportsDraft } from "./reports/draft";
export { FAN_TAGS, fanBrief, fanFaults, fanHeadline } from "./reports/fan";
export { matchBlock } from "./reports/brief";
export { REPORT_NEVER } from "./reports/style";
export {
  REPORT_ADVICE, REPORT_AMERICAN, REPORT_CAPPED_DAY, REPORT_CAPPED_MATCH, REPORT_FANTASY, REPORT_FPL,
} from "./reports/words";
export { plainStandfirst, reportsCargo } from "./reports/cargo";
export type { StoryReport, StoryReportSide } from "./reports/cargo";
export { reportDays } from "./reports/due";
export { lineupOf } from "./reports/lineups";
export type { StoryLineup } from "./reports/lineups";
export type { FantasyMan } from "./reports/fantasy";
export { strike, survivors } from "./reports/headline";
export { applyFixes, faultySentences } from "./reports/lineEdit";
export { punBrief } from "./reports/headline";
export { readHeadlines } from "./reports/draft";
export { weaveBrief } from "./reports/weave";
export { binXi } from "./binXi/select";
export { binStandfirst, buildBinBrief } from "./binXi/brief";
export { binMen, fplWeeks } from "./binXi/men";
export { binHistory, undrafted } from "./binXi/history";
export type { BinMatch } from "./binXi/brief";
export { binKeyStats } from "./binXi/keyStats";
export { checkBin } from "./binXi/checks";
export type { StoryBin } from "./binXi/cargo";

// Lawro's power rankings: the squads as drafted, ranked by the season played out, every call made in code.
export { seasonMan } from "./season/men";
export { playSeason } from "./season/play";
export { seasonCalls } from "./season/calls";
export { buildSeasonBrief } from "./season/brief";
export { checkSeason, lineKey } from "./season/checks";
export { assembleSeason, mergeSeason, readSeasonDraft } from "./season/column";
export { readMoves } from "./season/editor";
export type { CallMan, SeasonCalls } from "./season/calls";
export type { EditorMove } from "./season/editor";
export type { SeasonDraft } from "./season/checks";
export type { PlayedSeason, SeasonSquad } from "./season/play";
