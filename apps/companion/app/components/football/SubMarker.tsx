import type { ReactNode } from "react";

/** The minute a man came on or went off in his real match, and which. */
export interface SubMark {
  minute: number;
  off: boolean;
}

/** A card with the minute he went off (▼) or came on (▲) pinned to its corner, in the sub note's amber. */
export default function SubMarker({
  minute,
  off,
  children,
}: {
  minute: number | null;
  off: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {minute === null ? null : (
        <span
          className="numeric absolute right-0 top-0 flex items-center gap-0.5 rounded-[1px] bg-bg/85 px-1 py-0.5 text-2xs font-bold leading-none text-mid"
          title={off ? `Subbed off ${minute}'` : `Came on ${minute}'`}
        >
          <svg viewBox="0 0 8 8" className="size-2 fill-current" aria-hidden>
            <path d={off ? "M0 2h8L4 7z" : "M0 6h8L4 1z"} />
          </svg>
          {minute}&prime;
        </span>
      )}
    </div>
  );
}
