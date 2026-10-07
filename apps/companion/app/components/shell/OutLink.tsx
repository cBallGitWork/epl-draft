import type { ReactNode } from "react";
import { BUTTON } from "./ButtonLink";

// A link that leaves the app: a plain anchor, not `next/link`, that owns its arrow and its `rel`.
// A caller's label is words only: `&nearr;` typed in a label printed as literal text.

export default function OutLink({
  href,
  className = BUTTON,
  children,
}: {
  href: string;
  className?: string;
  /** The label, in words; the arrow is added here. */
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} ↗
    </a>
  );
}
