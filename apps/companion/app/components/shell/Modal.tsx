"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// A panel over the page.
//
// Native `<dialog>`, so Escape, the focus trap and the inert background are the
// browser's job rather than four effects of ours.
//
// Three of these had been written out in full before this existed — the player
// card, the live player card and the move sheet — and the third is what earned
// the abstraction and said which parts actually vary. Only two do: how wide the
// panel wants to be, and what is inside it. Everything else was identical down
// to the comment explaining the backdrop test.
//
// **The width is a value, not a class.** `w-[min(24rem,92vw)]` written out at
// each call site puts the 92vw in three places, and that number is the real
// invariant here: a dialog may want any width it likes and may never be wider
// than the phone it opens on.
//
// Nothing here hands a `close` down. Every caller is rendered conditionally by
// a parent holding the open state — `{open ? <Card onClose={() => setOpen(null)} /> : null}`
// in all three — so a Close button calls `onClose` and the panel goes away
// because it is no longer rendered. Passing a ref-reading closure through
// children would be the same effect by a longer route, and React's own lint
// rule refuses it: a ref may not be read during render.

export default function Modal({
  onClose,
  width,
  anchor = "centre",
  children,
}: {
  onClose: () => void;
  /** How wide the panel wants to be, on a screen with room for it. */
  width: string;
  /** Where the panel sits. **A second position, not a second component**: the
   *  three cards that earned this abstraction are all answers to "tell me about
   *  this thing I tapped" and belong in the middle of the screen, and the
   *  section overflow is not — it is opened from the foot row by a thumb, and a
   *  menu that appears at the far end of the screen from the control that opened
   *  it makes a reader look twice for what they just asked for.
   *
   *  `centre` is the default and every existing caller keeps it untouched. */
  anchor?: "centre" | "bottom";
  children: ReactNode;
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
        if (event.target === dialog.current) onClose();
      }}
      style={{ "--modal-width": width } as CSSProperties}
      // `mb-0` rather than a `bottom-0`: a `<dialog>` in the top layer is
      // centred by its own auto margins, so the way to sit it on the floor is to
      // take the bottom margin away and leave the top one auto. The foot row is
      // `fixed` under the backdrop, so the sheet rises to meet the plate that
      // opened it.
      className={`border-line bg-surface p-0 text-ink backdrop:bg-black/70 ${
        anchor === "bottom"
          ? // No 92vw cap and only a top border: a drawer spans its screen, and
            // an inset one leaves the foot row showing down both sides of it,
            // which reads as a card that landed on the bar rather than as the
            // bar opening. Its own bottom inset, because the home indicator
            // lands on a panel sitting this low — the same reason the foot row
            // carries one.
            // `max-w-none` because the USER AGENT caps a dialog at
            // `calc(100% - 6px - 2em)`, which is why a full-width drawer came
            // out inset by an em either side with the foot row showing through
            // the gap. Preflight does not reset it.
            "mx-auto mb-0 mt-auto w-[var(--modal-width)] max-w-none border-t pb-[env(safe-area-inset-bottom)]"
          : "m-auto w-[min(var(--modal-width),92vw)] border"
      }`}
    >
      {children}
    </dialog>
  );
}
