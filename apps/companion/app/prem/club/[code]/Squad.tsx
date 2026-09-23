"use client";

import { useState } from "react";
import type { Club, ClubColours, FootballPlayer, IntelPlayer } from "@epl/core";
import ViewToggle, { type View } from "../../../components/league/ViewToggle";
import { positionsLabel } from "../../../positions";
import Eleven from "./Eleven";
import type { ElevenLine } from "./Eleven";
import SquadTable from "./SquadTable";
import type { LeagueOpinion } from "./club";

// A club's squad, as a list and as the eleven it is predicted to field.
//
// **Both at once on a desk, the list first under a thumb** (Craig, 3 Sep 2026:
// "on desktop, both like fantasy page, list for mobile toggle"). `cm9900/19.jpg`
// is the reference for the pair: Championship Manager sets its tactics list and
// its pitch side by side because a desk has the width for it, and a phone does
// not — so below `lg` the toggle chooses and the list is what opens.
//
// **The list opens rather than the grass**, and that is DESIGN §9's caution
// applied honestly: the squad is a fact and the eleven is a prediction, so a
// club page's first answer should not be a guess. §9's own sentence — "the
// eleven that IS a shape keeps its pitch" — is why the pitch exists at all here:
// this is eleven men somebody has picked, in a stated formation, rather than
// thirty in position lines nobody chose.
//
// Client only because the toggle is state. Everything it draws was arranged on
// the server.

export default function Squad({
  players,
  colours,
  league,
  intel,
  club,
  eleven,
  formation,
  against,
  updated,
}: {
  players: readonly FootballPlayer[];
  colours: ClubColours;
  league: ReadonlyMap<number, LeagueOpinion>;
  intel: ReadonlyMap<number, IntelPlayer>;
  club: Club;
  /** The predicted eleven in its lines, or empty when there is no prediction —
   *  which is an ordinary state, not a fault: the export runs by hand. */
  eleven: ElevenLine[];
  formation: string | null;
  /** "v Chelsea · Sun 6 Sep", or null when there is no next match. */
  against: string | null;
  /** When Scout last updated the eleven — "Fri 4 Sept, 17:52". */
  updated: string | null;
}) {
  const [view, setView] = useState<View>("list");
  const hasEleven = eleven.length > 0 && formation !== null;

  const byCode = new Map(players.map((player) => [player.code, player]));
  const grass = hasEleven ? (
    <Eleven
      lines={eleven}
      against={against}
      updated={updated}
      club={club}
      playerOf={(code) => byCode.get(code) ?? null}
      positionOf={(code) => positionsLabel(league.get(code)?.positions ?? [])}
    />
  ) : null;

  const list = (
    <SquadTable players={players} colours={colours} league={league} intel={intel} />
  );

  return (
    <div className="flex flex-col gap-2">
      {/* The toggle is a phone control: on a desk both are drawn and choosing
          between them would be a control with nothing to decide. */}
      {grass === null ? null : (
        <div className="lg:hidden">
          <ViewToggle view={view} onPick={setView} quiet />
        </div>
      )}

      {grass === null ? (
        list
      ) : (
        // Two equal columns above `lg`, the list left and the eleven right —
        // `squad/[teamId]/Sheet`'s own grid, down to the gap: two columns butted
        // three pixels apart read as one wide object split down the middle, and
        // the air is what makes them two readings of the same club standing side
        // by side. Below `lg` the toggle chooses and only one is drawn.
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className={view === "list" ? "" : "hidden lg:block"}>{list}</div>
          <div className={view === "pitch" ? "" : "hidden lg:block"}>{grass}</div>
        </div>
      )}
    </div>
  );
}
