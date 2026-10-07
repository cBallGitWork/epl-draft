"use client";

import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { type ReactNode, useState } from "react";
import TeamSheet from "../../components/league/TeamSheet";
import ViewToggle, { type View } from "../../components/league/ViewToggle";
import Pending from "../../components/league/Pending";
import { PANEL } from "@/app/desk";
import ListAndPitch from "@/app/components/league/ListAndPitch";

// A read-only eleven, a rival's once his lineups lock or your own in any week but the open one, with the
// Pitch/List control and the gameweek picker. The view state lives here: whoever draws the control owns it.

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
  /** The formation, which arrives on the spread and is not drawn: the pitch shows it. */
  shape?: string;
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
  // Phone only — above `lg` both are drawn and the control is hidden.
  const [view, setView] = useState<View>(opens);

  return (
    <div className="flex flex-col gap-2">
      {/* No shape line (Craig, 2 Sep: "so remove 1-3-4-3"). The toggle is the phone's: stacked, the grass sat 421px
          past the fold at 390. It shares a row with the pending figure and the week. */}
      <div className="flex items-center gap-2 px-1 lg:justify-end">
        <div className="flex flex-1 lg:hidden">
          <ViewToggle view={view} onPick={setView} />
        </div>
        <Pending points={pending} />
        {picker}
      </div>

      {/* One box round list and pitch, equal halves with air between (Craig, 2-3 Sep 2026): the list is the whole
          squad, the grass the eleven; `bare` stops the list drawing a second panel. */}
      <section className={PANEL}>
      <ListAndPitch
        view={view}
        list={
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
      </section>
    </div>
  );
}
