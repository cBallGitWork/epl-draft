import TabEmpty from "../../../components/league/TabEmpty";
import { defConScored, isResolved, playerName, type FootballPlayer } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { now } from "../../../clock";
import { getPlayerStats } from "../../../players/playerStats";
import { leagueScoring } from "../../../scoring";
import { statsLeaguePeriods, statsLeagueSeason } from "../../../statsLeague";
import StatBoard from "./StatBoard";
import { squadDefcon } from "./defcon";
import { STATS_LEAGUE_KEYS } from "./statViews";

// Every man this manager owns and what each has done: the served league's counts off the Player Stats board's warm
// read, filtered on owner, and the stats league's beneath them. One figure of ours: DefCon points at his slot.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team, squad }, all, statsLeague, defconRead] = await Promise.all([
    leagueTeams(slug),
    getPlayerStats(),
    statsLeagueSeason(STATS_LEAGUE_KEYS),
    defconInputs(),
  ]);

  // `team.teamId` and not the slug, which on the front door is the word `me`.
  const his = all.filter((line) => line.ownerTeamId === team.teamId);
  const ids = new Set(his.map((line) => line.fantraxId));

  // The footballer behind each resolved slot, for his availability.
  const footballers: Record<string, FootballPlayer> = {};
  for (const rostered of squad.players) {
    if (isResolved(rostered)) footballers[rostered.slot.fantraxId] = rostered.player;
  }

  // The roster's spelling, by id: Fantrax's stat rows say "Schade, Kevin". And the slot each fills, which DefCon prices.
  const names: Record<string, string> = {};
  const slots: Record<string, string | null> = {};
  for (const rostered of squad.players) {
    names[rostered.slot.fantraxId] = playerName(rostered);
    slots[rostered.slot.fantraxId] = rostered.slot.position;
  }
  const { scoring, codes, periods } = defconRead;

  return (
    <TeamShell
      team={team}
      current="stats"
      empty={his.length === 0 ? ["stats"] : []}
    >
      {his.length === 0 ? (
        <TabEmpty>Fantrax has no statistical line for anybody on this squad yet.</TabEmpty>
      ) : (
        <StatBoard
          lines={his}
          footballers={footballers}
          names={names}
          served={[...new Set(all.flatMap((line) => Object.keys(line.stats)))]}
          statsLeague={Object.fromEntries(statsLeague.filter(([id]) => ids.has(id)))}
          statsColumns={[...new Set(statsLeague.flatMap(([, counts]) => Object.keys(counts)))]}
          defcon={scoring === null || codes.length === 0 ? null : squadDefcon(scoring.rules, codes, slots, periods)}
        />
      )}
    </TeamShell>
  );
}

/** The league's scoring, the DefCon categories it prices by meaning, and the stats league's periods when it prices any. */
async function defconInputs() {
  const scoring = await leagueScoring();
  const codes = scoring === null ? [] : defConScored(scoring.categories).map((category) => category.short);
  return { scoring, codes, periods: codes.length === 0 ? null : await statsLeaguePeriods(codes, now()) };
}
