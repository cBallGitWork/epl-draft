import TabEmpty from "../../../components/league/TabEmpty";
import { isResolved, playerName, type SeasonTotals } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { getPlayerStats } from "../../../players/playerStats";
import StatBoard from "./StatBoard";

// Every man this manager owns, and what each of them has actually done.
//
// **It costs no request.** `getPlayerStats` is the read the Player Stats board
// already makes and already caches, and every row on it carries `ownerTeamId` —
// so one squad's whole statistical season is a filter over a warm cache rather
// than anything new asked of Fantrax. That is the entire reason this screen is
// cheap enough to be a tab.
//
// **The figures are Fantrax's, and that is deliberate.** `playerCategories.ts`
// carries the argument at length: these are the categories our league scores, so
// the authority on them is the league's own provider. FPL's goals and assists
// are a different question answered by a different source, and mixing them here
// would print a number that does not explain the points the manager got.
//
// One caveat this screen must not forget: the pool's `FPts` prices a man at his
// DEFAULT position, never the slot his manager filed him in (CLAUDE.md, and 48
// of 607 players are eligible at two). So this board prints the raw counts —
// goals, assists, clean sheets — which are facts about the footballer, and
// leaves points to the squad tab, which reads them off the slot.

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

  // **What FPL knows and Fantrax does not** (Craig, 2 Sep: "we just use stats
  // not covered by fantasy points, so goals/assists we don't need, but xg/xa
  // etc, tackles, interceptions").
  //
  // That instruction is also what keeps DESIGN §7 satisfied: the provenance rule
  // bites when two sources answer the SAME question and a reader cannot tell
  // whose number he is reading. Goals and assists are Fantrax's because Fantrax
  // pays for them; expected goals, tackles, recoveries and the minutes under
  // them are facts our league does not score at all, so there is no second
  // answer for them to disagree with.
  //
  // Costs no request: the squad is already resolved through the bridge for this
  // page's own name, and every resolved slot carries the footballer whose season
  // totals `mapPlayers` now fills from bootstrap.
  const underlying: Record<string, SeasonTotals> = {};
  for (const rostered of squad.players) {
    if (isResolved(rostered)) underlying[rostered.slot.fantraxId] = rostered.player.season;
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
        <StatBoard lines={his} underlying={underlying} names={names} />
      )}
    </TeamShell>
  );
}
