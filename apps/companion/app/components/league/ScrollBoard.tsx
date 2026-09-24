import type { CSSProperties, ReactNode } from "react";
import { EDGE_FADE, SCROLL } from "@/app/desk";

/** A board that scrolls sideways: opaque, so a pinned lead hides the figures under it, and faded at the right edge
 *  under a thumb, so a reader knows there is more. `className` and `style` go on the scroller (an index scope). */
export default function ScrollBoard({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <span aria-hidden className={EDGE_FADE} />
      <div className={`${SCROLL} cm-scroll bg-surface ${className}`} style={style}>
        {children}
      </div>
    </div>
  );
}
