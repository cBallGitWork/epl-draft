import Link from "next/link";
import type { ReactNode } from "react";

// The app's one way out of a page: a link that looks and behaves like a button.
//
// It was the same nine classes written out in six files, which is six places to
// forget `min-h-11` — the thumb target PRODUCT.md's one-handed condition rests
// on. One file now, so the rule is kept by construction rather than by care.

/** The look, on its own, for the one link that cannot be a `ButtonLink`: the
 *  planner's way out to Fantrax is a plain external anchor and must stay one. */
export const BUTTON =
  "min-h-11 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised";

export default function ButtonLink({
  href,
  children,
  fill,
}: {
  href: string;
  children: ReactNode;
  /** Share a row equally with its siblings. Two of these side by side is the
   *  standard bottom-of-page pair. */
  fill?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${BUTTON} ${fill ? "flex-1" : ""}`}
    >
      {children}
    </Link>
  );
}
