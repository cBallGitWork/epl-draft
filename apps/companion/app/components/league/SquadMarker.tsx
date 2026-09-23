import type { SquadPlayerDetail } from "@epl/core";
import { isGoalkeeper, isResolved, pitchName } from "@epl/core";
import PitchMarker from "./PitchMarker";

// One man of a fantasy squad, as a marker on the grass.
//
// `PitchMarker` speaks football — a `FootballPlayer`, a club, a boolean for
// whether he keeps goal — precisely so that a Premier League eleven can stand on
// the same pitch without a Fantrax id anywhere near it. The translation from a
// roster slot to those words is the league layer's, and it was written twice:
// once inside `TeamSheet` for a rival's locked eleven, and it was about to be
// written a third time for the planner (Craig, 21 Sep 2026 — "USE THIS code for
// pitch view ui (and get it shared)").
//
// Three sites, so it is extracted rather than copied (CODE_RULES §1). What the
// callers keep for themselves is the BUTTON round it: they disagree about what a
// tap does and about what to say to a screen reader, and that is the part that
// genuinely differs.

export default function SquadMarker({
  player,
  show,
}: {
  player: SquadPlayerDetail;
  /** What the line under his name carries — see `PitchMarker`. */
  show?: "points" | "fixture";
}) {
  const { rostered } = player;
  return (
    <PitchMarker
      player={isResolved(rostered) ? rostered.player : null}
      label={rostered.slot.position || "?"}
      name={pitchName(rostered)}
      // **`isGoalkeeper` and not a literal `"G"`.** The position vocabulary is
      // LEAGUE data — a commissioner can change it — so the letter is never
      // compared outside `rosterStatus`'s own helpers.
      keeper={isGoalkeeper(rostered.slot.position)}
      club={player.club}
      opposition={player.opposition}
      points={player.points}
      show={show}
    />
  );
}
