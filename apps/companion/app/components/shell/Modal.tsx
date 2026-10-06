"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// A panel over the page: a native `<dialog>`, so Escape, the focus trap and the inert background are the browser's.
// Never wider than 92vw, whatever `width` asks for.
// Callers render it conditionally and Close calls `onClose`; no `close` is handed down, as a ref may not be read in render.

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
      // A backdrop click lands on the dialog itself; one inside lands on a child.
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
