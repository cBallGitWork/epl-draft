"use client";

import Link from "next/link";
import { BUTTON } from "./ButtonLink";

// The way out of a dialog: somewhere to go, beside a way to stay.
//
// Three dialogs ended with it — the squad card, the live card and the match
// card — and the Close button was byte-identical at all three. It is Championship
// Manager's own Cancel/Ok row once both are `cm-bevel`, which `ButtonLink`
// records deciding.
//
// **In `shell/` because it crosses the registers**: two callers are the desk's
// league furniture and the third is a Premier League match. §4 puts a component
// in the directory that matches its layer, and this one's layer is the frame.
//
// `MatchPlayerCard` carried a `text-center` the other two did not. It was dead —
// `BUTTON` is a flex container with `justify-center` on it — so it went rather
// than being preserved as a prop nobody needs.

export default function DialogFoot({
  href,
  label,
  onClose,
}: {
  /** Where the dialog's subject is written up in full. Null when there is
   *  nowhere to send the reader — a match card can hold a man FPL never gave a
   *  code — and then Close is the whole row. */
  href: string | null;
  /** The way out's own words: a squad card offers a profile, a match card a
   *  season. */
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-2">
      {href === null ? null : (
        <Link href={href} className={`${BUTTON} flex-1`}>
          {label}
        </Link>
      )}
      <button type="button" onClick={onClose} className={`${BUTTON} flex-1`}>
        Close
      </button>
    </div>
  );
}
