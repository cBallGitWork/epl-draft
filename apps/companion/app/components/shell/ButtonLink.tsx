import Link from "next/link";
import type { ReactNode } from "react";

// The app's one way out of a page: a link that looks and behaves like a button.
//
// It was the same nine classes written out in six files, which is six places to
// forget `min-h-11` — the thumb target PRODUCT.md's one-handed condition rests
// on. One file now, so the rule is kept by construction rather than by care.
//
// **A `cm-bevel`, which is what Championship Manager's buttons are.** It was a
// 1px `--line` border on the page's own ground, which is a modern web button and
// reads as one wherever it lands — and it lands at the foot of six screens, so it
// was six chances to look like a website. The pair at the bottom of the Live tab
// is the game's own Cancel/Ok row once it is drawn this way.
//
// No `text-*` and no `bg-*` here: a plate owns its ink (desk.css), and dark ink
// on the grey plate is 7.52:1 where `--color-ink` on it would be 2.27. `hover`
// brightens the plate rather than changing the ground under it, which is what
// `league/Columns` already does to a bevelled column head.

/** The plate, on its own, for everything that presses but is not a `ButtonLink`:
 *  the planner's external anchor to Fantrax, the two dialogs' foot pairs, the
 *  search's submit, the error page's way back. Ten sites had written the same
 *  bordered box out by hand, which is ten chances for the desk to look like a
 *  website in the one place a reader is about to touch it. */
export const BUTTON =
  "cm-bevel flex min-h-11 items-center justify-center px-3 py-2.5 text-center text-sm font-medium hover:brightness-110 lg:min-h-9";

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
