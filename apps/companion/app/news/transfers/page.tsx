import { deals } from "@epl/core";
import Ledger from "../../components/league/Ledger";
import Nothing from "../../components/shell/Nothing";
import PageHeader from "../../components/shell/PageHeader";
import { readDeals } from "../../business";
import { getLeagueSquads, readerTeamId } from "../../squads";
import { NEWS } from "../../titles";
import MailViews from "../MailViews";

// Every move in the league on one page, newest first: the team Transfers tab's ledger with each row's mover named,
// read off the same feed, so the two never disagree.

export default async function LeagueTransfersPage() {
  const [squads, feed, mine] = await Promise.all([getLeagueSquads(), readDeals(), readerTeamId()]);

  // Every team's name by id; a deal's own copy goes stale when a manager renames.
  const names: Record<string, string> = {};
  for (const team of ("period" in squads ? squads.info?.teams : null) ?? []) names[team.teamId] = team.name;
  const all = deals(feed.rows);
  // The bar is the manager's, as the inbox's is.
  const yours = mine === null ? null : (names[mine] ?? null);

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={yours === null ? NEWS : `${yours} ${NEWS}`} />
      <MailViews current="transfers" />
      {all.length === 0 ? (
        <section className="cm-panel p-3">
          <Nothing title="No moves yet" code="0 deals">
            Nobody in the league has claimed, dropped or traded a player.
          </Nothing>
        </section>
      ) : (
        <Ledger deals={all} names={names} />
      )}
    </div>
  );
}
