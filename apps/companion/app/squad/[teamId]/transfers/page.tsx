import TabEmpty from "../../../components/league/TabEmpty";
import { deals } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { readDeals } from "../../../business";
import Ledger from "../../../components/league/Ledger";

// What one manager has done all season: the paper's transaction feed, grouped by `deals()` so a
// claim and the drop that paid for it are one row.

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

  // A deal is his if he is on either side of it.
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
