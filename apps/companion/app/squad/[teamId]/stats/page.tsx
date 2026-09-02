import TeamShell from "../Shell";
import { teamOr404 } from "../team";
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

export const revalidate = 30;

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [team, all] = await Promise.all([teamOr404(teamId), getPlayerStats()]);

  const his = all.filter((line) => line.ownerTeamId === teamId);

  return (
    <TeamShell
      team={team}
      title="Stats"
      current="stats"
      empty={his.length === 0 ? ["stats"] : []}
    >
      {his.length === 0 ? (
        <section className="cm-panel px-3 py-6">
          <p className="text-center text-2xs text-muted">
            Fantrax has no statistical line for anybody on this squad yet.
          </p>
        </section>
      ) : (
        <StatBoard lines={his} />
      )}
    </TeamShell>
  );
}
