"use client";

import Link from "next/link";
import { BUTTON } from "./ButtonLink";

// The way out of a dialog: somewhere to go, beside a way to stay.
//
// Two dialogs end with it, the squad card and the live card — every player pop-up in the app is one of the
// two (the match screens' own card went on 23 Sep 2026). CM's Cancel/Ok row once both are `cm-bevel`.
//
// In `shell/` because it is the frame's way out of any dialog, not the league's.

export default function DialogFoot({
  href,
  onClose,
}: {
  /** Where the player is written up in full. */
  href: string;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Link href={href} className={`${BUTTON} flex-1`}>
        Full profile
      </Link>
      <button type="button" onClick={onClose} className={`${BUTTON} flex-1`}>
        Close
      </button>
    </div>
  );
}
