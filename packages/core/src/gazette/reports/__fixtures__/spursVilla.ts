import type { RawPlEvent, RawPlFixture } from "../../../football/premierleague/raw";
import type { RawPlMatchStats } from "../../../football/premierleague/rawStats";
import { plMoments } from "../../../football/premierleague/moments";
import { plPlayerCodes, plTeamSheets } from "../../../football/premierleague/teamSheet";
import type { Club, Fixture } from "../../../football/types";
import detail from "../../../football/__fixtures__/plFixtureSpursVilla.json";
import stream from "../../../football/__fixtures__/plTextstreamSpursVilla.json";
import stats from "../../../football/__fixtures__/plMatchStatsSpursVilla.json";
import { sideFigures } from "../figures";
import { lineupOf } from "../lineups";
import { reportMen, type MenExtras } from "../men";
import type { ReportMatchInput } from "../types";

// Tottenham 2-3 Aston Villa, gameweek 5, from the recorded payloads. Opta's own player digits stand in for FPL codes.

export const sheet = detail as unknown as RawPlFixture;
export const matchStats = stats as unknown as RawPlMatchStats;
const people = (sheet.teamLists ?? []).flatMap((list) => (list === null ? [] : [...list.lineup, ...list.substitutes]));
export const optaToCode = new Map(people.flatMap((man) => (man.altIds?.opta === undefined ? [] : [[man.altIds.opta, Number(man.altIds.opta.slice(1))] as const])));
export const codes = plPlayerCodes(sheet, optaToCode);
export const moments = plMoments((stream as unknown as { events: { content: RawPlEvent[] } }).events.content, codes);
export const sheets = plTeamSheets(sheet, optaToCode)!;
export const codeOf = (surname: string): number => {
  const found = [...sheets.home.lineup, ...sheets.home.substitutes, ...sheets.away.lineup, ...sheets.away.substitutes].find((m) => m.name.endsWith(surname));
  if (found?.code == null) throw new Error(`no ${surname}`);
  return found.code;
};

export const SPURS: Club = { id: 18, code: 6, name: "Spurs", shortName: "TOT" };
export const VILLA: Club = { id: 2, code: 7, name: "Aston Villa", shortName: "AVL" };

export const fixture: Fixture = {
  id: 48, code: 2645244, gameweek: 5, homeClubId: 18, awayClubId: 2, kickoff: "2026-09-19T11:30:00Z",
  homeScore: 2, awayScore: 3, status: "finished", settled: true, minutes: 90, homeDifficulty: null, awayDifficulty: null,
};

export const noExtras: MenExtras = { live: new Map(), season: new Map(), holders: new Map(), points: new Map(), fitness: new Map() };

export function spursVilla(extras: Partial<MenExtras> = {}): ReportMatchInput {
  return {
    fixture,
    home: { code: 6, name: "Tottenham Hotspur", shorts: ["Spurs", "Tottenham"], manager: "Roberto De Zerbi" },
    away: { code: 7, name: "Aston Villa", shorts: ["Villa"], manager: "Unai Emery" },
    halfTime: { home: 0, away: 1 },
    referee: "Samuel Barrott",
    moments,
    men: reportMen(sheets, moments, { ...noExtras, ...extras }),
    figures: { home: sideFigures(matchStats, 21)!, away: sideFigures(matchStats, 2)! },
    videoId: "EJRLVTD7PVQ",
    venue: "Tottenham Hotspur Stadium",
    attendance: 60920,
    lineups: { home: lineupOf(sheets.home, moments), away: lineupOf(sheets.away, moments) },
    marks: new Map(),
  };
}
