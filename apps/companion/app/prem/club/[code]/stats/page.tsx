import { squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import { leagueOpinions } from "../../../leagueOpinions";
import { poolHref } from "../../../poolHref";
import { squadOrder } from "../squadOrder";
import { intelSquads } from "../../../../intel";
import PlayerBoard from "./PlayerBoard";
import type { Row } from "./PlayerBoard";

// The club's season, player by player, as a sortable table like every other Stats tab (Craig, 3 Sep 2026).
// Meant to open in the Squad tab's order: two tabs about one squad should not disagree about who is first.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function ClubStatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const league = await leagueOpinions();

  const rows: Row[] = squadOf(snapshot, club.id)
    .sort(squadOrder(league, (code) => intelSquads.get(code)?.depthTier))
    .map((player) => ({
      player,
      positions: league.get(player.code)?.positions ?? [],
      href: poolHref(league, player.code),
    }));

  return (
    <ClubShell club={club} current="stats" empty={rows.length === 0 ? ["stats"] : []}>
      {rows.length === 0 ? (
        <TabEmpty>FPL names {club.name} but lists nobody on its books.</TabEmpty>
      ) : (
        <PlayerBoard rows={rows} />
      )}
    </ClubShell>
  );
}
