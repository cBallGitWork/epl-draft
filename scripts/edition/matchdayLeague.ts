import { FANTRAX_LEAGUE_ID, fetchPlayerStories, isActive, isResolved, mapPlayerStories, type Fixture, type ReportMan } from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";
import type { DeskFacts } from "./facts";

// The league's side of a match report: who holds each footballer at the match's period, his points, and the club's word on him.

export interface LeagueJoin {
  holders: Map<number, NonNullable<ReportMan["holder"]>>;
  points: Map<number, number>;
  fantraxIds: Map<number, string>;
}

/** Holders from every slot, fielded from the active ones; points only where his club plays once in the period. */
export function leagueJoin(facts: DeskFacts, periodFixtures: readonly Fixture[], clubOfCode: ReadonlyMap<number, number>): LeagueJoin {
  const holders = new Map<number, NonNullable<ReportMan["holder"]>>();
  // Each side's head-to-head this period, by team name: the stake a mate in the league would give.
  const h2h = new Map<string, { opponent: string; us: number | null; them: number | null }>();
  for (const { home, away } of facts.pairings) {
    const score = (id: string) => facts.scores.get(id)?.points ?? null;
    h2h.set(home.name, { opponent: away.name, us: score(home.teamId), them: score(away.teamId) });
    h2h.set(away.name, { opponent: home.name, us: score(away.teamId), them: score(home.teamId) });
  }
  const points = new Map<number, number>();
  const fantraxIds = new Map<number, string>();
  for (const [fantraxId, entry] of Object.entries(mapping as unknown as Record<string, { fplCode: number | null }>)) {
    if (entry.fplCode !== null) fantraxIds.set(entry.fplCode, fantraxId);
  }
  const matchesOf = (clubId: number) => periodFixtures.filter((f) => f.homeClubId === clubId || f.awayClubId === clubId).length;
  for (const team of facts.teams) {
    for (const man of team.players.filter(isResolved)) {
      holders.set(man.player.code, { team: team.teamName, fielded: isActive(man.slot), round: facts.pedigree.get(man.slot.fantraxId)?.round ?? null, h2h: h2h.get(team.teamName) ?? null });
      const clubId = clubOfCode.get(man.player.code);
      const scored = facts.playerPoints.get(man.slot.fantraxId);
      if (scored !== undefined && clubId !== undefined && matchesOf(clubId) === 1) points.set(man.player.code, scored);
    }
  }
  return { holders, points, fantraxIds };
}

const FITNESS_DAYS = 5;

/** Fantrax's first story on each man taken off injured, published after the match and within a few days of it. */
export async function fitnessAfter(codes: readonly number[], kickoff: string, fantraxIds: ReadonlyMap<number, string>): Promise<Map<number, string>> {
  const from = Date.parse(kickoff);
  const until = from + FITNESS_DAYS * 24 * 60 * 60 * 1000;
  const out = new Map<number, string>();
  await Promise.all(
    codes.map(async (code) => {
      const id = fantraxIds.get(code);
      if (id === undefined) return;
      const stories = await fetchPlayerStories(FANTRAX_LEAGUE_ID, id).then(mapPlayerStories).catch(() => []);
      const story = stories.filter((s) => s.at !== null && s.at > from && s.at <= until).sort((a, b) => (a.at ?? 0) - (b.at ?? 0))[0];
      if (story !== undefined) out.set(code, story.headline);
    }),
  );
  return out;
}
