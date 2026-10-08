"use client";

import Link from "@/app/components/shell/Link";
import { BUTTON } from "./ButtonLink";

// The foot of a player dialog: the full profile beside Close.

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
