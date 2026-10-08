import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import type { ReactNode } from "react";
import TeamSheet from "../../components/league/TeamSheet";
import type { View } from "../../components/league/ViewToggle";
import Pending from "../../components/league/Pending";
import ListAndPitch from "@/app/components/league/ListAndPitch";

// A read-only eleven, a rival's once his lineups lock or your own in any week but the open one, with the
// Pitch/List control and the gameweek picker.

export default function Sheet({
  rows,
  bench,
  breakdown,
  news,
  pending,
  eligibility,
  picker,
  show,
  opens,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  breakdown: Record<string, BreakdownLine[]>;
  /** Fantrax's latest on these fifteen, keyed by Fantrax id — today's only. */
  news?: Record<string, PlayerStory>;
  /** Clean-sheet points Fantrax credits at full time and FPL already pays; null when none, never a nought. */
  pending: number | null;
  /** Eligible positions by Fantrax id, for the list's position column. */
  eligibility?: Record<string, string[]>;
  /** The gameweek picker, beside the toggle; null when the calendar cannot place the week. */
  picker: ReactNode;
  /** Under each name on the grass: his score in a locked week, his opponent in a later one. */
  show: "points" | "fixture";
  /** The view on a phone at first: a rival's list (who he has), your own pitch (as the planner opens). */
  opens: View;
}) {
  // No shape line (Craig, 2 Sep: "so remove 1-3-4-3"); the toggle shares the pending figure's row and the week's,
  // since stacked the grass sat 421px past the fold at 390.
  return (
    <ListAndPitch
      opens={opens}
      beside={
        <>
          <Pending points={pending} />
          {picker}
        </>
      }
      list={
        // One panel round list and pitch (Craig, 2-3 Sep 2026), so `bare` stops the list drawing a second.
        <TeamSheet
          rows={rows}
          bench={bench}
          breakdown={breakdown}
          news={news}
          mode="list"
          eligibility={eligibility}
          bare
        />
      }
      pitch={
        <>
          {/* A heading over the grass (Craig, 3 Sep 2026): this is the side as it stands. */}
          <p className="cm-title pb-1 text-center font-chrome text-2xs font-bold text-accent lg:text-sm">
            First-choice XI
          </p>
          <TeamSheet
            rows={rows}
            // No bench on the grass: a reserve has no place in a formation.
            bench={[]}
            breakdown={breakdown}
            news={news}
            mode="pitch"
            inColumn
            show={show}
          />
        </>
      }
    />
  );
}
