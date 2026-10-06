import Link from "next/link";
import type { ReactNode } from "react";

// A link drawn as the `cm-bevel` button plate, with the `min-h-11` thumb floor built in.
// No ink colour or `bg-*`: the plate owns its ink (desk.css), and `--color-ink` on the grey would be 2.27:1.

/** The plate on its own, for anything that presses but is not a `ButtonLink`. */
export const BUTTON =
  "cm-bevel flex min-h-11 items-center justify-center px-3 py-2.5 text-sm font-medium hover:brightness-110 lg:min-h-9";

/** The same plate as a dropdown; `desk.css` draws its ▼ and switches off WebKit's own box, which ignores the
 *  height floor. Width stays at the call site. */
export const SELECT = "cm-bevel min-h-11 px-2.5 text-sm font-semibold lg:min-h-9";

export default function ButtonLink({
  href,
  children,
  fill,
}: {
  href: string;
  children: ReactNode;
  /** Share a row equally with its siblings. */
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
