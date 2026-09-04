import { Suspense } from "react";
import { clubById } from "@epl/core";
import type { FootballPlayer, PlayerMatch } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import { footballNow } from "../../../football";
import MatchLog from "../MatchLog";
import SeasonTable from "../SeasonTable";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { TableWaiting } from "../Waiting";
import { joinMatches } from "../matchRows";
import { gameLog } from "../scouting";
import { subject } from "../subject";

// This season, match by match (Craig, 4 Sep 2026: "Data should have each match
// listed or rows... clicking on the score").
//
// One table in Championship Manager's own shape — rows of matches, columns of
// statistics, the sum at the foot — rather than the two figure grids this
// replaced. A grid of season totals cannot show form, which is the question a
// manager actually arrives with, and the totals it did show are the table's own
// last two rows now.
//
// **"as default" is the word to keep.** What this tab wants next is a season
// picker and the pitch maps — heat, shot, pass. Neither is here and neither is
// close: FPL publishes no shot LOCATION at all, and the sister repo's Understat
// data, which has it, has not been exported to `data/intel/`. That is a pipeline
// job upstream before it is a screen job here, and `docs/ui/player.md` says so
// rather than this file implying otherwise.

export const revalidate = 30;

export default async function PlayerData({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;

  return (
    <PlayerShell subject={found} fantraxId={fantraxId} current="data">
      {football === null ? (
        <section className={PANEL}>
          <Nothing title="No match log for this man">
            Every row is FPL&apos;s measurement of a Premier League match, and FPL has never listed
            him.
          </Nothing>
        </section>
      ) : (
        // Behind a boundary because `element-summary` is the only request on this
        // screen FPL has not already answered for somebody else. Fantrax's half is
        // already in hand from the profile that opened the page.
        <Suspense fallback={<TableWaiting />}>
          <Log player={football.player} paid={intel.matches} season={intel.season} />
        </Suspense>
      )}

    </PlayerShell>
  );
}

/** Both sections behind one boundary. They are one read — the same joined rows
 *  summed and then listed — so splitting them would draw two skeletons for one
 *  wait. */
async function Log({
  player,
  paid,
  season,
}: {
  player: FootballPlayer;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [rows, snapshot] = await Promise.all([gameLog(player), footballNow()]);
  const joined = joinMatches(rows, paid, clubById(snapshot));
  return (
    <>
      <SeasonTable rows={joined} season={season} />
      <MatchLog rows={joined} />
    </>
  );
}
