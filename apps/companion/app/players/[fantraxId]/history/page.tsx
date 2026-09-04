import { Suspense } from "react";
import { clubById } from "@epl/core";
import type { FootballPlayer, PlayerMatch } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { TableWaiting } from "../Waiting";
import { PANEL } from "@/app/desk";
import { footballNow } from "../../../football";
import NoProfile from "../NoProfile";
import PastSeasons from "../PastSeasons";
import PlayerShell from "../PlayerShell";
import { pastSeasons } from "../grid";
import { joinMatches, totalsOf } from "../matchRows";
import { gameLog } from "../scouting";
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
          <Career player={football.player} paid={intel.matches} season={intel.season} />
        </Suspense>
      )}

      {/* **The Fantrax year-to-date block is gone** (Craig, 4 Sep 2026:
          *"remove … 22FPts · 11 a game / Goals +15 / Minutes Played +4 …
          poitnless"*). It restated his league total beside three category
          deltas, on a tab whose question is what he has done across SEASONS —
          and the total it restated is on the Profile already. */}
    </PlayerShell>
  );
}

/** His career, this season first.
 *
 *  `Career` rather than `Record`, which TypeScript owns as a built-in type and
 *  which the compiler reads as one the moment it is used as a component.
 *
 *  The 38-row match log stays on Data — it is the same table and it was
 *  rendering on two tabs, which is the thing a tab strip exists to stop. What
 *  comes back here is the season as ONE row, which is what FPL's own player page
 *  puts above its Previous Seasons table and what makes the two comparable at a
 *  glance. */
async function Career({
  player,
  paid,
  season,
}: {
  player: FootballPlayer;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [seasons, log, snapshot] = await Promise.all([
    pastSeasons(player),
    gameLog(player),
    footballNow(),
  ]);
  const t = totalsOf(joinMatches(log, paid, clubById(snapshot)));
  return (
    <PastSeasons
      seasons={seasons}
      // Only when he has actually played. A row of noughts under a season label
      // would say he turned out and did nothing, where the truth is that the
      // season has not reached him yet.
      current={
        t.minutes === 0
          ? null
          : {
              season: season ?? "This season",
              minutes: t.minutes,
              goals: t.goals,
              assists: t.assists,
              cleanSheets: t.cleanSheets,
              goalsConceded: t.conceded,
              yellowCards: t.yellowCards,
              redCards: t.redCards,
              saves: t.saves,
              bonus: t.bonus,
              fplPoints: t.fplPoints,
            }
      }
    />
  );
}
