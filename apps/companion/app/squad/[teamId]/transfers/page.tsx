import TabEmpty from "../../../components/league/TabEmpty";
import { deals } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { readDeals } from "../../../business";
import Ledger from "./Ledger";

// What one manager has done all season.
//
// The feed behind this has been mapped, tested and cached since the paper's
// business column was built, and until now the ONLY thing that read it was that
// column — which prints the week's activity across the league. The rows were
// deliberately kept flat so that a team's history, a player's history and the
// week's activity could each be a filter over the same read (`league/types.ts`
// says so in as many words); this is the first of the three that was missing.
//
// Grouped through `deals()` rather than listed raw, because a claim and the drop
// that paid for it are one piece of business. Read apart they become a manager
// signing somebody and, separately and mysteriously, losing somebody else.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function TransfersPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team, names }, feed] = await Promise.all([leagueTeams(slug), readDeals()]);
  // The id the slug resolved to: `me` is a front door and not a team.
  const teamId = team.teamId;

  // His side of the league's business. A deal is his if he is on either side of
  // it — the claim he made, and the drop he made to afford it.
  const his = deals(feed.rows).filter(
    (deal) =>
      deal.inbound.some((side) => side.teamId === teamId) ||
      deal.outbound.some((side) => side.teamId === teamId),
  );

  return (
    <TeamShell
      team={team}
      current="transfers"
      empty={his.length === 0 ? ["transfers"] : []}
    >
      {his.length === 0 ? (
        <TabEmpty>{team.teamName} has made no moves this season.</TabEmpty>
      ) : (
        <Ledger deals={his} teamId={teamId} names={names} />
      )}
    </TeamShell>
  );
}
