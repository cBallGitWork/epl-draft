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
  children,
}: {
  onClose: () => void;
  /** How wide the panel wants to be, on a screen with room for it. */
  width: string;
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
      className="m-auto w-[min(var(--modal-width),92vw)] border border-line bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      {children}
    </dialog>
  );
}
