"use client";

import type { Move, SlotOption } from "@epl/core";
import Modal from "../shell/Modal";
import MoveSheet from "./MoveSheet";
import { BUTTON } from "../shell/ButtonLink";

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
  onCard,
  onClose,
}: {
  name: string;
  moves: Move[];
  options: SlotOption[];
  nameOf: (id: string) => string;
  onPlay: (move: Move) => void;
  /** Swap this dialog for his player card, the pitch's one way to his news. */
  onCard: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} width="22rem">
      <div className="flex flex-col gap-2 p-3">
        <h2 className="px-1 text-sm font-bold tracking-tight">{name}</h2>
        <MoveSheet
          moves={moves}
          options={options}
          nameOf={nameOf}
          onPlay={(move) => {
            onPlay(move);
            onClose();
          }}
        />
        <div className="flex gap-2">
          <button type="button" onClick={onCard} className={`${BUTTON} flex-1`}>
            Player card
          </button>
          <button type="button" onClick={onClose} className={`${BUTTON} flex-1`}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
