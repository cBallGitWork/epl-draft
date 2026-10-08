"use client";

import { type ReactNode, useState } from "react";
import type { LeaguePlayerState, RosterLimits, RosteredTeam, SquadPlayerDetail } from "@epl/core";
import LineupPitch from "./LineupPitch";
import PlayerCard from "./PlayerCard";
import Pending from "./Pending";
import SquadRows from "./SquadRows";
import ViewToggle, { type View } from "./ViewToggle";
import PlanStatus from "./PlanStatus";
import SaveBar from "./SaveBar";
import LeaveGuard from "./LeaveGuard";
import { useSave } from "./useSave";
import { usePlanner } from "./usePlanner";
import { PANEL, HEADING_PLATE } from "@/app/desk";
import OutLink from "../shell/OutLink";
import ListAndPitch from "./ListAndPitch";

// Planning a lineup and saving it: the shape lives in browser state until Save sends it to Fantrax
// (`squad/[teamId]/save.ts`); where saving is off, the link at the bottom hands the manager over.
// Every rule is the commissioner's, from `getLeagueInfo` via `moves.ts`; no shape is assumed here.

export default function LineupPlanner({
  team,
  details,
  players,
  limits,
  fantraxUrl,
  pending,
  period,
  benchRanks,
  canSave,
  picker,
}: {
  team: RosteredTeam;
  /** The squad's football detail, flat; arranged here, move by move. */
  details: SquadPlayerDetail[];
  /** A plain array, not the `Eligibility` map: it crosses the server boundary. */
  players: LeaguePlayerState[];
  limits: RosterLimits;
  fantraxUrl: string;
  /** Points Fantrax has not credited yet, or null when there are none; never a nought. */
  pending: number | null;
  /** The period being planned, which a save must still find open. */
  period: number;
  /** The order Fantrax will bring the bench on, `scorerId → rank`. */
  benchRanks: Record<string, number>;
  /** Whether this deployment saves to Fantrax. */
  canSave: boolean;
  /** The gameweek picker, beside the toggle; a tap away goes through `LeaveGuard` like any link. */
  picker: ReactNode;
}) {
  const {
    rows,
    bench,
    eligibleBy,
    nameOf,
    dirty,
    broken,
    empty,
    card,
    setCard,
    pickStateOf,
    pick,
    openings,
    place,
    reset,
    markSaved,
    plan,
  } = usePlanner(team, details, players, limits, benchRanks);
  const { saving, answer, save, clear } = useSave(period, plan, markSaved);
  const [view, setView] = useState<View>("pitch");


  return (
    <div className="flex flex-col gap-3">
      {/* The Pitch/List toggle spans the page on a phone and keeps the 44px tap floor. */}
      <div className="flex flex-col gap-2 px-1 text-2xs lg:flex-row lg:items-center lg:justify-end lg:gap-3">
        {/* Above the strip on a phone and beside it on the desk, so a pending
            figure never pushes the control off the fold. */}
        <div className="flex justify-end lg:order-2">
          <Pending points={pending} />
        </div>
        {/* The toggle is phone only, as above `lg` list and pitch stand side by side. The week sits beside it
            on a phone, so the grass loses no height to it; alone at the right above `lg`. */}
        <div className="flex gap-2 lg:order-3">
          <div className="flex flex-1 lg:hidden">
            <ViewToggle view={view} onPick={setView} />
          </div>
          {picker}
        </div>
      </div>

      {/* One panel round list and pitch, as on a rival's squad. */}
      <section className={PANEL}>
      <ListAndPitch
        view={view}
        list={
          <div className="flex flex-col gap-2">
          <SquadRows
            lines={rows.map((line) => ({ position: line.label, players: line.players }))}
            projected={false}
            eligibility={eligibleBy}
            onOpen={setCard}
          />
          {bench.length === 0 ? null : (
            <>
              {/* Nothing prints on the bare ground (DESIGN §2), so the heading draws its own plate. */}
              <p className={HEADING_PLATE}>Bench</p>
              <SquadRows
                lines={[{ position: "", players: bench }]}
                projected={false}
                eligibility={eligibleBy}
                head={false}
                reserve
                onOpen={setCard}
              />
            </>
          )}
          </div>
        }
        pitch={
          <LineupPitch
            inColumn
            rows={rows}
            bench={bench}
            pickStateOf={pickStateOf}
            onPick={pick}
            openings={openings}
            onPlace={place}
          />
        }
      />
      </section>

      {card !== null ? (
        <PlayerCard
          key={card.rostered.slot.fantraxId}
          player={card}
          onClose={() => setCard(null)}
        />
      ) : null}

      <SaveBar
        dirty={dirty}
        canSave={canSave}
        legal={broken.length === 0}
        saving={saving}
        answer={answer}
        onSave={save}
        onReset={() => {
          reset();
          clear();
        }}
      />
      <PlanStatus broken={broken} empty={empty} nameOf={nameOf} />
      <LeaveGuard dirty={dirty} canSave={canSave && broken.length === 0} onSave={save} />

      <OutLink href={fantraxUrl}>Set this lineup in Fantrax</OutLink>
    </div>
  );
}
