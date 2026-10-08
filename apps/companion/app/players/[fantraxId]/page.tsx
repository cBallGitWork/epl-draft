import { Suspense } from "react";
import { clubById } from "@epl/core";
import type { FootballPlayer, PlayerMatch } from "@epl/core";
import { footballNow, seasonFixtures } from "../../football";
import { playerMarks } from "../../ratings";
import Nothing from "../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import ButtonLink from "../../components/shell/ButtonLink";
import { POOL, PROJECTIONS_SHOWN } from "../routes";
import { intelMinutes } from "../../intel";
import { FPL_SILENT } from "../../config";
import AttributeGrid from "./AttributeGrid";
import BornLine from "./BornLine";
import type { GridWord } from "./AttributeGrid";
import FixtureRun from "./FixtureRun";
import Fitness from "./Fitness";
import NoProfile from "./NoProfile";
import PlayerShell from "./PlayerShell";
import Portrait from "./Portrait";
import Rankings from "./Rankings";
import RealPosition from "./RealPosition";
import SeasonTable from "./SeasonTable";
import HeldNote from "./HeldNote";
import SetPieces from "./SetPieces";
import { playerGrid, playerPieces, playerStanding, projectedWeeks, realPosition } from "./grid";
import { joinMatches } from "./matchRows";
import { gameLog } from "./scouting";
import { scouting } from "./scouting";
import { subject } from "./subject";

// One player on Championship Manager's profile screen (`cm9900/11.jpg`): the bar, four tabs, his birth line, the
// attribute grid, and the cyan line at the foot saying what he plays. One Fantrax profile per tap, never a sweep.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function PlayerProfile({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);

  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;
  const [grid, standing, pieces] =
    football === null
      ? [null, null, null]
      : await Promise.all([playerGrid(football.player), playerStanding(football.player), playerPieces(football.player)]);
  const position = football === null ? null : realPosition(football.player.code);
  // His run to come, off the snapshot and calendar every screen holds, so outside any boundary.
  const run = football === null ? null : await scouting(football.player);
  // Projected points only while Craig trusts them; xMins always.
  const weeks =
    football === null || run === null || !PROJECTIONS_SHOWN
      ? null
      : await projectedWeeks(football.player, run.flatMap((against) => against.fixture.gameweek ?? []));
  const minutes = new Map(
    (football === null ? [] : (intelMinutes.get(football.player.code) ?? [])).map((week) => [week.gameweek, week.minutes]),
  );

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="profile"
    >
      {football === null ? null : <BornLine player={football.player} />}
      {/* Portrait above the grid on a phone, beside it on a desk and as tall as it (Craig, 4 Sep 2026). */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {/* No portrait, and nothing in its place, for a man FPL has never listed. */}
        {football ? (
          <Portrait
            player={football.player}
            club={football.club}
            position={intel.defaultPosition}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {grid === null ? (
            <section className={PANEL}>
              <Nothing title="No attribute grid for this man">
                Every rating is measured off Premier League play, and the bridge has never settled
                him against a Premier League player. Fantrax carries him; FPL has never listed him.
              </Nothing>
            </section>
          ) : (
            <AttributeGrid
              attributes={grid.attributes}
              words={words(standing)}
              season={grid.season}
              keeper={grid.keeper}
            />
          )}
        </div>
      </div>

      {/* Whether he can play and what is being said about him, under who he is (Craig, 26 Sep 2026). */}
      <Suspense fallback={null}>
        <Fitness fantraxId={fantraxId} player={football?.player ?? null} />
      </Suspense>

      {standing === null ? null : <Rankings ranked={standing.ranked} group={standing.group} />}

      {pieces === null ? null : <SetPieces pieces={pieces} club={football?.club?.name ?? null} />}

      {/* CM's appearances table, as Data opens with it (Craig, 4 Sep 2026). */}
      {football === null ? null : (
        <Suspense fallback={null}>
          <Season player={football.player} paid={intel.matches} season={intel.season} />
        </Suspense>
      )}

      {/* The run to come, not the round just gone (Craig, 4 Sep 2026). */}
      {run === null ? null : <FixtureRun run={run} minutes={minutes} weeks={weeks} group={standing?.group ?? null} />}

      {/* What he actually plays, last and loudest, where CM puts it (Craig, 4 Sep 2026). */}
      <RealPosition position={position} />

      {/* An action on the man on screen, not a tab: the board becomes the picker for the second. */}
      <ButtonLink href={`${POOL}?compare=${fantraxId}`}>Compare with…</ButtonLink>
    </PlayerShell>
  );
}

/** His season's row, read behind the boundary above; the game log is cached on his code, so Data's costs nothing. */
async function Season({
  player,
  paid,
  season,
}: {
  player: FootballPlayer;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [log, snapshot, fixtures] = await Promise.all([gameLog(player), footballNow(), seasonFixtures()]);
  if (log === null) return <Nothing title={FPL_SILENT} code="element-summary">His season will be back when FPL answers.</Nothing>;
  return (
    <>
      <SeasonTable rows={joinMatches(log.rows, paid, clubById(snapshot), playerMarks(player.code, fixtures))} season={season} />
      {log.heldAt === null ? null : <HeldNote at={log.heldAt} />}
    </>
  );
}

/** CM's worded row under the ratings: the foot he shoots with, never a keeper's. Condition is Fitness's. */
function words(standing: { keeper: boolean; foot: string | null } | null): GridWord[] {
  if (standing?.keeper) return [];
  return [{ name: "Preferred Foot", value: standing?.foot ?? null, title: "the foot he shoots with, off the shot map" }];
}
