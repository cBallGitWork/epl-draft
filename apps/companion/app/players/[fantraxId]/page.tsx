import { Suspense } from "react";
import { availabilityOf, clubById } from "@epl/core";
import type { FootballPlayer, PlayerMatch } from "@epl/core";
import { footballNow } from "../../football";
import Nothing from "../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import ButtonLink from "../../components/shell/ButtonLink";
import { POOL } from "../routes";
import AttributeGrid from "./AttributeGrid";
import type { GridWord } from "./AttributeGrid";
import FixtureRun from "./FixtureRun";
import NoProfile from "./NoProfile";
import PlayerShell from "./PlayerShell";
import Portrait from "./Portrait";
import Rankings from "./Rankings";
import RealPosition from "./RealPosition";
import SeasonTable from "./SeasonTable";
import SetPieces from "./SetPieces";
import { playerGrid, playerPieces, playerStanding, projectedWeeks, realPosition } from "./grid";
import { joinMatches } from "./matchRows";
import { gameLog } from "./scouting";
import { scouting } from "./scouting";
import { subject } from "./subject";

// One player, on Championship Manager's own profile screen (`cm9900/11.jpg`):
// a plated bar carrying `5. Harry Maguire (Man Utd)`, four tabs, the yellow
// caption with his birth date in it, the attribute grid, and one cyan line at
// the foot saying what he actually is.
//
// **This screen used to be ten blocks in a column, 1795px tall on a phone**, and
// `docs/ui/player.md` named the fault before this rework began: *"nothing
// decides which of them a reader came for."* The tabs decide. What was one
// scroll is now four views, and each one answers a question a manager actually
// arrives with — who is he, is he fit, can I have him, what has he done.
//
// Reached by tapping a name in the pool, and that is the whole politeness
// policy: one profile per tap, never a sweep of the 697.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
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
  // What he has done in the round on screen and what is coming. Both read the
  // snapshot and the calendar every other screen already holds, so they cost FPL
  // nothing and do not go behind a boundary. This is the half of the screen that
  // answers docs/rules/PRODUCT.md's third-most-frequent job — "should I start this player".
  const run = football === null ? null : await scouting(football.player);
  const weeks =
    football === null || run === null
      ? null
      : await projectedWeeks(football.player, run.flatMap((against) => against.fixture.gameweek ?? []));

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="profile"
    >
      {/* Portrait beside the grid on the desk, above it on a phone. The desk
          layout is drawn first and the phone is a second design of the same data
          (docs/rules/PRODUCT.md, 31 Aug) — at 1440 a single column left 900px of empty row
          between every label and its value, which is a phone layout stretched. */}
      {/* **`items-stretch`, so the portrait is as tall as the grid beside it**
          (Craig, 4 Sep 2026: *"portarit has awkward sapce under it"*). It was
          `items-start`, which sized the portrait to its own image and left a
          band of club colour under it wherever the attribute grid ran longer —
          a keeper's grid is eight rows and an outfielder's thirteen, so the gap
          changed size per man. `cm9900/11.jpg` has no such gap: its picture is
          the ground the whole panel is drawn on. */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {/* No portrait for a man FPL has never listed, and nothing standing in
            for one: he has no code, so there is no photograph, no kit and no
            crest to draw. That is 88 of the 694 in the pool and it is a settled
            answer, not a gap. */}
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
              attributes={grid}
              words={words(football?.player ?? null, standing)}
              group={standing?.group ?? null}
            />
          )}
        </div>
      </div>

      {standing === null ? null : <Rankings ranked={standing.ranked} group={standing.group} />}

      {pieces === null ? null : <SetPieces pieces={pieces} club={football?.club?.name ?? null} />}

      {/* **CM puts the appearances table on the profile** (`cm9900/11.jpg`), and
          so does this (Craig, 4 Sep 2026: "the season totals are on the main
          page (like cm has)"). It is the same two rows Data opens with — a
          summary belongs on the overview AND above the detail, which is not the
          duplication that moved the match LOG off History: that was twenty rows
          of detail rendering twice. */}
      {football === null ? null : (
        <Suspense fallback={null}>
          <Season player={football.player} paid={intel.matches} season={intel.season} />
        </Suspense>
      )}

      {/* The run to come, and NOT the round just gone (Craig, 4 Sep 2026:
          "Remove gameweek so far"). One round of one man's figures is a Data
          question; what a Profile owes is who he is and what is in front of him.
          The card that drew the round is deleted rather than moved — no consumer
          means delete (CODE_RULES §2), and `contribution()` in core is still
          there if Data ever wants a round view. */}
      {run === null || weeks === null ? null : <FixtureRun run={run} weeks={weeks} group={standing?.group ?? null} />}

      {/* **What he actually is, last and loudest** (Craig, 4 Sep 2026), which is
          where `cm9900/11.jpg` puts it: `Defender/Defensive Midfielder
          (Left/Centre)` in cyan across the foot of the panel, under the
          appearances table and above the buttons. It had been sitting inside the
          grid column, where it read as a caption on the attributes.

          The Player block of birthplace, height and weight is gone with it: the
          country is in the caption under the tabs now, and height and weight are
          two figures no screen in this app has ever asked a question about.

          So are the two foot buttons (Craig: *"remove - his squad/back to pool
          for now"*). CM's foot is Back/Next and ours were named destinations;
          the rail reaches both at every width. */}
      <RealPosition position={position} />

      {/* **An action, not a sixth tab.** `PlayerTabs` is five because CM is five
          (`cm9900/11.jpg`), and `player.md` records the foot buttons coming off
          every tab because they were named destinations the rail already
          reaches. This is neither: it is a thing you DO to the man on screen,
          and it leaves with him — the board becomes a picker for the second. */}
      <ButtonLink href={`${POOL}?compare=${fantraxId}`}>Compare with…</ButtonLink>
    </PlayerShell>
  );
}

/** His season's two rows, read behind the boundary above. `element-summary` is
 *  cached on his season-stable code, so Data's copy of this costs nothing after
 *  the first of the two is drawn. */
async function Season({
  player,
  paid,
  season,
}: {
  player: FootballPlayer;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [rows, snapshot] = await Promise.all([gameLog(player), footballNow()]);
  return <SeasonTable rows={joinMatches(rows, paid, clubById(snapshot))} season={season} />;
}

/** CM's worded rows under the ratings: the foot he shoots with (never a keeper's), and FPL's chance he plays. */
function words(player: FootballPlayer | null, standing: { keeper: boolean; foot: string | null } | null): GridWord[] {
  const availability = availabilityOf(player);
  const condition =
    player === null
      ? null
      : availability.state === "fit"
        ? "100%"
        : availability.chance !== null
          ? `${availability.chance}%`
          : availability.label;
  const foot = { name: "Preferred Foot", value: standing?.foot ?? null, title: "the foot he shoots with, off the shot map" };
  return [
    ...(standing?.keeper ? [] : [foot]),
    { name: "Condition", value: condition, title: "FPL's chance of him playing the next round" },
  ];
}
