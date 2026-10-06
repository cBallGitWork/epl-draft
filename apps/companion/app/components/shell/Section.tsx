import type { ReactNode } from "react";
import { PANEL, SMALL_CAPS } from "@/app/desk";

// A headed block on a plate, with a rule under the head: the shape every tab uses for "this part is about that".
// The plate wraps the head too, so neither title nor aside prints bare on the photograph.
// It renders whatever it is given, even nothing: whether a section is worth printing is the page's call.

export default function Section({
  title,
  children,
  aside,
}: {
  /** Omitted where the plate above already names it; with no `aside` either, no head row is drawn. */
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const heads = title !== undefined || aside !== undefined;
  return (
    <section className={PANEL}>
      {!heads ? null : (
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        {/* `font-chrome`, not `font-display`, which is reserved for figures. */}
        {title === undefined ? (
          <span />
        ) : (
          <h2 className={`font-chrome ${SMALL_CAPS} text-muted`}>{title}</h2>
        )}
        {aside ? <span className="text-2xs text-faint">{aside}</span> : null}
      </div>
      )}
      {children}
    </section>
  );
}
