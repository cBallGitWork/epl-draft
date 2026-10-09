import type {
  IntelCareers,
  IntelCups,
  CupTie,
  IntelClubPieces,
  IntelDepth,
  IntelMatch,
  IntelMatches,
  IntelPlayer,
  IntelSetPieces,
  IntelSquads,
  IntelStats,
  IntelShots,
  IntelStrength,
  IntelTouches,
  IntelXi,
  IntelProjections,
  IntelMinuteMoves,
  ExpectedMinutes,
  MinutesUpdate,
  ClubDepth,
  ClubStrength,
  Floors,
  IntelLines,
  PlayerLine,
  LeagueProjection,
  LeagueProjectionFile,
  StatsRow,
  Shot,
  TouchPlayer,
} from "@epl/core";
import { londonDayAndDate, careerIntel, cupIntel, depthIntel, leagueProjectionIntel, lineIntel, matchIntel, minuteMovesIntel, minutesIntel, playedFloor, shotIntel, squadIntel, statIntel, strengthIntel, touchIntel } from "@epl/core";
import squadsFile from "../../../data/intel/squads/26-27.json";
import xiFile from "../../../data/intel/xi/26-27.json";
import piecesFile from "../../../data/intel/set-pieces/26-27.json";
import matchesFile from "../../../data/intel/matches/26-27.json";
import touchesFile from "../../../data/intel/touches/26-27.json";
import shotsFile from "../../../data/intel/shots/26-27.json";
import strengthFile from "../../../data/intel/strength/26-27.json";
import leagueProjectionsFile from "../../../data/intel/league-projections/26-27.json";
import projectionsFile from "../../../data/intel/projections/26-27.json";
import type { IntelHistory } from "@epl/core";
import minuteMovesFile from "../../../data/intel/xmins-moves/26-27.json";
import careersFile from "../../../data/intel/careers/26-27.json";
import cupsFile from "../../../data/intel/cups/26-27.json";
import depthFile from "../../../data/intel/depth/26-27.json";
import statsFile from "../../../data/intel/stats/26-27.json";
import linesLastFile from "../../../data/intel/lines/25-26.json";
import linesNowFile from "../../../data/intel/lines/26-27.json";

// The sister repo's export, supplied to the app: core cannot read `data/`. Static imports bake each file into the
// build, so a commit carrying a new export redeploys (`data/intel` is outside vercel.json's ignored paths). Each file
// is asserted at this boundary, the JSON's literal type being too narrow, and narrowed inside core's mapper.

/** Every player the export carries, by FPL's season-stable code. */
export const intelSquads: Map<number, IntelPlayer> = squadIntel(
  squadsFile as unknown as IntelSquads,
);

/** The latest predicted elevens Scout has, as the export left them. Its round is `manifest.gameweek`. */
export const intelXi = xiFile as unknown as IntelXi;

/** Who takes each club's set pieces, by FPL short name. */
export const intelSetPieces = piecesFile as unknown as IntelSetPieces;

/** The three pieces the source ranks, penalties first; the key is the sister repo's spelling. */
export const SET_PIECES = [
  { key: "penalties", label: "Penalties" },
  { key: "freeKicks", label: "Direct free kicks" },
  { key: "corners", label: "Corners" },
] as const satisfies readonly { key: keyof IntelClubPieces; label: string }[];

/** Every match the sister repo has logged, by FPL's fixture id; a miss is ordinary, the log runs a day behind. */
export const intelMatches: Map<number, IntelMatch> = matchIntel(
  matchesFile as unknown as IntelMatches,
);

/** Where each man played, by FPL code, as the touches themselves; a miss is ordinary and means no map. */
export const intelTouches: Map<number, TouchPlayer> = touchIntel(
  touchesFile as unknown as IntelTouches,
);

/** Every man's shots, by FPL code, on the touches' convention: the exporter flips SofaScore's shots to match. */
export const intelShots: Map<number, Shot[]> = shotIntel(shotsFile as unknown as IntelShots);

/** Each club's Dixon-Coles attack and defence by FPL club code. */
export const intelStrength: Map<number, ClubStrength> = strengthIntel(strengthFile as unknown as IntelStrength);

/** The sister model's projection repriced in the scoring league's points, by player code at his best slot (`npm run draft-pack`). */
export const intelLeagueProjections: Map<number, LeagueProjection> = leagueProjectionIntel(
  leagueProjectionsFile as unknown as LeagueProjectionFile,
);

/** The sister model's xMins by FPL code and gameweek, its minutes only (`minutesIntel`); the manifest names its first week. */
export const intelMinutes: Map<number, ExpectedMinutes[]> = minutesIntel(projectionsFile as unknown as IntelProjections);
export const intelMinutesManifest = (projectionsFile as unknown as IntelProjections).manifest;
/** What each xMins export moved past the bar, oldest first (`npm run xmins-moves`): the scout's letters. */
export const intelMinuteMoves: MinutesUpdate[] = minuteMovesIntel(minuteMovesFile as unknown as IntelMinuteMoves);

/** The club each man was at in each season the sister's identity store holds, by FPL code. */
export const intelCareers: Map<number, Map<string, string>> = careerIntel(careersFile as unknown as IntelCareers);
/** Each club's cup and European ties by FPL club code, oldest first (`npm run intel-cups`). */
export const intelCups: Map<number, CupTie[]> = cupIntel(cupsFile as unknown as IntelCups);
/** Each club's depth chart by its three-letter label, and the export's manifest for its date. */
export const intelDepth: Map<string, ClubDepth> = depthIntel(depthFile as unknown as IntelDepth);
export const intelDepthManifest = (depthFile as unknown as IntelDepth).manifest;

/** The stats league's season counts by FPL code, for every man who has played (`npm run stats`). */
export const intelStats: Map<number, StatsRow> = statIntel(statsFile as unknown as IntelStats);
export const intelStatsManifest = (statsFile as unknown as IntelStats).manifest;
/** The London day the stats league's counts run to, as every "Season to" line prints it. */
export const intelStatsDay = londonDayAndDate(intelStatsManifest.exportedAt);
/** Each man's league season in totals by FPL code, last season's and this one's: what the attribute grid rates. */
export const intelLines: { last: Map<number, PlayerLine>; now: Map<number, PlayerLine> } = {
  last: lineIntel(linesLastFile as unknown as IntelLines),
  now: lineIntel(linesNowFile as unknown as IntelLines),
};
/** Each file's season, `"25-26"`, for the grid's heading. */
export const lineSeasons = {
  last: (linesLastFile as unknown as IntelLines).manifest.season,
  now: (linesNowFile as unknown as IntelLines).manifest.season,
};
/** The minutes a man needs in each season to count as playing it. */
export const lineFloors: Floors = { last: playedFloor(intelLines.last.values()), now: playedFloor(intelLines.now.values()) };

/** Each player's FPL history by code (`npm run intel-history`), loaded only when FPL will not answer: it runs to MBs. */
export async function intelHistory(): Promise<IntelHistory> {
  return (await import("../../../data/intel/history/26-27.json")).default as unknown as IntelHistory;
}
