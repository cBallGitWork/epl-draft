import { Suspense } from "react";
import Nothing from "../../../components/shell/Nothing";
import { StackWaiting, TableWaiting } from "../Waiting";
import { PANEL } from "@/app/desk";
import type { FootballPlayer } from "@epl/core";
import Breakdown from "../Breakdown";
import Foot from "../Foot";
import NoProfile from "../NoProfile";
import PastSeasons from "../PastSeasons";
import PlayerShell from "../PlayerShell";
import { pastSeasons } from "../grid";
import { playerSeason } from "../season";
import { subject } from "../subject";

// Championship Manager's `History`: the appearances table under the attribute
// grid, given a tab of its own because ours is a career rather than six rows.
//
// What he did before now. The match log for this season is Data's — same table,
// and it was drawn on both tabs until 4 Sep 2026.

export const revalidate = 30;

export default async function PlayerHistory({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="history"
    >
      {football === null ? (
        <section className={PANEL}>
          <Nothing title="No history for this man">
            His record is FPL&apos;s, and FPL has never listed him.
          </Nothing>
        </section>
      ) : (
        <Suspense fallback={<TableWaiting />}>
          <Record player={football.player} />
        </Suspense>
      )}

      {/* What he has been worth in OUR league, by the categories that pay —
          Fantrax's own breakdown, which sums to their total exactly. A different
          question from the two tables above and a different provenance, so it
          sits under its own heading (DESIGN §7).

          Only for a player somebody owns: the read answers null for a free agent
          without asking Fantrax anything, so a boundary there would put a card
          on screen that could only ever come back empty. */}
      {intel.ownerTeamId === null ? null : (
        <Suspense fallback={<StackWaiting />}>
          <Season fantraxId={fantraxId} ownerTeamId={intel.ownerTeamId} />
        </Suspense>
      )}

      <Foot ownerTeamId={intel.ownerTeamId} />
    </PlayerShell>
  );
}

/** His completed seasons. The match log for THIS season moved to Data on 4 Sep
 *  2026 — it is the same table and it was rendering on two tabs, which is the
 *  thing a tab strip exists to stop. */
async function Record({ player }: { player: FootballPlayer }) {
  return <PastSeasons seasons={await pastSeasons(player)} />;
}

/** His season in our league, read behind the boundary above. Nothing but the
 *  await lives here — the card itself is `Breakdown`, unchanged. */
async function Season({ fantraxId, ownerTeamId }: { fantraxId: string; ownerTeamId: string }) {
  return <Breakdown season={await playerSeason(fantraxId, ownerTeamId)} />;
}
