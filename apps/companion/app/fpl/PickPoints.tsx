"use client";

import { useState, type ReactNode } from "react";
import type { FplPick } from "@epl/core";
import Breakdown from "../components/league/Breakdown";
import Note from "../components/league/Note";
import { BUTTON } from "../components/shell/ButtonLink";
import DialogHead from "../components/shell/DialogHead";
import Modal from "../components/shell/Modal";
import { minutesOf, scoreRows } from "./scoreRows";

/** A pick's card on the FPL pitch as a button that opens his FPL points, line by line. */
export default function PickPoints({
  pick,
  name,
  club,
  started,
  over,
  children,
}: {
  pick: FplPick;
  /** His name in full, for the card's title bar. */
  name: string;
  /** His club's short name, for the bar's colours; null keeps the desk's blue. */
  club: string | null;
  /** Whether his club has kicked off this round: before that there is nothing to break down. */
  started: boolean;
  /** Whether every match his club has this round is finished. */
  over: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // A man on the bench counts for nothing unless FPL multiplied him in, as a bench boost does.
  const reserve = pick.multiplier === 0;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={name} className="block w-full">
        {children}
      </button>
      {open ? (
        <Modal onClose={() => setOpen(false)} width="24rem">
          <DialogHead title={name} club={club} />
          <div className="flex flex-col gap-2 p-3">
            {started ? (
              <Breakdown
                breakdown={scoreRows(pick)}
                points={reserve ? pick.scored : pick.points}
                reserve={reserve}
                minutes={minutesOf(pick)}
                over={over}
              />
            ) : (
              <Note>His match has not kicked off.</Note>
            )}
            <button type="button" onClick={() => setOpen(false)} className={BUTTON}>
              Close
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
