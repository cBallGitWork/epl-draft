import { FANTRAX_LEAGUE_ID, FITNESS_DAYS, MS_PER_DAY, fetchPlayerStories, fplCodeOf, isActive, isResolved, mapPlayerStories, type Fixture, type PlayerStory, type ReportMan } from "@epl/core";
import { BRIDGE } from "./bridge";
import type { DeskFacts } from "./facts";
import { involves } from "./round";

// The league's side of a match report: who holds each footballer at the match's period, his points, and the club's word on him.

interface LeagueJoin {
  holders: Map<number, NonNullable<ReportMan["holder"]>>;
  points: Map<number, number>;
  fantraxIds: Map<number, string>;
}

/** Holders from every slot, fielded from the active ones; points only where his club plays once in the period. */
export function leagueJoin(facts: DeskFacts, periodFixtures: readonly Fixture[], clubOfCode: ReadonlyMap<number, number>): LeagueJoin {
  const holders = new Map<number, NonNullable<ReportMan["holder"]>>();
  // Each side's head-to-head this gameweek, by team name: the stake a mate in the league would give.
  const h2h = new Map<string, NonNullable<NonNullable<ReportMan["holder"]>["h2h"]>>();
  const over = periodFixtures.length > 0 && periodFixtures.every((f) => f.status === "finished");
  for (const { home, away } of facts.pairings) {
    const score = (id: string) => facts.scores.get(id)?.points ?? null;
    h2h.set(home.name, { opponent: away.name, us: score(home.teamId), them: score(away.teamId), over });
    h2h.set(away.name, { opponent: home.name, us: score(away.teamId), them: score(home.teamId), over });
  }
  const points = new Map<number, number>();
  const fantraxIds = new Map<number, string>();
  for (const fantraxId of Object.keys(BRIDGE)) {
    const code = fplCodeOf(BRIDGE, fantraxId);
    if (code !== null) fantraxIds.set(code, fantraxId);
  }
  const matchesOf = (clubId: number) => periodFixtures.filter((f) => involves(f, clubId)).length;
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

/** Fantrax's stories on one man, none when they cannot be read. */
export const storiesOn = (fantraxId: string): Promise<PlayerStory[]> => fetchPlayerStories(FANTRAX_LEAGUE_ID, fantraxId).then(mapPlayerStories).catch(() => []);

/** The headline of the first story published after a match kicked off and within a few days of it, and by `until` when
 *  one is given; null when there is none. */
export function firstStoryAfter(stories: readonly PlayerStory[], kickoff: string, until = Infinity): string | null {
  const from = Date.parse(kickoff);
  const last = Math.min(from + FITNESS_DAYS * MS_PER_DAY, until);
  return stories.filter((s) => s.at !== null && s.at > from && s.at <= last).sort((a, b) => (a.at ?? 0) - (b.at ?? 0))[0]?.headline ?? null;
}

/** Fantrax's first story on each man taken off injured, published after the match and within a few days of it. */
export async function fitnessAfter(codes: readonly number[], kickoff: string, fantraxIds: ReadonlyMap<number, string>): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  await Promise.all(
    codes.map(async (code) => {
      const id = fantraxIds.get(code);
      if (id === undefined) return;
      const story = firstStoryAfter(await storiesOn(id), kickoff);
      if (story !== null) out.set(code, story);
    }),
  );
  return out;
}
