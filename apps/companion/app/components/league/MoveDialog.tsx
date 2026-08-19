"use client";

import { useEffect, useRef } from "react";
import type { Move, SlotOption } from "@epl/core";
import MoveSheet from "./MoveSheet";

// Everywhere one player can go, over the pitch rather than under it.
//
// It used to render in the flow below the bench, which on a phone is a screen
// and a half beneath the man you just tapped — so tapping him looked like it had
// done nothing. A dialog appears where you are looking.
//
// Native `<dialog>`, so Escape, the focus trap and the inert background are the
// browser's job rather than four effects of ours.

export default function MoveDialog({
  name,
  moves,
  options,
  nameOf,
  onPlay,
  onClose,
}: {
  name: string;
  moves: Move[];
  options: SlotOption[];
  nameOf: (id: string) => string;
  onPlay: (move: Move) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself; one on
      // anything inside lands on a child. That is the whole test.
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="m-auto w-[min(22rem,92vw)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-2 p-3">
        <h2 className="px-1 text-sm font-bold tracking-tight">{name}</h2>
        <MoveSheet
          moves={moves}
          options={options}
          nameOf={nameOf}
          onPlay={(move) => {
            onPlay(move);
            dialog.current?.close();
          }}
        />
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium hover:bg-raised"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
