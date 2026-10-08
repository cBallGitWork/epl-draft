"use client";

import { useState, type ReactNode } from "react";
import type { SquadPlayerDetail } from "@epl/core";
import PlayerCard from "../../../components/league/PlayerCard";

// A name on a match screen, opening the app's one player card, the squad board's own (Craig, 23 Sep 2026).

function PlayerCardButton({
  player,
  className,
  children,
}: {
  player: SquadPlayerDetail;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? <PlayerCard player={player} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** The card's trigger where our league knows him, and a plain label where it does not. */
export function MaybeCard({
  player,
  className,
  children,
}: {
  player: SquadPlayerDetail | undefined;
  className: string;
  children: ReactNode;
}) {
  return player === undefined ? (
    <span className={className}>{children}</span>
  ) : (
    <PlayerCardButton player={player} className={className}>
      {children}
    </PlayerCardButton>
  );
}
