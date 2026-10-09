import {
  FANTRAX_LEAGUE_ID,
  POOL_PAGE_SIZE,
  fetchPoolStats,
  fplCodeOf,
  mapPoolStats,
  playerByCode,
  tradeSlot,
  tradeStory,
  type Assignment,
  type FootballSnapshot,
  type LeagueInfo,
  type StoryFace,
  type Trade,
  type TradeFigures,
  type TradeStory,
} from "@epl/core";
import { BRIDGE } from "./bridge";
import type { Say } from "./newsroom";
import { ownerShort } from "./pressers";

// The reads behind Here We Go, made only when a trade is assigned: Fantrax's season points for the pool, and each man's
// goals and picture off FPL through the bridge.

export interface TradeJob extends TradeStory {
  face: StoryFace | null;
}

export async function hereWeGoDesk(input: {
  assignments: readonly Assignment[];
  trades: readonly Trade[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  say: Say;
}): Promise<Map<string, TradeJob>> {
  const { assignments, trades, info, snapshot, say } = input;
  const due = assignments.filter((each) => each.kind === "trade");
  if (due.length === 0) return new Map();

  // A refused points read costs the item its points, never the item.
  const pool = await fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE).then(mapPoolStats).catch(() => null);
  if (pool === null) say("  ⚠ trade: Fantrax would not give the season's points; the item files without them.");
  const points = new Map((pool?.rows ?? []).map((row) => [row.fantraxId, row.points]));
  const footballers = playerByCode(snapshot);
  const footballer = (fantraxId: string) => {
    const code = fplCodeOf(BRIDGE, fantraxId);
    return code === null ? undefined : footballers.get(code);
  };
  const figures = (fantraxId: string): TradeFigures => ({
    points: points.get(fantraxId) ?? null,
    goals: footballer(fantraxId)?.season.goals ?? null,
  });
  const teamName = (teamId: string) =>
    ownerShort({ teamId, teamName: info.teams.find((team) => team.teamId === teamId)?.name ?? teamId }) ?? teamId;

  const jobs = new Map<string, TradeJob>();
  for (const assignment of due) {
    const trade = trades.find((each) => tradeSlot(each).key === assignment.key);
    if (trade === undefined) continue;
    const story = tradeStory({ trade, teamName, figures, gameweek: assignment.round?.gameweek ?? null });
    const man = footballer(story.lead.fantraxId);
    const face = man === undefined ? null : { code: man.code, name: story.lead.playerName, clubId: man.clubId, position: story.lead.position?.split(",")[0] ?? null };
    jobs.set(assignment.key, { ...story, face });
  }
  return jobs;
}
