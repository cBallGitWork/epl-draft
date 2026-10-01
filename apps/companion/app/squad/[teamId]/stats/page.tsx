import TabEmpty from "../../../components/league/TabEmpty";
import { isResolved, playerName, type FootballPlayer } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { getPlayerStats } from "../../../players/playerStats";
import StatBoard from "./StatBoard";

// Every man this manager owns and what each has done: the Player Stats board's warm read, filtered on owner. The
// figures are Fantrax's raw counts, the categories the league scores; points belong to the Squad tab.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team, squad }, all] = await Promise.all([leagueTeams(slug), getPlayerStats()]);

  // `team.teamId` and not the slug, which on the front door is the word `me`.
  const his = all.filter((line) => line.ownerTeamId === team.teamId);

  // The footballer behind each resolved slot, for his availability.
  const footballers: Record<string, FootballPlayer> = {};
  for (const rostered of squad.players) {
    if (isResolved(rostered)) footballers[rostered.slot.fantraxId] = rostered.player;
  }

  // Fantrax's stat rows and the roster disagree about a man's name — "Schade,
  // Kevin" against "Kevin Schade" — and the roster's is the one every other
  // screen prints. Keyed by id, which is the join both sides actually share.
  const names: Record<string, string> = {};
  for (const rostered of squad.players) names[rostered.slot.fantraxId] = playerName(rostered);

  return (
    <TeamShell
      team={team}
      current="stats"
      empty={his.length === 0 ? ["stats"] : []}
    >
      {his.length === 0 ? (
        <TabEmpty>Fantrax has no statistical line for anybody on this squad yet.</TabEmpty>
      ) : (
        <StatBoard lines={his} footballers={footballers} names={names} scored={[...new Set(all.flatMap((line) => Object.keys(line.stats)))]} />
      )}
    </TeamShell>
  );
}
