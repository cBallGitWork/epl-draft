import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";

// A link drawn as the `cm-bevel` button plate, with the `min-h-11` thumb floor built in.
// No ink colour or `bg-*`: the plate owns its ink (desk.css), and `--color-ink` on the grey would be 2.27:1.

/** The plate's geometry with no type, so each button names one weight: a second one on the element never wins. */
const PLATE_BUTTON = "cm-bevel flex min-h-11 items-center justify-center px-3 py-2.5 hover:brightness-110 lg:min-h-9";

/** The plate on its own, for anything that presses but is not a `ButtonLink`. */
export const BUTTON = `${PLATE_BUTTON} text-sm font-medium`;

/** The same plate in bold, for the press a form or a screen exists for. */
export const STRONG_BUTTON = `${PLATE_BUTTON} text-sm font-bold`;

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
